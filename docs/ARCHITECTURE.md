# BRÀCE — System Architecture

> Single-restaurant pizzeria ordering platform (MERN). This document describes the
> **production-grade target architecture**: the system design, request lifecycle,
> file structure, and the path from one box to millions of orders.

---

## 1. System overview

BRÀCE is a single-tenant e-commerce/ordering system for one pizzeria. It has three
runtime surfaces backed by one API:

```
                              ┌──────────────────────────────┐
                              │        Clients (React)        │
                              │                               │
   Storefront (BRÀCE) ──┐     │  • Customer SPA  /            │
   Admin console ───────┼────▶│  • Admin console /admin       │
   Embeddable widget ───┘     │  • /order-pizza widget (CORS) │
                              └───────────────┬───────────────┘
                                              │ HTTPS / JSON (Bearer access token
                                              │            + httpOnly refresh cookie)
                              ┌───────────────▼───────────────┐
                              │   Edge / Reverse proxy (nginx  │
                              │   or platform LB) — TLS, gzip, │
                              │   static assets, rate limiting │
                              └───────────────┬───────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │      Express API (stateless)   │
                              │  security → validate → route → │
                              │  controller → service → model  │
                              └───────┬───────────────┬────────┘
                                      │               │
                        ┌─────────────▼───┐   ┌───────▼─────────┐
                        │  MongoDB (replica│   │ Object storage  │
                        │  set) — primary  │   │ (S3-compatible) │
                        │  data store      │   │ product images  │
                        └──────────────────┘   └─────────────────┘
```

**Design principles**

- **Stateless API.** No session affinity. Auth is a short-lived JWT access token plus a
  rotating httpOnly refresh cookie, so any instance can serve any request → horizontal
  scale is a matter of adding replicas behind the load balancer.
- **Layered, not clever.** `route → validate → controller → service → model`. Business
  rules live in services (e.g. slot capacity reservation), HTTP concerns stay in
  controllers, persistence stays in models.
- **Fail loud at the boundary, degrade gracefully inside.** Env is validated at boot
  (process exits if misconfigured); requests are validated at the edge; a single error
  middleware converts every throw into a consistent JSON envelope.
- **12-factor.** Config from the environment, logs to stdout, disposable processes with
  graceful shutdown, build/release/run separation via Docker.

---

## 2. Request lifecycle

Every request flows through the same ordered pipeline (see `backend/app.js`):

```
requestId ─▶ pino-http (structured log) ─▶ helmet ─▶ cors ─▶ compression
   ─▶ express.json({ limit }) ─▶ mongo-sanitize ─▶ [rate limiter]
   ─▶ router ─▶ validate(zod schema) ─▶ auth (protect / optionalAuth / admin)
   ─▶ controller ─▶ service ─▶ mongoose model
   ─▶ (throw) ─▶ notFound ─▶ errorHandler ─▶ JSON envelope
```

- **`requestId`** — a per-request UUID attached to `req.id`, echoed in the `X-Request-Id`
  response header and every log line, so a single order can be traced end to end.
- **`validate(schema)`** — zod schemas parse `body` / `query` / `params` before the
  controller runs. Controllers can then trust their inputs.
- **auth** — `protect` (must be logged in), `admin` (must be admin), `optionalAuth`
  (attaches `req.user` if a valid token is present, otherwise continues as guest — this is
  what powers guest checkout).
- **`errorHandler`** — maps Mongoose `CastError` → 404, `ValidationError` → 422, duplicate
  key (E11000) → 409, everything else → the status the controller set (or 500). Stack
  traces are only serialized outside production.

---

## 3. File structure (target)

