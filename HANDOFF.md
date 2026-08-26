# Change handoff — audit fixes (slot capacity, product variants, CMS visibility, docs)

These changes are **already applied** to the working tree. This brief exists so
Claude Code (or a reviewer) can verify, review, and commit them — or re-apply
them from scratch if needed. Follow the repo's README + `.claude/skills/frontend-conventions/SKILL.md`.

## How to verify (run these first)
```bash
npm test            # backend: node runner + in-memory Mongo
npm run lint        # ESLint over backend/
npm run build --prefix frontend   # SPA build sanity check
git diff --stat     # review the full set of changes
```

## What changed and why

### 1. Slot capacity enforced on the main checkout (+ per-zone `maxOrders`)
- **New** `backend/services/slotReservation.js` — single source of truth for slot
  capacity. `reserveSlot({date,time,units,capacity})` atomically bumps a
  `(date,time)` slot up to `capacity` (handles first-booking create + duplicate-key
  race retry). `releaseSlot(...)` rolls a hold back. Also exports `SLOT_CAPACITY`,
  `generateTimeSlots`, hour constants.
- `backend/controllers/slotController.js` — refactored to use the service (widget
  reserves `totalQty` units; availability grid unchanged).
- `backend/controllers/orderController.js` `addOrderItems` — reserves **1 unit**
  before saving when `shippingAddress.deliveryDate`/`deliverySlot` are present.
  Delivery orders are capped at `min(SLOT_CAPACITY, zone.maxOrders)` (zone matched
  by name, active only). On save failure the hold is released. Returns **409** when
  the slot is full. Orders with no scheduled slot skip reservation (existing tests
  unaffected).
- **New** `backend/__tests__/slot.test.js` — decrement, zone-cap 409, no-slot pass.

### 2. Toppings & dough variants editable in admin
- `backend/validators/product.schema.js` — `updateProductSchema` now accepts
  optional `toppings[]` / `doughVariants[]` (`{name, price}`).
- `backend/controllers/productController.js` `updateProduct` — replaces the arrays
  only when present (partial updates don't wipe them).
- `frontend/src/screens/ProductEditScreen.js` — new page-local `VariantEditor`
  (add/remove name+price rows) for both, populated from the product, cleaned +
  coerced on submit.
- `frontend/src/screens/ProductEditScreen.scss` — BEM styles via theme tokens,
  single-column collapse < 560px.
- `backend/__tests__/product.test.js` — update-with-variants + omit-leaves-untouched.

### 3. CMS page visibility / scheduling enforced
- `backend/controllers/pageController.js` `getPageBySlug` — serves a published page
  only when visibility allows: `public` always; `scheduled` once `publishDate` has
  passed; `private` never public. Previously only `status` was checked.
- **New** `backend/__tests__/page.test.js` — public/draft/private/scheduled cases.

### 4. Docs parity & cleanup
- `docs/API.md` — added orders `status`/`stream`, `products/categories` + category
  filter, page size 12, and new zones/coupons/pages/settings/config sections;
  documented slot reservation + product variants.
- Branding: `BR-` → `GA-` order ticket ids; `brace.it` → `graniantichi.it` in the
  CMS SEO preview.
- De-duplicated `shortId` / `minsSince` into `frontend/src/brace/admin/orderStatus.js`;
  `KitchenScreen.js` and `DeliveryScreen.js` import them.

## Notes / decisions
- The slot "load" counter intentionally mixes the widget's per-pizza units with the
  storefront's one-per-order — conservative (never oversells), documented in the
  service and `docs/API.md`.
- **Not** dead code (verified, left untouched): `screens/HomeScreen.js` is the CMS
  fallback in `HomeCmsScreen`; `screens/PizzaOrderScreen.js` is wrapped by
  `PizzaOrderStandalone`.

## Files touched
```
backend/services/slotReservation.js          (new)
backend/controllers/slotController.js
backend/controllers/orderController.js
backend/controllers/productController.js
backend/controllers/pageController.js
backend/validators/product.schema.js
backend/__tests__/slot.test.js               (new)
backend/__tests__/page.test.js               (new)
backend/__tests__/product.test.js
frontend/src/screens/ProductEditScreen.js
frontend/src/screens/ProductEditScreen.scss
frontend/src/screens/AdminPagesScreen.js
frontend/src/screens/KitchenScreen.js
frontend/src/screens/DeliveryScreen.js
frontend/src/brace/admin/orderStatus.js
docs/API.md
```
