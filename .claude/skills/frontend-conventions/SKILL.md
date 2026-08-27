---
name: frontend-conventions
description: Senior-frontend-engineer conventions for this repo's React frontend. Use whenever writing, editing, reviewing, or scaffolding anything under frontend/src — screens, brace/ui components, Redux store code, or SCSS partials. Trigger on requests like "create a component", "add a screen/page", "style this", "add a store/action", "new form", or any .js/.scss change in frontend/.
---

# Frontend conventions — Pizzeria Grani Antichi (MERN)

Act as a senior frontend engineer building production-grade UI for a public
storefront. Follow the conventions below exactly — they describe how this repo
actually works, not a generic ideal.

## Tech stack (do not deviate)

- JavaScript ES2022+, **not** TypeScript. JSX lives in `.js` files (Vite's
  esbuild is configured for this — do not rename to `.jsx`).
- React 17, functional components + hooks only. No classes.
- **Redux + redux-thunk** for cross-screen state (`src/store/`), accessed with
  `useSelector` / `useDispatch`. This project does **not** use MobX. Local UI
  state stays in `useState`/`useReducer`; shared ephemeral UI state uses small
  context providers (see `brace/ui/CartUI.js`, `Toast.js`).
- react-router-dom **v5**: `Switch`/`Route`/`Redirect`, `useHistory`,
  `useLocation`, `useParams`. No v6 APIs (`Routes`, `useNavigate`).
- Data fetching: the default **axios singleton** (`import axios from "axios"`)
  — `src/api/axiosConfig.js` installs a transparent 401→refresh interceptor on
  it. Never create a separate axios instance for API calls.
- Page metadata: the `Meta` component (`src/components/Meta.js`, react-helmet).
- Dev: Vite on :3000 proxying `/api` and `/uploads` to :5001. Requires Node 22
  (`nvm use 22`). Build output is `build/`, not `dist/`.

## Styling

- One colocated SCSS partial per screen/component: `XxxScreen.js` +
  `XxxScreen.scss`, imported at the top of the component file.
- **Semantic BEM-style class names** under a single block per file
  (`.menu__grid`, `.product-card__title`, state modifiers as `.is-active`,
  `.is-scrolled`). No inline Tailwind utility strings in JSX.
- Design tokens are CSS custom properties declared in `src/styles/theme.css`
  (source of truth) and bridged into Tailwind's `@theme`. In rules prefer
  `var(--accent)`, `var(--bg-2)`, etc. `@apply` is allowed sparingly for
  typography/utility bundles (`@apply font-mono uppercase;`) and requires
  `@reference "../styles/theme.css";` at the top of the partial.
- Compile-time values (breakpoints, colour math) come from
  `@use "../styles/tokens" as *;` — notably `$bp-mobile: 720px` and `$maxw`.
- Reuse the global helpers from `styles/brace.scss` instead of re-inventing
  them: `.b-container`, `.b-btn` (+ `.ghost`, `.solid`, `.sm`), `.eyebrow`,
  `.display`, `.it`, `.mono`, `.hr`, `.no-scrollbar`.
