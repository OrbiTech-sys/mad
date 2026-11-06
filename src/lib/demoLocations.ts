import {
  branchCoordinates,
  isDeliverableBranch,
  type Branch,
  type Coordinates,
  type DeliverableBranch,
} from "@/types/branch";
import { evaluateDelivery } from "./delivery";
import { destinationPoint, midpoint } from "./distance";

export interface DemoLocation {
  id: string;
  label: string;
  description: string;
  coords: Coordinates;
  /** What evaluateDelivery() is expected to say — verified when the list is built. */
  expect: "eligible" | "outside";
}

const BEARINGS = Array.from({ length: 24 }, (_, i) => i * 15);

/**
 * Finds a point `distanceKm` from `anchor` that gives the wanted verdict
 * (so a "just outside" demo point is never accidentally inside a neighbouring branch's zone).
 */
function findPoint(
  branches: Branch[],
  anchor: DeliverableBranch,
  distanceKm: number,
  want: "eligible" | "outside",
): Coordinates | null {
  for (const bearing of BEARINGS) {
    const point = destinationPoint(branchCoordinates(anchor), bearing, distanceKm);
    const ev = evaluateDelivery(point, branches);
    if (want === "outside" && ev.status === "outside") return point;
    // "eligible" scenarios must be covered by the anchor branch ALONE, so the label is truthful.
    if (want === "eligible" && ev.eligible.length === 1 && ev.eligible[0].branch.id === anchor.id) {
      return point;
    }
  }
  return null;
}

/**
 * Builds proof-of-concept test locations from the REAL branch coordinates (offsets and
 * midpoints only — no hand-typed coordinates), so the delivery rule can be demonstrated
 * from anywhere in the world. Every scenario is self-checked against evaluateDelivery().
 */
export function buildDemoLocations(branches: Branch[]): DemoLocation[] {
  const usable = branches.filter(isDeliverableBranch);
  if (usable.length === 0) return [];

  const out: DemoLocation[] = [];
  const first = usable[0];
  const last = usable[usable.length - 1];

  const inside = findPoint(branches, first, 1.8, "eligible");
  if (inside) {
    out.push({
      id: "inside-first",
      label: `Inside ${first.name} zone`,
      description: "About 1.8 km from the branch — delivery available",
      coords: inside,
      expect: "eligible",
    });
  }

  // Two zones overlapping: midpoint of the closest pair whose midpoint is inside both.
  let bestPair: { a: Branch; b: Branch; point: Coordinates } | null = null;
  for (const a of usable) {
    for (const b of usable) {
      if (a.id >= b.id) continue;
      const point = midpoint(branchCoordinates(a), branchCoordinates(b));
      const ev = evaluateDelivery(point, branches);
      if (ev.eligible.length >= 2) {
        bestPair = bestPair ?? { a, b, point };
      }
    }
  }
  if (bestPair) {
    out.push({
      id: "overlap",
      label: `Between ${bestPair.a.name} & ${bestPair.b.name}`,
      description: "Inside two delivery zones — nearest branch is recommended",
      coords: bestPair.point,
      expect: "eligible",
    });
  }

  const edgeIn = findPoint(branches, last, 4.9, "eligible");
  if (edgeIn) {
    out.push({
      id: "edge-in",
      label: `4.9 km from ${last.name}`,
      description: "Just inside the 5 km edge — delivery available",
      coords: edgeIn,
      expect: "eligible",
    });
  }

  const edgeOut = findPoint(branches, last, 5.1, "outside");
  if (edgeOut) {
    out.push({
      id: "edge-out",
      label: `5.1 km from ${last.name}`,
      description: "Just outside the edge — pickup only",
      coords: edgeOut,
      expect: "outside",
    });
  }

  const far = findPoint(branches, first, 25, "outside");
  if (far) {
    out.push({
      id: "far",
      label: "Far from every branch",
      description: "About 25 km away — pickup only",
      coords: far,
      expect: "outside",
    });
  }

  // Defence in depth: never offer a scenario whose label would lie.
  return out.filter((scenario) => evaluateDelivery(scenario.coords, branches).status === scenario.expect);
}
