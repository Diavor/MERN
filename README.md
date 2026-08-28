# Pizzeria Grani Antichi — Ordering Platform

A production-grade, **single-restaurant** pizza ordering platform. A React SPA
(the in-house "brace" design system) on a hardened Node/Express/MongoDB API,
built for guest checkout, delivery-slot capacity, live kitchen/delivery views,
a full admin console, a CMS for storefront pages, and an embeddable ordering
widget.

> **Handoff note for Claude / contributors.** This README is the map. It
> describes what exists today and *where* to change things. Deeper reference
> docs live in [`docs/`](docs/) (`ARCHITECTURE.md`, `API.md`, `SCHEMA.md`,
> `SOCIAL_LOGIN.md`) — note
> they still use the project's former brand name **"BRÀCE"**; the app has since
> been rebranded to **Pizzeria Grani Antichi**, but the architecture, API, and
> schema they describe are current. Frontend conventions are codified in
> `.claude/skills/frontend-conventions/SKILL.md` — **read it before touching
> anything under `frontend/src`.**

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 17 (functional + hooks), Redux + redux-thunk, react-router **v5**, Vite 5, Sass + Tailwind v4 (via PostCSS) |
| API | Node 22, Express 4, Mongoose 9 — **ESM throughout** (`"type": "module"`) |
| Data | MongoDB (local for dev; replica set in prod) |
| Auth | Short-lived JWT access token + rotating httpOnly refresh cookie; Google & Apple social login |
| Security | helmet + CSP, CORS allowlist, rate limiting, zod validation, express-mongo-sanitize |
| Realtime | Server-Sent Events (SSE) for the live order stream |
| Observability | pino structured logs, per-request IDs, `/healthz` + `/readyz` probes |
| Quality | Node test runner + supertest (in-memory Mongo), ESLint, Prettier, GitHub Actions |
| Delivery | Multi-stage Docker image, docker-compose, Heroku Procfile |

Config is **validated at boot** by `backend/config/env.js` (zod) — the process
refuses to start with a missing/malformed environment rather than failing mid-request.

---

## Quickstart (local dev)

**Prereqs:** Node 22 (`nvm use 22`), a running MongoDB
(`brew services start mongodb-community`).

```bash
# 1. Environment
cp .env.example .env
# generate two secrets and paste them in:
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET='+require('crypto').randomBytes(32).toString('hex'))"

# 2. Install
npm install
npm install --prefix frontend

# 3. Seed the database (users, pizzas, beverages, desserts, zones, coupons, settings)
npm run data:import      # wipe + reseed;  npm run data:destroy to clear

# 4. Run API (:5001) + Vite SPA (:3000) together
npm run dev
```

Open **http://localhost:3000**. Vite proxies `/api` and `/uploads` to the API on
`:5001`.

**Seeded logins** (password `123456` for all): `admin@example.com` (admin),
`john@example.com`, `jane@example.com`.

### Everyday scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + SPA concurrently (dev) |
| `npm run server` | API only (nodemon) |
| `npm run client` | SPA only (Vite) |
| `npm run data:import` / `data:destroy` | seed / wipe the DB |
| `npm test` | backend tests (Node runner + in-memory Mongo) |
| `npm run lint` / `npm run format` | ESLint / Prettier over `backend/` |
| `npm run build --prefix frontend` | production SPA build → `frontend/build/` |

---

## What the app does (features)

**Storefront (public)**
- CMS-driven **home** page (`HomeCmsScreen`) assembled from admin-authored blocks.
- **Menu** with server-side category filtering (`Pizza`, `Bevande`, `Dolci`),
  search, sort, pagination.
- **Product** detail with per-pizza dough variants and toppings (priced add-ons).
- **Cart drawer** with delivery/pickup toggle and an **upsell rail**
  (`CartUpsell`) that nudges drinks → dessert, adding in place without leaving
  the cart.
- **Checkout** (`/checkout`): guest or logged-in, contact + address, delivery
  **zone** selection, **date + capacity-limited time slot**, promo code,
  payment method, notes. 3-step flow, all local `useState`.
- **Order tracking** page, **profile** with order history.
- Editorial pages: `/story`, `/collezione`, plus arbitrary CMS pages at `/:slug`.
- **Embeddable pizza-order widget** (`/order-pizza`, `PizzaOrderStandalone`) —
  the only place `react-bootstrap` is allowed; lazy-loaded and quarantined.

