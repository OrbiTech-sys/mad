export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * How a branch's coordinates were obtained.
 * - `google-maps-place-pin`: read from the branch's own Google Maps place listing.
 * - `unverified`: no trustworthy coordinates yet. Latitude/longitude MUST stay null.
 */
export type CoordinateSource = "google-maps-place-pin" | "unverified";

export interface BranchPhone {
  /** Human readable, e.g. "0335 1116231" */
  display: string;
  /** E.164 for tel: links, e.g. "+923351116231" */
  tel: string;
}

export interface BranchVerification {
  coordinates: CoordinateSource;
  /** Where the address text came from. */
  addressSource: string;
  /** Where the phone number came from (omit when there is no phone). */
  phoneSource?: string;
  /** Address supplied in the original brief when it differs from the verified one. */
  briefAddress?: string;
  /** Anything the business owner must confirm before launch. */
  ownerChecks: string[];
}

export interface Branch {
  id: string;
  /** Short area name used in headings, e.g. "Johar Town". */
  name: string;
  /** Full display name, e.g. "MAD Johar Town". */
  displayName: string;
  address: string;
  /** null until verified. Never guess coordinates. */
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string;
  deliveryRadiusKm: number;
  active: boolean;
  pickupAvailable: boolean;
  /** Only set when verified. */
  phone?: BranchPhone;
  verification: BranchVerification;
}

/** A branch that is active and has verified coordinates, so it can be used for delivery maths. */
export type DeliverableBranch = Branch & { latitude: number; longitude: number };

export function hasVerifiedCoordinates(branch: Branch): branch is DeliverableBranch {
  return (
    branch.latitude !== null &&
    branch.longitude !== null &&
    Number.isFinite(branch.latitude) &&
    Number.isFinite(branch.longitude) &&
    branch.verification.coordinates !== "unverified"
  );
}

export function isDeliverableBranch(branch: Branch): branch is DeliverableBranch {
  return branch.active && hasVerifiedCoordinates(branch);
}

export function branchCoordinates(branch: DeliverableBranch): Coordinates {
  return { lat: branch.latitude, lng: branch.longitude };
}
