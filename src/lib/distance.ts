import type { Coordinates } from "@/types/branch";

/** Mean Earth radius in kilometres (IUGG). */
export const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * True for finite, in-range coordinates. (0, 0) is rejected: several devices and
 * emulators return it as a "no fix" sentinel, and it is nowhere near Lahore.
 */
export function isValidCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Record<string, unknown>;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

/** Great-circle (straight-line) distance between two points, in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Point reached by travelling `distanceKm` from `origin` along `bearingDeg`
 * (0 = north, 90 = east). Used to derive demo test locations from real branch coordinates.
 */
export function destinationPoint(
  origin: Coordinates,
  bearingDeg: number,
  distanceKm: number,
): Coordinates {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return { lat: toDeg(lat2), lng: ((toDeg(lng2) + 540) % 360) - 180 };
}

/** Geographic midpoint of two coordinates. */
export function midpoint(a: Coordinates, b: Coordinates): Coordinates {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const bx = Math.cos(lat2) * Math.cos(dLng);
  const by = Math.cos(lat2) * Math.sin(dLng);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);

  return { lat: toDeg(lat3), lng: ((toDeg(lng3) + 540) % 360) - 180 };
}

/** "850 m", "2.3 km". Shows two decimals when the value would otherwise round onto a limit. */
export function formatDistance(km: number, limitKm?: number): string {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const oneDecimal = Math.round(km * 10) / 10;
  if (limitKm !== undefined && oneDecimal === limitKm && km !== limitKm) {
    return `${km.toFixed(2)} km`;
  }
  return `${oneDecimal.toFixed(1)} km`;
}