**Admin console** (all gated behind `AdminRoute` / `admin` middleware)
- Dashboard, **live orders** list + detail, **Kitchen** and **Delivery** views
  fed by the SSE stream.
- Product catalog CRUD, users, **delivery zones**, **coupons**, **CMS pages**
  (block editor), **customers**, and **settings** (hours, payments, notifications).

---

## Order lifecycle (state machine)

Order status is governed by an explicit state machine in
`backend/services/orderStateMachine.js` — transitions are validated server-side
and every change is appended to `statusHistory`.

```
PENDING_PAYMENT → PAID → CONFIRMED → PREPARING → READY → PACKED → OUT_FOR_DELIVERY → COMPLETED
        ↘ CANCELLED / FAILED           ↘ CANCELLED / REFUNDED …
```

Full transition table: `TRANSITIONS` in that file. Admins drive transitions via
`PUT /api/orders/:id/status`; changes are pushed to Kitchen/Delivery clients over
SSE (`backend/services/orderEvents.js`, consumed by
`frontend/src/brace/admin/useOrderStream.js`).

---

## Repository map

```
.
├── backend/                    # Express API (ESM)
│   ├── server.js               # boot: connect DB, start HTTP
│   ├── app.js                  # middleware pipeline + route mounting + SPA fallback
│   ├── config/                 # env.js (zod-validated), db.js
│   ├── routes/                 # one router per domain (product, user, order, …)
│   ├── controllers/            # request handlers (express-async-handler)
│   ├── models/                 # Mongoose schemas
│   ├── middleware/             # auth, validate (zod), error, rateLimit, requestId
│   ├── validators/             # zod request schemas
│   ├── services/               # oauth, token, storage, orderEvents, orderStateMachine
│   ├── data/                   # seed data (pizzas, beverages, desserts, zones, …)
│   ├── seeder.js               # npm run data:import / :destroy
│   └── __tests__/              # supertest + mongodb-memory-server
├── frontend/                   # React SPA (Vite)
│   ├── vite.config.js          # JSX-in-.js, /api + /uploads proxy, build→build/
│   └── src/
│       ├── App.js              # all routes (Switch); /:slug CMS catch-all stays LAST
│       ├── screens/            # route targets — XxxScreen.js + XxxScreen.scss
│       ├── brace/ui/           # shared design-system components (Nav, CartDrawer, …)
│       ├── brace/admin/        # admin-only UI + kit + useOrderStream
│       ├── brace/checkout/     # checkout pieces (DatePicker, TimeSlotPicker, zones)
│       ├── store/              # Redux: actionTypes, actions/<domain>, reducers/<domain>
│       ├── api/axiosConfig.js  # axios singleton with 401→refresh interceptor
│       ├── services/           # print.js (kitchen ticket printing)
│       ├── components/         # legacy (Meta, Paginate) — don't add here
│       └── styles/             # theme.css (tokens), _tokens.scss, brace.scss
├── docs/                       # ARCHITECTURE.md, API.md, SCHEMA.md (brand: "BRÀCE")
├── design/                     # static JSX design references (not built)
├── Dockerfile, docker-compose.yml, Procfile
└── .claude/skills/…            # frontend-conventions skill (read before frontend work)
```

---

## Data model (collections)

Mongoose, all with `timestamps`. Full detail in [`docs/SCHEMA.md`](docs/SCHEMA.md).

| Model | Purpose | Notable fields |
|---|---|---|
| **User** | accounts | `isAdmin`, `authProvider` (local/google/apple), `refreshTokenHash` |
| **Product** | pizzas, beverages, desserts | `category`, `price`, `countInStock`, embedded `toppings`, `doughVariants`, `reviews` |
| **Order** | placed orders | `orderItems[]`, `shippingAddress` (incl. `orderType`, `deliveryDate/Slot`), `status` + `statusHistory[]`, `paymentMethod` |
| **Slot** | delivery/pickup capacity | `date`, `time`, `count` (booked) |
| **Zone** | delivery areas | `fee`, `freeThreshold`, `minOrder`, `eta`, `maxOrders`, hours, coverage (radius/postal/polygon) |
| **Coupon** | promo codes | `type` (percent/fixed), `value`, `minOrder`, `maxUses`, `uses`, `expiresAt`, `active` |
| **Page** | CMS pages | `slug`, `status` (draft/published), `blocks[]`, `seo` |
| **Setting** | singleton store config | `restaurant`, `hours[]`, `payments`, `notifications` |
| **PizzaOrder** | embeddable widget submissions | standalone from the main order flow |

