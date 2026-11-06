import type { Branch } from "@/types/branch";

/**
 * Centralised branch configuration. The single source of truth for the delivery maths.
 *
 * VERIFICATION LOG (2026-11-06)
 * ---------------------------------------------------------------------------
 * The three Google share links in the original brief were opened and resolved to
 * Google Maps place listings. The brief's link-to-branch order did NOT match:
 *
 *   share.google/4cDK8ILSfuE4rY2sD -> "MAD - Mighty & Delicious (Gulberg)"
 *   share.google/CsvwRzf39YK7YCObI -> "MAD - Mighty & Delicious (Johar Town)"
 *   share.google/9Ph1YfMq6MU4iFdZx -> "MAD - Mighty & Delicious Valencia"
 *
 * Coordinates below are the place pins (`!3d<lat>!4d<lng>`) of those listings, as shown by
 * Google Maps. Nothing is estimated. Google Maps lists exactly three MAD branches.
 *
 * DISCREPANCIES THE OWNER MUST CONFIRM (also surfaced by getBranchConfigWarnings()):
 *  1. Gulberg: the brief says "Sheraz Plaza, Block B, Gulberg 2". Google and MAD's own
 *     posts show the branch re-opened on Zahoor Elahi Road, Gulberg 2 (Oct 2026). The
 *     listing address/pin is used here.
 *  2. Third branch: the brief says "Wapda Town (25-F, Block J1)". No Wapda Town listing
 *     exists on Google Maps; MAD's Instagram bio and Google list a Valencia branch
 *     (7/C, Block H1). The Valencia listing is used. If a separate Wapda Town branch
 *     exists, add a record here with verified coordinates.
 *
 * To add or edit a branch: change this file only. Leave latitude/longitude as `null` and
 * `coordinates: "unverified"` when unsure — an unverified branch is skipped by delivery
 * maths and a configuration warning is logged in development.
 */
export const BRANCHES: Branch[] = [
  {
    id: "johar-town",
    name: "Johar Town",
    displayName: "MAD Johar Town",
    address: "15 Civic Centre, Block D2, Phase 1, near Mian Plaza, Johar Town, Lahore",
    latitude: 31.4609455,
    longitude: 74.2872183,
    googleMapsUrl: "https://share.google/CsvwRzf39YK7YCObI",
    deliveryRadiusKm: 5,
    active: true,
    pickupAvailable: true,
    phone: { display: "0335 1116231", tel: "+923351116231" },
    verification: {
      coordinates: "google-maps-place-pin",
      addressSource:
        "Google Maps listing 'MAD - Mighty & Delicious (Johar Town)'; matches the brief's address.",
      phoneSource:
        "Google listing, cross-checked with the number in MAD's Instagram bio (@mightyndelicious).",
      ownerChecks: ["Confirm phone number", "Confirm address wording"],
    },
  },
  {
    id: "gulberg",
    name: "Gulberg",
    displayName: "MAD Gulberg",
    address: "Zahoor Elahi Road, Block O, Gulberg 2, Lahore",
    latitude: 31.5228933,
    longitude: 74.3415417,
    googleMapsUrl: "https://share.google/4cDK8ILSfuE4rY2sD",
    deliveryRadiusKm: 5,
    active: true,
    pickupAvailable: true,
    phone: { display: "0300 1116231", tel: "+923001116231" },
    verification: {
      coordinates: "google-maps-place-pin",
      addressSource:
        "Google Maps listing 'MAD - Mighty & Delicious (Gulberg)' (Zahoor Elahi Rd, Block O, Gulberg 2).",
      phoneSource:
        "Google listing, cross-checked with the number in MAD's Instagram bio (@mightyndelicious).",
      briefAddress: "Sheraz Plaza, Block B, Gulberg 2, Lahore",
      ownerChecks: [
        "Brief lists Sheraz Plaza, Block B; Google and MAD's own posts show the relocated branch on Zahoor Elahi Road (Oct 2026). Confirm which is current.",
        "Confirm phone number",
      ],
    },
  },
  {
    id: "valencia",
    name: "Valencia",
    displayName: "MAD Valencia",
    address: "7/C, Block H1, Valencia, Lahore",
    latitude: 31.3968539,
    longitude: 74.2559122,
    googleMapsUrl: "https://share.google/9Ph1YfMq6MU4iFdZx",
    deliveryRadiusKm: 5,
    active: true,
    pickupAvailable: true,
    phone: { display: "0305 1116231", tel: "+923051116231" },
    verification: {
      coordinates: "google-maps-place-pin",
      addressSource:
        "Google Maps listing 'MAD - Mighty & Delicious Valencia' (unclaimed profile); MAD's Instagram bio lists Valencia as branch 3.",
      phoneSource:
        "Google listing, cross-checked with the number in MAD's Instagram bio (@mightyndelicious).",
      briefAddress: "25-F, First Floor, Commercial Market, Block J1, Wapda Town, Lahore",
      ownerChecks: [
        "Brief lists a Wapda Town branch (25-F, Block J1) but no such listing exists on Google Maps; Google and MAD's Instagram show Valencia instead. Confirm the third branch's name and address.",
        "Confirm phone number",
      ],
    },
  },
];

/** Dev-time sanity check. Returns human readable configuration warnings. */
export function getBranchConfigWarnings(branches: Branch[] = BRANCHES): string[] {
  const warnings: string[] = [];
  for (const b of branches) {
    if (!b.active) continue;
    if (b.latitude === null || b.longitude === null || b.verification.coordinates === "unverified") {
      warnings.push(
        `[branches.ts] "${b.displayName}" has no verified coordinates — it is excluded from delivery checks until latitude/longitude are set.`,
      );
    }
    if (!(b.deliveryRadiusKm > 0)) {
      warnings.push(`[branches.ts] "${b.displayName}" has an invalid deliveryRadiusKm (${b.deliveryRadiusKm}).`);
    }
  }
  return warnings;
}
