import { hasVerifiedCoordinates, type Branch } from "@/types/branch";

/** Turn-by-turn directions to the branch. Uses verified coordinates when available. */
export function directionsUrl(branch: Branch): string {
  if (hasVerifiedCoordinates(branch)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
  }
  return branch.googleMapsUrl;
}

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';