```
.
├── backend/
│   ├── server.js              # entrypoint: connectDB → app.listen → graceful shutdown
│   ├── app.js                 # express app assembly (middleware + routes), no listen
│   ├── config/
│   │   ├── env.js             # zod-validated environment (single source of truth)
│   │   └── db.js              # mongoose connect w/ pool + retry
│   ├── middleware/
│   │   ├── auth.js            # protect / optionalAuth / admin
│   │   ├── validate.js        # zod request validator factory
│   │   ├── requestId.js       # per-request UUID
│   │   ├── rateLimit.js       # shared + auth-specific limiters
│   │   └── error.js           # notFound + errorHandler
│   ├── validators/            # zod schemas per resource
│   │   ├── user.schema.js
│   │   ├── order.schema.js
│   │   └── product.schema.js
│   ├── controllers/           # HTTP layer (one folder — typo folder removed)
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── slotController.js
│   ├── services/              # business logic reused across controllers
│   │   ├── token.service.js   # access/refresh sign + rotate
│   │   ├── slot.service.js    # atomic capacity reservation
│   │   └── storage.service.js # local ⇄ S3 upload abstraction
│   ├── models/                # mongoose schemas + indexes
│   ├── routes/                # thin routers, one per resource
│   ├── utils/
│   │   ├── logger.js          # pino instance
│   │   └── asyncHandler.js    # (express-async-handler re-export)
│   ├── seeder.js              # data:import / data:destroy
│   └── __tests__/             # jest + supertest integration tests
├── frontend/                  # CRA React 17 SPA (BRÀCE design system)
│   └── src/
│       ├── brace/             # design system: ui/, admin/, checkout/, brace.css
│       ├── screens/           # route-level views
│       ├── store/             # redux: actions/, reducers/, store.js
│       └── App.js             # router + chrome
├── docs/                      # this file, API.md, SCHEMA.md
├── uploads/                   # local dev image store (S3 in prod)
├── Dockerfile                 # multi-stage: build frontend → run backend
├── docker-compose.yml         # app + mongo for local/prod-like runs
└── .github/workflows/ci.yml   # lint → test → build
```

**Why `app.js` is split from `server.js`:** tests import `app` and drive it with supertest
without opening a port; `server.js` owns process concerns (DB connect, listen, signals).

---

## 4. UI architecture

The frontend is a React 17 SPA (CRA) organized around the **BRÀCE design system** under
`src/brace/`, with Redux + thunk for state and react-router v5 for routing.

- **Design system (`src/brace/`)** — token-driven CSS (`brace.css` custom properties) and a
  `.b-`-prefixed utility layer to avoid collisions. `ui/` holds primitives (Nav, Footer,
  CartDrawer, FloatingCart, Field, Toast, Icon); `admin/` holds the admin shell +
  `AdminRoute` guard; `checkout/` holds the multi-step checkout widgets.
- **State (`src/store/`)** — Redux store with thunk. Cart lines use a **composite key**
  (`product|dough|sortedToppings`) so the same pizza with different toppings is a distinct
  line. Cart is persisted to `localStorage` with a version stamp for safe migrations.
- **Routing (`App.js`)** — a `<Chrome>` shell renders Nav + outlet + Footer + CartDrawer.
  Admin routes are wrapped by `AdminRoute` (redirect to `/login` unless `isAdmin`). The
  embeddable `/order-pizza` widget is `React.lazy`-loaded so its legacy `bootstrap.min.css`
  is code-split into that chunk and never enters the main bundle.
- **Data flow** — screens dispatch thunks → thunks call the API via `axios` (dev proxy →
  `:5001`, prod same-origin) → reducers update store → screens re-render. Auth token is
  read from the persisted `userInfo` and sent as a `Bearer` header.

See `docs/API.md` for the contract the store consumes.

---

## 5. Data & consistency

- **Primary store: MongoDB (replica set in prod).** Document model fits the domain: an
  Order embeds its line items and shipping snapshot (orders must be immutable historical
  records, so denormalizing name/price/image at purchase time is correct — a later product
  edit must not rewrite past orders).
