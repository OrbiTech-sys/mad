import type { Coordinates } from "@/types/branch";
import { isValidCoordinates } from "./distance";

export type GeoFailure =
  | "unsupported" // no navigator.geolocation
  | "insecure" // not https / localhost
  | "denied" // user (or policy) refused permission
  | "unavailable" // GPS / network location can't produce a fix
  | "timeout"
  | "invalid"; // device returned nonsense coordinates

export type GeoResult =
  | { ok: true; coords: Coordinates; accuracyM: number | null }
  | { ok: false; reason: GeoFailure; message: string };

export const GEO_FAILURE_MESSAGES: Record<GeoFailure, string> = {
  unsupported: "This browser can't share your location.",
  insecure: "Location sharing needs a secure (https) connection.",
  denied:
    "Location permission is blocked. Allow it in your browser's site settings, or choose another way below.",
  unavailable: "We couldn't get a GPS fix. Check that location is switched on, or choose another way below.",
  timeout: "Finding your location took too long. Try again, or choose another way below.",
  invalid: "Your device returned a location we can't use. Try again, or choose another way below.",
};

const fail = (reason: GeoFailure): GeoResult => ({
  ok: false,
  reason,
  message: GEO_FAILURE_MESSAGES[reason],
});

/** Requests one position fix and maps every failure mode to a friendly, typed result. */
export function requestCurrentPosition(
  options: { timeoutMs?: number; highAccuracy?: boolean } = {},
): Promise<GeoResult> {
  const { timeoutMs = 12000, highAccuracy = true } = options;

  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve(fail("unsupported"));
      return;
    }
    if (window.isSecureContext === false) {
      resolve(fail("insecure"));
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (!isValidCoordinates(coords)) {
            resolve(fail("invalid"));
            return;
          }
          const accuracy = position.coords.accuracy;
          resolve({
            ok: true,
            coords,
            accuracyM: Number.isFinite(accuracy) && accuracy >= 0 ? Math.round(accuracy) : null,
          });
        },
        (error) => {
          if (error.code === 1) resolve(fail("denied"));
          else if (error.code === 3) resolve(fail("timeout"));
          else resolve(fail("unavailable"));
        },
        { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 30_000 },
      );
    } catch {
      resolve(fail("unsupported"));
    }
  });
}

export type GeoPermission = "granted" | "denied" | "prompt" | "unknown";

/** Best-effort peek at the browser permission so we can explain "blocked" before asking. */
export async function getGeolocationPermission(): Promise<GeoPermission> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as GeoPermission;
  } catch {
    return "unknown";
  }
}
