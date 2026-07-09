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
| GET | `/api/products?keyword=&pageNumber=` | Public | Paginated catalog (page size 10); keyword matches name/brand |
| GET | `/api/products/top` | Public | Top 3 by rating |
| GET | `/api/products/:id` | Public | Single product |
| POST | `/api/products` | Admin | Create sample product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| POST | `/api/products/:id/reviews` | Private | Add a review (one per user) |

**List response** `{ "products": [...], "page": 1, "pages": 3 }`.

---

## Orders — `/api/orders`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Optional | Create order (guest or authed) |
| GET | `/api/orders/myorders` | Private | Current user's orders |
| GET | `/api/orders/:id` | Optional* | Order by id |
| PUT | `/api/orders/:id/pay` | Private+owner/Admin | Mark paid |
| PUT | `/api/orders/:id/deliver` | Admin | Mark delivered |
| GET | `/api/orders` | Admin | All orders (newest first) |

\* `GET /:id` is readable by the owner or an admin; guest orders are readable by id
(unguessable ObjectId) to support the post-checkout confirmation page.

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

18:00–22:00 in 15-min steps, capacity 10/slot.

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

## Ops

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness (always 200 if the process is up) |
| GET | `/readyz` | Readiness (200 only if Mongo is connected) |

Every response carries `X-Request-Id` for tracing.