Product **categories** are free-form strings driven by the data. The three in use
are `Pizza`, `Bevande`, `Dolci`; the menu tabs and admin category autocomplete
are generated from `GET /api/products/categories` (distinct values) merged with
those presets. Seed data lives in `backend/data/{pizzas,beverages,desserts}.js`.

---

## API surface (selected)

Base path `/api`, JSON in/out. Access token via `Authorization: Bearer <token>`;
refresh via httpOnly cookie. Full reference: [`docs/API.md`](docs/API.md).

| Method & path | Access | Notes |
|---|---|---|
| `GET /api/products` | public | list; `?keyword=&pageNumber=&category=` |
| `GET /api/products/categories` | public | distinct categories (menu tabs) |
| `GET /api/products/top` | public | featured/top-rated |
| `POST/PUT/DELETE /api/products…` | admin | catalog CRUD |
| `POST /api/products/:id/reviews` | user | product review |
| `POST /api/users/login` | public | email/password (rate-limited) |
| `POST /api/users/google` · `/apple` | public | social login |
| `POST /api/users/refresh` · `/logout` | cookie/user | rotate / end session |
| `POST /api/orders` | guest/user | place order (optionalAuth) |
| `GET /api/orders` | admin | all orders |
| `GET /api/orders/stream` | admin | **SSE** live stream (`?token=`) |
| `GET /api/orders/myorders` | user | own orders |
| `PUT /api/orders/:id/pay` · `/deliver` · `/status` | user/admin | payment / delivery / state machine |
| `GET /api/slots?date=` | public (widget CORS) | slot availability |
| `GET /api/zones` · `POST` | public / admin | delivery zones |
| `POST /api/coupons/validate` | public | validate a promo against a subtotal |
| `GET/POST /api/coupons` | admin | manage coupons |
| `GET /api/pages/slug/:slug` | public | CMS page by slug |
| `GET/POST /api/pages` | admin | manage CMS pages |
| `GET /api/settings` · `PUT` | public / admin | store config |
| `POST /api/upload` | admin | image upload (local or S3) |
| `POST /api/pizza-orders` | public (widget CORS) | embeddable widget submit |
| `GET /healthz` · `/readyz` | public | liveness / readiness |

Two endpoints (`/api/slots`, `/api/pizza-orders`) expose **wildcard, credential-less
CORS** because external sites embed the widget; everything else is first-party.

---

## Frontend architecture

- **Screens** = route targets in `src/screens/`, each with a colocated `.scss`
  partial. Routes are registered in `App.js` inside the `Switch`; the `/:slug`
  CMS catch-all **must stay last**.
- **Shared state** = Redux (`src/store/`). Server-state slices follow the
  `X_REQUEST`/`X_SUCCESS`/`X_FAIL` triad: action-type constants in
  `actionTypes.js`, thunks in `actions/<domain>.js`, reducer per domain in
  `reducers/<domain>.js`, registered in `store.js`.
- **Ephemeral UI state** = small context providers (`brace/ui/CartUI.js`,
  `Toast.js`), not Redux.
- **Data fetching** = the **axios singleton** (`src/api/axiosConfig.js`), which
  installs a transparent 401 → refresh → retry interceptor. Never create a
  separate axios instance.
- **Styling** = semantic BEM class names, one block per file; design tokens are
  CSS custom properties in `styles/theme.css`; compile-time values (breakpoints)
  from `styles/_tokens.scss`. Reuse global helpers from `styles/brace.scss`
  (`.b-container`, `.b-btn`, `.eyebrow`, `.display`, …). Storefront copy is
  Italian-first.
- **No TypeScript, no PropTypes, no barrel `index.js`.** JSX lives in `.js`
  files (Vite/esbuild is configured for this — do not rename to `.jsx`).

The full ruleset (responsive traps, admin-table conventions, a11y, loading/empty/
error requirements) is in `.claude/skills/frontend-conventions/SKILL.md`.

---

## Environment variables

