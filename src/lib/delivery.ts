import {
  branchCoordinates,
  isDeliverableBranch,
  type Branch,
  type Coordinates,
  type DeliverableBranch,
} from "@/types/branch";
import { haversineKm, isValidCoordinates } from "./distance";

export interface BranchDistance {
  branch: DeliverableBranch;
  distanceKm: number;
  /** distance <= the branch's own deliveryRadiusKm (straight-line). */
  withinRadius: boolean;
}

/**
 * - `eligible`   – at least one active branch delivers to this point.
 * - `outside`    – point verified, but outside every delivery radius → offer pickup.
 * - `unverified` – no usable coordinates (or no verified branches). Never claim delivery.
 */
export type DeliveryStatus = "eligible" | "outside" | "unverified";

export interface DeliveryEvaluation {
  status: DeliveryStatus;
  origin: Coordinates | null;
  reason?: "no-location" | "invalid-coordinates" | "no-verified-branches";
  /** Every verified active branch, nearest first. */
  distances: BranchDistance[];
  /** Branches whose radius covers the point, nearest first. */
  eligible: BranchDistance[];
  nearest: BranchDistance | null;
  nearestEligible: BranchDistance | null;
  /**
   * True when the nearest branch's radius edge lies within the GPS accuracy circle, i.e.
   * the delivery verdict could flip if the true position is a little different.
   */
  nearBoundary: boolean;
}

const EMPTY: Omit<DeliveryEvaluation, "status" | "origin" | "reason"> = {
  distances: [],
  eligible: [],
  nearest: null,
  nearestEligible: null,
  nearBoundary: false,
};

export function evaluateDelivery(
  origin: Coordinates | null | undefined,
  branches: Branch[],
  options: { accuracyM?: number | null } = {},
): DeliveryEvaluation {
  if (!origin) return { ...EMPTY, status: "unverified", origin: null, reason: "no-location" };
  if (!isValidCoordinates(origin)) {
    return { ...EMPTY, status: "unverified", origin: null, reason: "invalid-coordinates" };
  }

  const candidates = branches.filter(isDeliverableBranch);
  if (candidates.length === 0) {
    return { ...EMPTY, status: "unverified", origin, reason: "no-verified-branches" };
  }

  const distances: BranchDistance[] = candidates
    .map((branch) => {
      const distanceKm = haversineKm(origin, branchCoordinates(branch));
      return { branch, distanceKm, withinRadius: distanceKm <= branch.deliveryRadiusKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const eligible = distances.filter((d) => d.withinRadius);
  const nearest = distances[0] ?? null;

  const accuracyKm = options.accuracyM && options.accuracyM > 0 ? options.accuracyM / 1000 : 0;
  const nearBoundary =
    accuracyKm > 0 &&
    distances.some((d) => Math.abs(d.distanceKm - d.branch.deliveryRadiusKm) <= accuracyKm);

  return {
    status: eligible.length > 0 ? "eligible" : "outside",
    origin,
    distances,
    eligible,
    nearest,
    nearestEligible: eligible[0] ?? null,
    nearBoundary,
  };
}

/** Looks up one branch's entry in an evaluation. */
export function distanceFor(evaluation: DeliveryEvaluation, branchId: string): BranchDistance | null {
  return evaluation.distances.find((d) => d.branch.id === branchId) ?? null;
}
