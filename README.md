# BRÀCE — Pizzeria Napoletana

A production-grade, single-restaurant pizza ordering platform. React SPA (the BRÀCE
design system) on a hardened Node/Express/MongoDB API, wired for guest checkout,
delivery-slot capacity, an admin console, and an embeddable ordering widget.

- **System design:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **API reference:** [`docs/API.md`](docs/API.md)
- **Data model:** [`docs/SCHEMA.md`](docs/SCHEMA.md)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 17 (CRA), Redux + thunk, react-router v5, BRÀCE design system |
| API | Node 22, Express 4, Mongoose 9 (ESM) |
| Data | MongoDB (replica set in prod) |
| Auth | Short-lived JWT access token + rotating httpOnly refresh cookie |
| Security | helmet, CORS allowlist, rate limiting, zod validation, mongo-sanitize |
| Observability | pino structured logs, request IDs, `/healthz` + `/readyz` |
| Quality | Node test runner + supertest (in-memory Mongo), ESLint, Prettier, GitHub Actions |
| Delivery | Multi-stage Docker image, docker-compose |

---

## Quickstart (local dev)

**Prereqs:** Node 22, a running MongoDB (`brew services start mongodb-community`).

```bash
# 1. Configure environment
cp .env.example .env
# generate secrets:
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET='+require('crypto').randomBytes(32).toString('hex'))"
# paste both into .env

# 2. Install
npm install
npm install --prefix frontend

# 3. Seed sample data (products + admin user)
npm run data:import

# 4. Run API (:5001) + frontend (:3000) together
npm run dev
```

Open http://localhost:3000. Admin console at `/admin` (seeded admin:
`admin@example.com` / `123456`).

> The API validates `.env` at boot and **refuses to start** if a required var is
> missing or a secret is under 16 chars — by design.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + frontend concurrently |
| `npm run server` | API only (nodemon) |
| `npm start` | API only (production entry) |
| `npm test` | Backend integration tests (in-memory Mongo, serial) |
| `npm run lint` | ESLint over `backend/` |
| `npm run format` / `format:check` | Prettier write / verify |
| `npm run data:import` / `data:destroy` | Seed / wipe the database |

---

## Testing

Integration tests drive the real Express app with `supertest` against an ephemeral
`mongodb-memory-server` — no external services, no fixtures to clean up.

```bash
npm test
```

Covers auth (register/login/refresh/profile), the password-rehash regression,
product CRUD + authorization, guest orders, order ownership, and the manual-payment
path. CI (`.github/workflows/ci.yml`) runs lint + format-check + tests on the backend
and builds the frontend on every push/PR.

---

## Docker

```bash
# Build the frontend into the image and run API + Mongo together:
export JWT_SECRET=... JWT_REFRESH_SECRET=...
docker compose up --build
# API + built SPA on http://localhost:5001
```

The image is multi-stage (build frontend → install prod deps → lean runtime), runs
as a non-root user, and ships a `HEALTHCHECK` hitting `/healthz`.

---

## Production notes

- **Secrets:** set `JWT_SECRET` and `JWT_REFRESH_SECRET` (distinct, ≥32 bytes) via
  your platform's secret store. Never commit `.env`.
- **Database:** point `MONGO_URI` at a replica set. Run `Model.syncIndexes()` as a
  deploy step (the app disables `autoIndex` in production).
- **Image storage:** set `STORAGE_DRIVER=s3` with `S3_BUCKET`/`S3_REGION` (local disk
  is ephemeral in containers) and `npm i @aws-sdk/client-s3`.
- **Edge:** terminate TLS and serve static assets/images from a CDN in front of the
  API. Set `CORS_ORIGINS` if the frontend is served from a different origin.
- **Payments:** the flow is manual (Contanti/Bancomat). A real provider (Stripe)
  drops into `backend/services/` behind the existing order/payment contract.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §8 for the full scale-out path.

---

## Hardening changelog (this pass)

Fixed three latent bugs and hardened the API for production:

- 🐛 **Password re-hash** — profile updates re-hashed an already-hashed password
  (missing `return` + Mongoose 9 hook signature) → users locked out. Fixed + regression test.
- 🐛 **Broken deletes** — `Document.remove()` was removed in Mongoose 7; delete
  user/product threw. Switched to `deleteOne()`.
- 🐛 **Unguarded pay** — `PUT /orders/:id/pay` let any logged-in user mark any order
  paid and crashed on a missing payer. Now owner/admin only, crash-safe.
- 🔒 Added helmet, rate limiting, zod validation, mongo-sanitize, body limits,
  refresh-token rotation, order ownership checks, and admin-only uploads.
- 🔭 Added pino logging + request IDs, health/readiness probes, graceful shutdown,
  model indexes, env validation, tests, CI, and Docker.
