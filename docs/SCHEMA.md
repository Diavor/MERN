# BRÀCE — Database Schema

MongoDB via Mongoose. All collections carry Mongoose `timestamps` (`createdAt`,
`updatedAt`). ObjectId references are shown as `→ Collection`.

---

## `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `name` | String | required |
| `email` | String | required, **unique**, lowercased, indexed |
| `password` | String | required, bcrypt hash (never returned) |
| `isAdmin` | Boolean | default `false` |
| `refreshTokenHash` | String | hash of the current refresh token (rotation) |
| `createdAt` / `updatedAt` | Date | auto |

**Indexes:** `{ email: 1 }` unique.
**Hooks:** `pre('save')` hashes `password` **only when modified** (must `return` after the
guard — the original bug). `matchPassword(plain)` compares via bcrypt.

---

## `products`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `user` | ObjectId → User | admin who created it |
| `name` | String | required |
| `img` | String | image URL/path |
| `brand` | String | required (used by keyword search) |
| `category` | String | required |
| `description` | String | required |
| `price` | Number | base price, default 0 |
| `countInStock` | Number | default 0 |
| `toppings` | `[Topping]` | paid add-ons |
| `doughVariants` | `[Topping]` | dough options (price delta) |
| `reviews` | `[Review]` | embedded |
| `rating` | Number | denormalized avg, default 0 |
| `numReviews` | Number | default 0 |

**Embedded `Topping`** `{ name: String, price: Number }` (`_id` disabled).
**Embedded `Review`** `{ name, rating, comment, user → User }` + timestamps.
**Indexes:** `{ name: 'text', brand: 'text' }` for keyword search; `{ rating: -1 }` for `/top`.

---

## `orders`

An order is an **immutable historical record**. Line items and the shipping snapshot are
denormalized at purchase time so later product/profile edits never mutate past orders.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `user` | ObjectId → User \| null | null for guest checkout |
| `orderItems` | `[OrderItem]` | see below |
| `shippingAddress` | Object | snapshot: `name, phone, email, orderType, country, city, street, buildingNumber, floor, deliveryDate, deliverySlot, deliveryPrice, notes` |
| `paymentMethod` | String | required (`Contanti` / `Bancomat`) |
| `paymentResult` | Object | `{ id, status, update_time, email_address }` (set on pay) |
| `itemsPrice` | Number | required |
| `taxPrice` | Number | default 0 |
| `shippingPrice` | Number | default 0 |
| `totalPrice` | Number | required |
| `itemsNum` | Number | line count |
| `isPaid` / `paidAt` | Boolean / Date | |
| `isDelivered` / `deliveredAt` | Boolean / Date | |

**Embedded `OrderItem`**
`{ name, qty, image, price, toppings: [{name, price}], product → Product }`.
Dough choice is folded into `toppings` as `{ name: "Impasto: X", price }` (the Order model
has no dedicated dough field — a deliberate denormalization).

**Indexes:** `{ user: 1, createdAt: -1 }` (my-orders), `{ createdAt: -1 }` (admin list /
dashboard), `{ isPaid: 1 }`, `{ isDelivered: 1 }`.

---

## `slots`  — delivery-capacity ledger

| Field | Type | Notes |
|---|---|---|
| `date` | String | `YYYY-MM-DD`, required |
| `time` | String | `HH:MM`, required |
| `count` | Number | pizzas reserved, `min: 0`, default 0 |

**Indexes:** `{ date: 1, time: 1 }` **unique** — the linchpin of the atomic reservation.
Capacity (`MAX_CAPACITY = 10`), open/close hours, and 15-min granularity live in
`slot.service.js`. Reservation is a conditional `$inc` (see ARCHITECTURE §5).

---

## `pizzaorders`  — embeddable widget orders

Separate, minimal collection for the CORS `/order-pizza` widget (decoupled from the main
account/checkout flow).

| Field | Type | Notes |
|---|---|---|
| `items` | `[{ name, qty, price }]` | |
| `deliveryDate` / `deliverySlot` | String | |
| `totalQty` / `totalPrice` | Number | |
| `status` | String enum | `pending \| confirmed \| completed \| cancelled` |

---

## Relationships

```
User 1──* Order          (order.user, nullable → guest)
User 1──* Product         (product.user = creator/admin)
User 1──* Review          (review.user, embedded in product)
Product 1──* OrderItem    (orderItem.product, denormalized snapshot)
Slot  (date,time) ── capacity ledger consulted at checkout
```
