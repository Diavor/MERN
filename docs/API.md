# BRÀCE — API Reference

Base path: `/api`. JSON in/out. Auth via `Authorization: Bearer <accessToken>`; the refresh
token is an httpOnly cookie. Errors use a consistent envelope:

```json
{ "message": "human readable", "requestId": "uuid", "stack": "only outside production" }
```

Access levels: **Public** · **Private** (valid token) · **Admin** (token + `isAdmin`) ·
**Optional** (works as guest, richer if authed).

---

## Auth & users — `/api/users`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/users/login` | Public | Authenticate → access token (+ sets refresh cookie) |
| POST | `/api/users` | Public | Register → access token (+ refresh cookie) |
| POST | `/api/users/refresh` | Public (cookie) | Rotate refresh cookie → new access token |
| POST | `/api/users/logout` | Private | Invalidate refresh token |
| GET | `/api/users/profile` | Private | Current user profile |
| PUT | `/api/users/profile` | Private | Update name/email/password |
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/:id` | Admin | Get user by id |
| PUT | `/api/users/:id` | Admin | Update user (e.g. toggle isAdmin) |
| DELETE | `/api/users/:id` | Admin | Delete user |

**Login/Register response**
```json
{ "_id": "…", "name": "…", "email": "…", "isAdmin": false, "token": "<accessJWT>" }
```
Rate-limited: login/register are behind a stricter limiter (brute-force protection).

---

## Products — `/api/products`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/products?keyword=&pageNumber=&category=` | Public | Paginated catalog (page size 12); keyword matches name/brand; optional exact `category` filter (menu tabs) |
| GET | `/api/products/categories` | Public | Distinct product categories (menu tabs + admin filter) |
| GET | `/api/products/top` | Public | Top 3 by rating |
| GET | `/api/products/:id` | Public | Single product |
| POST | `/api/products` | Admin | Create sample product |
| PUT | `/api/products/:id` | Admin | Update product (incl. `toppings[]` and `doughVariants[]`, both optional) |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/reviews` | Private | Add a review (one per user) |

**List response** `{ "products": [...], "page": 1, "pages": 3 }`.

`toppings[]` and `doughVariants[]` are `{ name, price }` add-ons. On update they're
optional: when omitted the stored arrays are left untouched; when present they
replace the stored arrays wholesale.

---

## Orders — `/api/orders`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Optional | Create order (guest or authed). Reserves slot capacity when `shippingAddress.deliveryDate`/`deliverySlot` are set — **409** if the slot is full |
| GET | `/api/orders/myorders` | Private | Current user's orders (matches account **and** guest orders on the account email) |
| GET | `/api/orders/:id` | Optional* | Order by id |
| PUT | `/api/orders/:id/pay` | Private+owner/Admin | Mark paid (advances state machine `PENDING_PAYMENT → PAID`) |
| PUT | `/api/orders/:id/deliver` | Admin | Mark delivered (drives the state machine to `COMPLETED`) |
| PUT | `/api/orders/:id/status` | Admin | State-machine transition (`{ status, note? }`); **409** on an illegal move |
| GET | `/api/orders` | Admin | All orders (newest first); optional `?status=&orderType=&paymentMethod=` filters |
| GET | `/api/orders/stream?token=` | Admin (token via query) | **SSE** live order feed for the Kitchen/Delivery boards |

\* `GET /:id` is readable by the owner or an admin; guest orders are readable by id
(unguessable ObjectId) to support the post-checkout confirmation page.

Order status is governed by the state machine in `services/orderStateMachine.js`;
every change appends to `statusHistory`. The SSE stream authenticates from the
query-string `token` (the `EventSource` API can't set an `Authorization` header)
and emits `{ type: "created" | "updated", order, at }` frames.

**Create body** additionally accepts `discountPrice` (number) and `couponCode`
(string); when a `couponCode` is present the coupon's `uses` counter is
incremented (best effort).

**Create body (contract the frontend sends):**
```json
{
  "orderItems": [{ "name", "qty", "image", "price",
                   "toppings": [{ "name", "price" }], "product" }],
  "shippingAddress": { "name","phone","email","orderType","country","city","street",
                       "buildingNumber","floor","deliveryDate","deliverySlot",
                       "deliveryPrice","notes" },
  "paymentMethod": "Contanti",
  "itemsNum": 2, "itemsPrice": 37.0, "taxPrice": 0.0,
  "shippingPrice": 0.0, "totalPrice": 37.0
}
```

---

## Delivery slots — `/api/slots`  (CORS-enabled)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/slots?date=YYYY-MM-DD` | Public | Availability grid: `[{ time, available, maxCapacity }]` |

