import { z } from "zod";
import type { Coordinates } from "@/types/branch";
import { isValidCoordinates } from "./distance";

/**
 * Free, key-less address search using OpenStreetMap's Nominatim service.
 *
 * IMPORTANT: a search hit is a *suggestion*, not proof. The UI always makes the customer
 * confirm the pin on the map before it counts as a verified location. Nominatim's usage
 * policy allows light, user-initiated lookups (no autocomplete / bulk) — fine for a POC;
 * use a commercial geocoder for production traffic.
 */
export interface GeocodeHit {
  label: string;
  coords: Coordinates;
}

export class GeocodeError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "rate-limited" | "bad-response",
  ) {
    super(message);
  }
}

const responseSchema = z.array(
  z.object({ lat: z.string(), lon: z.string(), display_name: z.string() }),
);

export async function searchAddress(
  query: string,
  /** Branch coordinates, used only to bias results towards the service area. */
  bias: Coordinates[],
  signal?: AbortSignal,
): Promise<GeocodeHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const q = /lahore/i.test(trimmed) ? trimmed : `${trimmed}, Lahore`;
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "5",
    countrycodes: "pk",
    "accept-language": "en",
    q,
  });

  if (bias.length > 0) {
    const pad = 0.4;
    const lats = bias.map((c) => c.lat);
    const lngs = bias.map((c) => c.lng);
    // viewbox = left,top,right,bottom
    params.set(
      "viewbox",
      [Math.min(...lngs) - pad, Math.max(...lats) + pad, Math.max(...lngs) + pad, Math.min(...lats) - pad].join(","),
    );
    params.set("bounded", "0");
  }

  let response: Response;
  try {
    response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new GeocodeError("Address search is unavailable right now.", "network");
  }

  if (response.status === 429) {
    throw new GeocodeError("Address search is busy. Please wait a moment and try again.", "rate-limited");
  }
  if (!response.ok) {
    throw new GeocodeError("Address search is unavailable right now.", "bad-response");
  }

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    throw new GeocodeError("Address search returned something unexpected.", "bad-response");
  }

  const seen = new Set<string>();
  return parsed.data
    .map((hit) => ({
      label: hit.display_name,
      coords: { lat: Number(hit.lat), lng: Number(hit.lon) },
    }))
    .filter((hit) => isValidCoordinates(hit.coords))
    // OSM often returns the same place twice (node + relation): keep one per label.
    .filter((hit) => !seen.has(hit.label) && seen.add(hit.label));
}
