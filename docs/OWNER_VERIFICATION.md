# Owner verification checklist

Everything below is either **verified from a public source** (and should still be confirmed by MAD) or
**demo content** that must be replaced before launch. Nothing here has been confirmed by the business owner.

Research date: 2026-11-06.

## 1. Branches — discrepancies with the original brief (action needed)

The three Google share links in the brief were opened and resolved to Google Maps place listings.
**The link order in the brief did not match the branch order.**

| Share link in brief | Actually resolves to | Place pin (lat, lng) used for delivery maths |
| --- | --- | --- |
| `share.google/4cDK8ILSfuE4rY2sD` (listed under Johar Town) | **MAD – Mighty & Delicious (Gulberg)** | 31.5228933, 74.3415417 |
| `share.google/CsvwRzf39YK7YCObI` (listed under Wapda Town) | **MAD – Mighty & Delicious (Johar Town)** | 31.4609455, 74.2872183 |
| `share.google/9Ph1YfMq6MU4iFdZx` (listed under Gulberg) | **MAD – Mighty & Delicious Valencia** | 31.3968539, 74.2559122 |

Google Maps lists **exactly three** MAD branches: Johar Town, Gulberg, Valencia. Coordinates are the listing pins
read from Google Maps (nothing estimated).

| # | Question for the owner | Why |
| --- | --- | --- |
| 1 | **Gulberg**: the brief says *Sheraz Plaza, Block B, Gulberg 2*. Google and MAD's own posts show the branch re-opened on **Zahoor Elahi Road, Gulberg 2** (next to the Haval showroom) in Oct 2026. Which is current? | The site uses the Zahoor Elahi Road listing/pin. If the old Sheraz Plaza site still operates, its coordinates are needed. |
| 2 | **Third branch**: the brief says *Wapda Town, 25-F, First Floor, Commercial Market, Block J1*. No such Google listing exists; MAD's Instagram bio and Google list **Valencia (7/C, Block H1)**. Is Wapda Town a separate / future / renamed branch? | The site uses Valencia. A real Wapda Town branch needs verified coordinates and one new record in `src/data/branches.ts`. |
| 3 | Confirm the **delivery radius (5 km)** is **straight-line** distance, and whether it is the same for every branch. | Implemented as straight-line (Haversine), configurable per branch (`deliveryRadiusKm`). Driving distance may differ. |
| 4 | Confirm **branch phone numbers**: Johar Town 0335 1116231, Gulberg 0300 1116231, Valencia 0305 1116231. | Taken from the Google listings and cross-checked against MAD's Instagram bio. Shown on the site; remove (`phone`) if not approved. |
| 5 | Opening hours | Deliberately **not shown**. Public sources conflict (Instagram says 12 PM – 2 AM; Google shows 2:30–3 AM closings). |

## 2. Menu (all demo)

* Product **names** come from public listings (e.g. foodpanda, social posts). Categories for each are an assumption.
* **Prices are demo placeholders** (round numbers), flagged `priceStatus: "demo"` and always labelled "Demo price".
  The public foodpanda listing shows different numbers; those are third-party prices and were deliberately not copied.
* **No descriptions, ingredients, sizes, variants or customisations** are claimed. Cards use a one-line `tagline`
  that only echoes the product name.
* **Availability** is `true` for everything (demo).
* Candidate categories *Sandwiches, Sides, Drinks* have no products and are hidden automatically.
* Set `SITE.poc.showDemoPrices = false` in `src/data/site.ts` to hide every unverified price; unpriced items then
  can't be added to the cart.

## 3. Deals (all demo)

* "MAD MAX" is a deal name seen in MAD's public posts; its contents here are placeholders. The other four deals
  (Burger Duo, Wrap Combo, Pizza Night, Family Bundle) are invented bundles.
* Every deal is priced as the **plain sum** of its items. No discounts, expiry dates or "active offers" exist.

## 4. Business rules not supplied (none are invented)

Configure in `src/data/site.ts → SITE.fees`:

* Delivery fee, tax rate, minimum order — all `null`. The cart says "To be confirmed" for delivery fee.
* Payment methods (the POC has no payment step).

## 5. Brand & content

* **Logo**: the MAD mark is a text-based stand-in (`components/layout/Logo.tsx`), not an official logo.
* **Our Story**: brand-voice copy only — no founding year, founders, awards, sourcing or process claims. Replace
  with MAD's real story.
* **Social links**: none shown. MAD's Instagram handle appears in public listings (`@mightyndelicious`) but was not
  supplied, so it was not added.
* **Photography**: representative stock photos (see `IMAGE_CREDITS.md`). Replace with MAD's own photos.
* **Privacy policy / Terms**: placeholders at `/privacy` and `/terms`.
* **Structured data** (JSON-LD on `/locations`): includes the branch addresses/phones above — re-check after the
  owner confirms them. The site is `noindex` until `SITE.poc.indexable` is switched on.