18:00–22:00 in 15-min steps, capacity 10/slot. Both the storefront checkout
(`POST /api/orders`) and the embeddable widget (`POST /api/pizza-orders`) reserve
against the same slots through `services/slotReservation.js`, so a slot can't be
oversold from one path while the other looks free. A storefront delivery order is
additionally capped by its zone's `maxOrders` when that is tighter than the global
ceiling.

---

## Widget orders — `/api/pizza-orders`  (CORS-enabled)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/pizza-orders` | Public | Create a widget order; **atomically reserves slot capacity** (409 if the slot is full) |

---

## Uploads — `/api/upload`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/upload` | Admin | Multipart image upload (`img` field); returns the stored path/URL |

MIME + size validated; storage backend is local in dev, S3-compatible in prod
(`services/storage.service.js`).

---

## Delivery zones — `/api/zones`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/zones` | Public | List zones (checkout fee/ETA/min-order + `maxOrders` per-slot cap) |
| GET | `/api/zones/:id` | Public | Single zone |
| POST | `/api/zones` | Admin | Create zone |
| PUT | `/api/zones/:id` | Admin | Update zone |
| DELETE | `/api/zones/:id` | Admin | Delete zone |

A zone's `maxOrders` caps how many storefront orders a single slot will accept for
that zone (see `POST /api/orders`).

---

## Coupons — `/api/coupons`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/coupons/validate` | Public | Validate a code against a subtotal → `{ code, type, value, discount }` (404 if unknown/expired, 400 below `minOrder`) |
| GET | `/api/coupons` | Admin | List coupons (with derived `status`) |
| POST | `/api/coupons` | Admin | Create coupon |
| PUT | `/api/coupons/:id` | Admin | Update coupon |
| DELETE | `/api/coupons/:id` | Admin | Delete coupon |

Status (`active`/`expiring`/`expired`) is derived from `active`, `expiresAt`, and
`uses`/`maxUses` — never stored, so it can't go stale.

---

## CMS pages — `/api/pages`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/pages/slug/:slug` | Public | Storefront page by slug — served only when `status: published` **and** visibility allows it (public, or scheduled with a past `publishDate`; private is never public) |
| GET | `/api/pages` | Admin | List all pages (any status) |
| POST | `/api/pages` | Admin | Create page (auto-uniquifies slug) |
| GET | `/api/pages/:id` | Admin | Page by id (editor) |
| PUT | `/api/pages/:id` | Admin | Update page |
| DELETE | `/api/pages/:id` | Admin | Delete page |

---

## Settings — `/api/settings`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/settings` | Public | Singleton store config (restaurant, hours, payments, notifications) |
| PUT | `/api/settings` | Admin | Update store config |

---

## Config

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/config/auth` | Public | `{ googleClientId, appleClientId }` — the frontend shows a provider's button only when its id is returned |
| GET | `/api/config/paypal` | Public | PayPal client id (legacy; empty for the manual-payment flow) |

---

## Ops

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness (always 200 if the process is up) |
| GET | `/readyz` | Readiness (200 only if Mongo is connected) |

Every response carries `X-Request-Id` for tracing.