- **Slot capacity is the one true concurrency hotspot.** Two customers grabbing the last
  delivery slot must not both succeed. This is handled with an **atomic conditional update**
  (`findOneAndUpdate({ count: { $lte: MAX - qty } }, { $inc })`) plus a unique
  `{date,time}` index to collapse the create race — no application-level lock needed. See
  `services/slot.service.js`.
- **Indexes** — `users.email` (unique), `orders.user + createdAt`, `orders.createdAt`,
  `products` text/keyword fields, `slots.{date,time}` (unique). Documented in `SCHEMA.md`.

---

## 6. Security model

| Concern | Control |
|---|---|
| Transport | TLS terminated at the edge; HSTS via helmet |
| Headers | helmet (CSP-ready, no-sniff, frameguard) |
| Auth | Short-lived (15 min) JWT access token + rotating httpOnly, SameSite refresh cookie (7 d) |
| Authorization | `protect` / `admin` middleware; ownership checks (a user reads only their own orders) |
| Input | zod validation on body/query/params; `express-mongo-sanitize` strips `$`/`.` operators |
| Abuse | Global rate limit + stricter limiter on `/login` & `/register` |
| Payloads | `express.json({ limit: '1mb' })`; upload MIME + size caps |
| Secrets | Loaded and **validated** at boot; no hardcoded fallbacks; never logged |
| CORS | Allowlist for first-party; explicit narrow CORS only on the embeddable widget routes |

---

## 7. Observability & operations

- **Logging** — `pino` structured JSON to stdout; `pino-http` logs every request with its
  `requestId`, latency, and status. Log aggregator (Loki/CloudWatch/Datadog) ingests stdout.
- **Health** — `GET /healthz` (liveness, always cheap) and `GET /readyz` (readiness, checks
  Mongo connection) for load-balancer and orchestrator probes.
- **Graceful shutdown** — on `SIGTERM`/`SIGINT`: stop accepting connections, drain in-flight
  requests, close the Mongo pool, exit. Prevents dropped orders on deploy/rollout.
- **Errors** — consistent JSON envelope `{ message, requestId, stack? }`; 5xx logged at
  `error`, 4xx at `warn`.

---

## 8. Scaling path (one box → millions)

The architecture is deliberately staged so each step is a config/infra change, not a rewrite:

1. **Vertical + stateless replicas.** The API is stateless → run N replicas behind the LB.
   Sessions are tokens, uploads are in object storage, so no sticky routing.
2. **MongoDB replica set.** Reads scale out to secondaries; automatic failover for HA.
   Connection pool is tuned per replica.
3. **CDN for static + images.** Frontend build and product images served from a CDN;
   object storage (S3) is the origin. App servers never serve large static payloads.
4. **Cache read-hot endpoints.** Product catalog and `/top` are read-mostly → add Redis (or
   CDN edge cache) with short TTL + cache-bust on admin write.
5. **Offload slow work to a queue.** Order confirmation emails/SMS, receipt generation, and
   analytics events move to a job queue (BullMQ/SQS) so the request path stays fast.
6. **Shard the hotspot if needed.** If order volume outgrows a single replica set, shard
   `orders` by time; the slot reservation stays atomic within its `{date,time}` document.
7. **Observability SLOs.** p95 latency, error rate, and slot-contention metrics drive
   autoscaling and alerting.

**Explicitly deferred (documented, not built):** Redis cache, message queue, real payment
provider (Stripe drops into `services/` behind the existing manual-payment contract),
Kubernetes manifests, and multi-region. These are additive and gated on real traffic.

---

## 9. Environments

| Env | Frontend | API | Mongo | Notes |
|---|---|---|---|---|
| Local | CRA dev server :3000 (proxy → :5001) | nodemon :5001 | local/Docker Mongo | `npm run dev` |
| CI | built | supertest (in-process) | `mongodb-memory-server` | no external deps |
| Prod | static build served by edge/CDN | Docker image, N replicas | managed replica set | `docker compose` / platform |

See `docs/API.md` for endpoints and `docs/SCHEMA.md` for the data model.