- Scope everything to the page/block. If chrome (nav, floating cart) must be
  restyled for one route, gate it behind a body class added/removed in a
  `useEffect` (see `CollectionScreen`'s `page-collection` pattern).
- Respect `prefers-reduced-motion` for any scroll/parallax/animation work.

## Component & file conventions

- Screens (route targets) live in `src/screens/` as `XxxScreen.js`; shared UI
  in `src/brace/ui/`; admin-only UI in `src/brace/admin/`; checkout pieces in
  `src/brace/checkout/`. `src/components/` is legacy (Meta, Paginate) — don't
  add to it.
- Routes are registered in `App.js` inside the `Switch`, **before** the
  `/:slug` CMS catch-all (it must stay last). Public nav links go in the
  `LINKS` array in `brace/ui/Nav.js`; admin routes are wrapped in `AdminRoute`.
- **No barrel `index.js` files** — import components by direct path.
- **No PropTypes** — this repo doesn't use them. Document and default props by
  destructuring with defaults in the function signature
  (`const Card = ({ items = [], onPick }) => …`).
- `react-bootstrap` is quarantined to the lazy-loaded `/order-pizza` widget
  (`PizzaOrderStandalone`). Never import it in new code.
- No external UI libraries. Compose from existing brace/ui primitives
  (`Loader`, `Message`, `Icon`, `Field`, `Portal`, `SectionHead`, …) first.
- **Form fields — two parallel families, split by domain; don't cross them:**
  - Storefront (`brace/ui/`): `Field` (text/`multiline`), `FieldSelect`
    (accessible custom listbox, `variant="field"|"pill"`). Used by
    login/register/profile/checkout/menu/product. Prefer these over hand-rolled
    `<label>`+`<input>`/`<textarea>`/`<select>`.
    `onChange` receives the **raw value**, not the event.
  - Admin (`brace/admin/kit.js`): `AdminFieldText` / `AdminFieldArea` /
    `AdminFieldSelect` — richer (focus state, inline `error`, `hint`, `prefix`,
    `<datalist>` options). Admin editors (e.g. `ProductEditModal`) use these;
    do **not** swap them for the storefront `Field`, which lacks those features.
  - Inline composites (search box + icon, input + adjacent button, repeatable
    name/price rows) are intentionally raw — a labelled Field doesn't fit; leave
    them.
  - React is **17** here: no `useId` or other 18-only hooks. `FieldSelect` uses
    a module-scoped id counter (`useAutoId`) instead — follow that pattern.
- Keep components under ~200 lines; extract page-local subcomponents in the
  same file, promote to `brace/ui/` only when a second screen needs them.
- Copy/content tone is Italian-first for storefront pages.

## Redux store pattern (when adding server state)

- Action-type constants in `src/store/actionTypes.js`, grouped per domain,
  using the `X_REQUEST` / `X_SUCCESS` / `X_FAIL` triad.
- Thunks in `src/store/actions/<domain>.js`: dispatch REQUEST, `await axios`,
  dispatch SUCCESS with payload, catch → FAIL with
  `error.response?.data?.message || error.message`. Auth'd calls read the token
  via `getState().userLogin.userInfo` and send a Bearer header.
- One reducer per domain in `src/store/reducers/<domain>.js`, registered in
  `store.js`. Reducer state shape is `{ loading, data…, error }`.
- Components read state with `useSelector((s) => s.<slice>)` and fire thunks
  with `useDispatch`. Select the narrowest slice you need.

## Every component must handle

1. **Loading** — `Loader` or a skeleton sized to the final layout (no layout
   shift; reserve media space with `aspect-ratio` or fixed boxes).
2. **Empty** — meaningful Italian message + optional CTA, never a blank region.
3. **Errors & edges** — `Message` for failures; tolerate long text
   (`clamp`/wrap), missing images (fallback like `ProductImage`), missing
   media files (poster/graceful degradation), slow networks.
4. **Responsive** — mobile-first; verify at 320/375/414 (phone), 768/1024
   (tablet) and 1280px. Two named breakpoints in `styles/_tokens.scss`:
   `$bp-mobile` (720px — single column, mobile nav, stacked forms) and
   `$bp-tablet` (1080px — two-column grids collapse). Rules that prevent the
   classic overflow traps:
   - auto-fill/fit grids use `minmax(min(Npx, 100%), 1fr)` so tracks can
     shrink below N on narrow phones;
   - a grid/flex item wrapping an `overflow-x: auto` table needs
     `min-width: 0` (min-width:auto trap); collapsed single-column grids use
     `minmax(0, 1fr)`, not bare `1fr`;
   - full-row grid items use `grid-column: 1 / -1`, never `span 2` (span
     forces implicit columns once the grid collapses);
   - button rows get `flex-wrap: wrap` (`.b-btn` is nowrap and will otherwise
     set the page's minimum width);
   - never nest a `position: fixed` overlay inside an element with
     `backdrop-filter`/`transform` (it becomes the containing block — this is
     why `.nav__menu` is a sibling of the header, not a child);
   - fixed off-canvas panels (CartDrawer) toggle `visibility` with their
     transform so the closed state is untabbable.

   **Admin data tables** use the shared `.admin-table` class
   (`brace/admin/kit.scss`) — put it on every `<table>` and it handles all three
   sizes for free: full table on desktop, tighter padding + scroll container on
   tablet, and stacked label/value **cards** below `$bp-mobile`. Requirements on
   the markup: give every data `<td>` a `data-label="Column name"` (it becomes
   the card's label via `::before`), put `is-lead` on the identity cell (name /
   code — it renders as the card title), and leave `data-label` off action cells
   so their buttons span the card. Never use inline `style` objects for th/td —
   compose the `.is-*` modifiers (`is-right`, `is-mono`, `is-dim`, `is-gold`,
   `is-sm`, `is-nowrap`). The `thead` is clip-hidden rather than
   `display: none`, which keeps the table's a11y roles and column headers
   intact in card mode (verified against the Chrome AX tree).
5. **Accessibility** — semantic HTML, labels/aria only where semantics fall
   short, keyboard reachable (real `<button>`/`<a>`), visible focus, WCAG AA
   contrast against the token palette, `title` on iframes, `alt` on images.
6. **Reusability** — no hardcoded content in shared components; props with
   sensible defaults; composition over configuration flags.

## Deliverable format for new feature work

When asked to build a component/flow, present in this order:
1. Component architecture (files + one-line rationale each)
2. Props/API design (name, type, default, description)
3. Full implementation (JSX + SCSS partial + store changes if needed)
4. At least 2 realistic usage examples
5. Best-practices notes: pitfalls, performance (memoization only where
   measured/obvious — `useMemo`/`useCallback` for referential stability into
   memoized children; narrow `useSelector` subscriptions), and extension points

## Verification

Run the app (`npm run dev` under Node 22; backend on :5001 + local MongoDB for
API-backed screens) and check the real route in the browser before declaring
done: states render, no console errors, existing pages unaffected, and
`npm run build --prefix frontend` passes.
