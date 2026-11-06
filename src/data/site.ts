/**
 * Site-wide configuration for the proof of concept.
 * Everything the business owner may want to switch lives here.
 */
export const SITE = {
  name: "MAD — Mighty & Delicious",
  shortName: "MAD",
  description:
    "MAD — Mighty & Delicious. Burgers, wraps, pizza and loaded fries from three Lahore branches. Pick delivery within 5 km or collect from your nearest branch.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_PK",
  currency: "PKR",
  city: "Lahore",
  country: "PK",

  poc: {
    /**
     * While true, placeholder prices are shown (always labelled "Demo price").
     * Set to false and every product without an owner-verified price becomes
     * "Price to be confirmed" and cannot be added to the cart.
     */
    showDemoPrices: true,
    /** Shows the "Demo locations" simulator inside the location modal. */
    showDemoTools: process.env.NEXT_PUBLIC_DEMO_TOOLS !== "false",
    /** Keep false until the business owner has signed off the content. */
    indexable: false,
  },

  delivery: {
    defaultRadiusKm: 5,
    /** The rule is straight-line (Haversine) distance, NOT driving distance. */
    rule: "straight-line" as const,
  },

  /**
   * Fees are intentionally unset — the owner has not supplied them and none are invented.
   * Set a number to have it flow through the cart, checkout and confirmation totals.
   */
  fees: {
    deliveryFee: null as number | null,
    taxRate: null as number | null, // e.g. 0.16 for 16 %
    minimumOrder: null as number | null,
  },
} as const;

export type SiteConfig = typeof SITE;
