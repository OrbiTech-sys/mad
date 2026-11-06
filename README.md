# MAD — Mighty & Delicious · restaurant website (proof of concept)

A mobile-first, conversion-focused ordering website for MAD, a fast-food restaurant with three Lahore branches.
Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · React Hook Form · Zod**.

> **This is a POC.** Menu items, prices, deals and photos are demo content; no order is ever sent anywhere and no
> payment is taken. There is no database, backend or authentication. See
> [`docs/OWNER_VERIFICATION.md`](docs/OWNER_VERIFICATION.md) for what MAD must confirm.

## Run it

Requires Node 20.19+ (developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (Vitest): Haversine, 5 km boundary, order rules, cart, validation |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

No API keys are needed. Maps use free OpenStreetMap tiles; address search uses the free Nominatim service.
Optional env vars: `NEXT_PUBLIC_SITE_URL` (canonical URL), `NEXT_PUBLIC_DEMO_TOOLS=false` (hide the demo-location
simulator).

## The ordering journey

Discover → explore menu → **choose location** → check delivery → add to cart → checkout → demo confirmation.

### Smart delivery & branch selection

* **Order Now** (first time) opens a location modal with four paths: *Use my current location*, *Enter delivery
  address*, *Select pickup*, *Choose a branch*.
* **GPS** uses the Geolocation API and handles: permission denied, no GPS fix, timeout, unsupported browser,
  insecure context, and invalid coordinates — each with its own message and manual fallbacks.
* **Typed addresses are never treated as validated.** The customer searches (free OSM geocoder), then must place /
  accept a **pin on the map**; only the pin is used for the delivery check. No pin ⇒ no delivery claim.
* **Distance** is the Haversine (straight-line) distance to every active branch with verified coordinates
  (`src/lib/distance.ts`). A branch delivers when `distance <= deliveryRadiusKm` (5 km, configurable per branch).
* **Decision** (`src/lib/delivery.ts`):
  * inside ≥ 1 radius → nearest eligible branch recommended with its distance; delivery on, pickup optional;
  * outside all radii → friendly explanation, pickup at **any** active branch;
  * cannot verify → never claims delivery; offers pin / pickup.
* **Persistence** (localStorage): method, branch, coordinates, accuracy, source and typed address — validated with
  Zod on every read. Saved state is re-checked on load and when another tab changes it.
* **Location changes are never silent** (`src/lib/orderState.ts`): if the new location can't be delivered to, the
  selection switches to pickup *and* a persistent banner explains why; if another branch now applies, it says so.
  Checkout re-validates eligibility against the live stored state at the moment of submission.
* **Demo from anywhere:** the modal has a collapsible *POC test locations* panel (inside a zone, overlap of two
  zones, 4.9 km, 5.1 km, far away). Points are computed from the real branch coordinates and self-verified.
  Hide with `NEXT_PUBLIC_DEMO_TOOLS=false`.

### Cart & checkout

Add / remove / change quantity, animated drawer, persisted in localStorage, live badge. **No fees are invented:**
delivery fee, tax and minimum order are `null` in `SITE.fees` and shown as "to be confirmed". Checkout (React Hook
Form + Zod): name, **Pakistani mobile validation** (`03XX XXXXXXX`, `+92…`, `92…`), optional email, address
(required for delivery), instructions. The result is a clearly-labelled **demo** confirmation with a `MAD-DEMO-XXXXXX`
reference.

## Project structure

```
src/
  app/                    routes: / · /menu · /locations · /checkout · /privacy · /terms
                          layout.tsx (fonts, metadata) · robots · sitemap · opengraph-image · icon.svg
  components/
    layout/               Navbar, MobileNavigation, MobileOrderBar, Footer, Logo, PageHeader, ToastHost
    home/                 Hero, Marquee, Categories, FeaturedProducts, Deals, BrandStory, Locations
    menu/                 CategoryNavigation, ProductCard, ProductGrid, ProductModal, MenuExplorer
    cart/                 CartDrawer, CartItem, CartSummary
    location/             LocationModal (+ AddressStep, ResultStep, DemoLocations), BranchSelector,
                          BranchCard, BranchesExplorer, DeliveryStatus, LocationMap (Leaflet, lazy)
    checkout/             CheckoutPage, CheckoutForm, OrderConfirmation
    ui/                   Button, Badge, Input, Modal (a11y dialog), QuantityStepper, Reveal, MotionProvider
  data/                   branches.ts · products.ts · categories.ts · deals.ts · site.ts   (static seed data)
  lib/                    ← all business logic, framework-free and unit-tested
    distance.ts           Haversine, destination point, validity
    delivery.ts           eligibility + nearest eligible branch
    orderState.ts         reconcile / apply location / commit choice / validateFulfilment
    cart.ts · pricing.ts · order.ts · validation.ts · formatCurrency.ts
    geolocation.ts · geocode.ts · demoLocations.ts · storage.ts
    repository.ts         async data-access layer (swap for DB queries later)
  hooks/                  useCart · useOrder (useLocation/useBranch) · useUi · useOrderNow · useStore
  types/                  branch.ts · product.ts · order.ts
docs/                     OWNER_VERIFICATION.md · IMAGE_CREDITS.md
```

Business logic lives in `src/lib` (pure functions, no React); components only present it.
Hooks are thin adapters over small external stores (`useSyncExternalStore`) — no hydration mismatches.

## Replacing demo data

* **Branches** → `src/data/branches.ts` (coordinates, radius, phone, `active`). Leave `latitude/longitude` as
  `null` and `coordinates: "unverified"` if unsure — the branch is skipped for delivery and a dev warning is logged.
* **Products / deals / categories** → `src/data/*.ts`. Set `priceStatus: "verified"` once confirmed.
* **Fees, demo switches, SEO indexing** → `src/data/site.ts`.
* **Database later:** implement the functions in `src/lib/repository.ts` with Drizzle queries; no component imports
  the static arrays directly.

## Limitations of the POC

* Straight-line delivery radius, not driving distance or delivery zones.
* Browser/IP geolocation can be kilometres off; the UI offers a draggable pin and warns near the 5 km edge.
* Free OSM tiles and Nominatim are rate-limited and fine for a demo only — use a commercial provider in production.
* Block-level Pakistani addresses are patchily indexed by the free geocoder; the manual pin is the reliable path.
* Cart/location live in localStorage (per browser/device). No accounts, no order history, no real payments.
* Photos are stock; the logo is a text stand-in.
* Next.js `cacheComponents` is enabled (from the scaffold). In *dev*, an edited server component can serve a stale
  prerender until the dev server is restarted; `next build` is unaffected.

## Recommended next steps for production

1. Owner confirms branches, phones, hours, menu, prices, real deals ([checklist](docs/OWNER_VERIFICATION.md)).
2. Real photography and the official logo; social links; final privacy policy and terms.
3. Backend: Drizzle + Postgres for menu/orders; server-side re-validation of delivery eligibility.
4. Payments (e.g. Pakistani gateways / COD flow), order confirmation via SMS/WhatsApp, branch order dashboard.
5. Driving-distance or polygon delivery zones; per-branch hours and live availability; delivery fee rules.
6. Commercial maps + geocoding with an API key; address autocomplete.
7. Analytics, error monitoring, accessibility audit with real assistive tech, Lighthouse budget in CI, flip
   `SITE.poc.indexable` and submit the sitemap.