Defined and validated in `backend/config/env.js`; template in `.env.example`.

| Var | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | — | `development` | `development` \| `test` \| `production` |
| `PORT` | — | `5001` | API port |
| `MONGO_URI` | **yes** | — | Mongo connection (replica set in prod) |
| `JWT_SECRET` | **yes** | — | access-token signing (≥16 chars) |
| `JWT_REFRESH_SECRET` | prod only | falls back to `JWT_SECRET` in dev | refresh-token signing |
| `ACCESS_TOKEN_TTL` | — | `15m` | access-token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | — | `7` | refresh-cookie lifetime |
| `CORS_ORIGINS` | — | `""` | comma-separated first-party origins (empty = same-origin) |
| `REDIS_URL` | — | `redis://127.0.0.1:6379` | BullMQ queues (emails, image cleanup); jobs run inline if unreachable |
| `STORAGE_DRIVER` | — | `local` | `local` (uploads/) or `s3` (any S3-compatible store, e.g. Cloudflare R2) |
| `S3_BUCKET` / `S3_REGION` | if s3 in prod | — | S3 target (R2: `S3_REGION=auto`) |
| `S3_ENDPOINT` | if s3-compatible | — | custom endpoint, e.g. R2's `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL` | if s3 | — | public base URL for stored objects (R2 `.r2.dev` subdomain or a custom domain) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | if s3 | — | credentials (R2 API token) |
| `IMAGE_RECONCILE_SCHEDULE` | — | `0 4 * * 0` | cron for the weekly orphan sweep (s3 driver + Redis only) |
| `IMAGE_RECONCILE_DRY_RUN` | — | `true` | must be explicitly set to `false` to let the sweep actually delete |
| `IMAGE_RECONCILE_SAFETY_HOURS` | — | `48` | never delete an unreferenced object younger than this |
| `LOG_LEVEL` | — | `info` | pino level |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | — | `900000` / `300` | global API limiter |
| `GOOGLE_CLIENT_ID` | — | — | Google OAuth Web client id (button hidden if unset) — setup: [`docs/SOCIAL_LOGIN.md`](docs/SOCIAL_LOGIN.md) |
| `APPLE_CLIENT_ID` | — | — | Sign in with Apple **Service ID** (button hidden if unset) — setup: [`docs/SOCIAL_LOGIN.md`](docs/SOCIAL_LOGIN.md) |
| `PAYPAL_CLIENT_ID` | — | — | legacy, unused by the manual-payment flow |

---

## Till printer setup (dual fiscal + non-fiscal receipts)

Clicking **Stampa ricevuta** in the admin console prints the customer receipt
on the fiscal printer *and* a copy marked `DOCUMENTO NON FISCALE` on a second
printer — silently, no print dialog. A browser can't do that (one printer, and
always a dialog), so a small local service does it instead.

- **[`print-agent/`](print-agent/README.md)** runs **on the till PC**, next to
  the printers, and drives them over ESC/POS. Install and run it there
  (`npm install && npm start`, or under pm2/nssm to survive reboots); it is
  **not** deployed to Railway. Full setup, config and API in its own README.
- **Hardware config** (USB device paths / printer IPs) lives only in
  `print-agent/printers.config.json` on that machine — gitignored, and
  deliberately never in MongoDB, since it's specific to the physical PC.
- **Logical routing** lives in the admin console → **Impostazioni → Stampa**:
  the agent's URL, which printer ids get the receipt, and which also get the
  non-fiscal copy. The ids (`fiscal`, `bar`, …) are the shared vocabulary
  between that screen and `printers.config.json`.
- **No agent, no problem.** `printReceiptDual` (`frontend/src/services/print.js`)
  tries the agent with a 2.5s timeout and falls back to the ordinary browser
  print dialog whenever it's unconfigured, unreachable, or reports that nothing
  printed — so dev machines and any till without the setup keep working exactly
  as before. It deliberately does *not* fall back on a partial failure (fiscal
  printed, bar printer down), which would hand the customer a duplicate.
- **No hardware to test against?** Run the agent with `npm run dev` (`DRY_RUN`):
  it renders real ESC/POS bytes and logs them instead of printing.

---

## Image lifecycle (uploads → storage → cleanup)

Every accepted upload (`POST /api/upload[/multiple]`, admin-only, jpg/jpeg/png/webp,
5 MB cap) is resized and **converted to WebP** synchronously, before a URL is
ever returned — `backend/services/imageProcessor.js` (`IMAGE_PROFILES.product`:
1600px max width, quality 82) does the encode; `storage.service.js` also
rejects absurdly large source resolutions (>65MP or >10000px a side) before
that. This runs synchronously for *both* drivers deliberately: once a URL is
handed back it gets persisted into a document (or a browser's in-flight form
state), so it can never safely be renamed out from under the caller by a
later background job.

**Orphan cleanup** has two layers, both going through `deleteUpload()` /
`backend/services/imageCleanup.js`:

- **Event-driven** — when a product's `img`/`images`, or a CMS page's
  `featuredImage`/`seo.ogImage`/block images, are replaced or the document is
  deleted, the controller enqueues `JOB.DELETE_IMAGE` (via the same
  Redis-backed queue as everything else, falling back to inline execution
  when Redis isn't configured) for whatever's no longer referenced *by that
  document*. The job handler re-checks the **entire database** — crucially
  including `Order.orderItems[].image`, a permanent historical snapshot taken
  at checkout — before deleting anything, so a past order's receipt can never
  be broken by a later product-photo swap.
- **Reconciliation sweep** — a weekly (`IMAGE_RECONCILE_SCHEDULE`) BullMQ
  repeatable job lists the bucket and deletes objects that are both
  unreferenced *and* older than `IMAGE_RECONCILE_SAFETY_HOURS` (never
  younger, regardless of reference state). Defaults to
  `IMAGE_RECONCILE_DRY_RUN=true` (logs what it would delete without deleting)
  — must be explicitly turned off. No-ops on the `local` driver (it isn't the
  storage-cost problem this exists for) and when Redis isn't configured; run
  it manually with `node backend/reconcileImages.js [--delete]` in that case
  (e.g. from the Railway service's Console tab).

---

## Testing

```bash
npm test          # backend/__tests__/*.test.js — sequential, in-memory Mongo
```

Covers auth (`auth.test.js`), orders (`order.test.js`), and products
(`product.test.js`) with supertest against the real Express app on
`mongodb-memory-server`. Frontend tests aren't configured yet — add vitest if
you introduce them (`frontend` test script is a no-op placeholder).

---

## Deployment

- **Docker:** multi-stage `Dockerfile` (build SPA → install prod deps → lean
  `node:22-alpine` runtime serving API + built SPA). `docker-compose.yml` wires
  API + MongoDB.
- **Heroku:** `Procfile` (`web: node backend/server.js`) + `heroku-postbuild`
  builds the frontend.
- In production the API serves `frontend/build/` statically with an SPA fallback
  (any non-`/api` GET → `index.html`), so it's a **single-origin** deploy by
  default. Split-origin frontends need `CORS_ORIGINS` set.

---

## Extending the app — where things go

| You want to… | Touch |
|---|---|
| Add a product category (e.g. `Antipasti`) | new `backend/data/<name>.js` → wire into `seeder.js`; add to the presets in `ProductEditScreen.js` and any upsell groups in `CartUpsell.js` |
| Add an API endpoint | `routes/` (mount in `app.js`) → `controllers/` → zod schema in `validators/` → `middleware/validate` |
| Add a Mongoose collection | `models/` → seed in `data/` + `seeder.js` → document in `docs/SCHEMA.md` |
| Add a storefront page | `screens/XxxScreen.{js,scss}` → register in `App.js` (before `/:slug`) → nav link in `brace/ui/Nav.js` |
| Add an admin page | `screens/AdminXxxScreen.js` wrapped in `AdminRoute`; use `.admin-table` + `brace/admin/kit` fields |
| Add shared server state | `store/actionTypes.js` → `actions/<domain>.js` → `reducers/<domain>.js` → register in `store.js` |
| Change order statuses/flow | `backend/services/orderStateMachine.js` (`STATUS`, `TRANSITIONS`) |
| Add a payment provider | `settings` payments config + checkout `Step2` + order pay controller |

**Before any frontend change, load
`.claude/skills/frontend-conventions/SKILL.md`.** It's the authoritative style
guide for this codebase (stack constraints, responsive pitfalls, a11y, the
loading/empty/error checklist every component must satisfy).

---

## License

MIT.
