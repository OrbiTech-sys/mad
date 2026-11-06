import type { Branch, Coordinates, DeliverableBranch } from "@/types/branch";
import type { FulfilmentMethod, LocationSource, OrderContext, OrderNotice } from "@/types/order";
import { distanceFor, evaluateDelivery } from "./delivery";
import { formatDistance, isValidCoordinates } from "./distance";

/**
 * The rules engine for "how is this customer ordering?". Pure functions only — the React
 * layer (hooks/useOrder.ts) just feeds them state and stores the result.
 *
 * Invariant enforced by reconcileContext(): a persisted context can never claim delivery
 * unless the stored coordinates currently fall inside the chosen branch's delivery radius.
 * When that stops being true the method is switched and the customer is TOLD (a notice) —
 * an invalid delivery selection is never retained silently.
 */

export const EMPTY_CONTEXT: OrderContext = {
  method: null,
  branchId: null,
  coords: null,
  accuracyM: null,
  source: null,
  address: "",
  updatedAt: 0,
};

export interface LocationInput {
  coords: Coordinates;
  source: LocationSource;
  accuracyM?: number | null;
  address?: string;
}

export interface ReconcileResult {
  context: OrderContext;
  notices: OrderNotice[];
}

const activeBranch = (branches: Branch[], id: string | null): Branch | null =>
  (id && branches.find((b) => b.id === id && b.active)) || null;

/** Brings any context (fresh, persisted, or just-edited) back into a consistent state. */
export function reconcileContext(context: OrderContext, branches: Branch[]): ReconcileResult {
  const notices: OrderNotice[] = [];
  const next: OrderContext = { ...context };

  if (next.coords && !isValidCoordinates(next.coords)) {
    next.coords = null;
    next.accuracyM = null;
    next.source = null;
  }

  // A saved branch that disappeared or was deactivated.
  if (next.branchId && !activeBranch(branches, next.branchId)) {
    notices.push({
      id: "branch-unavailable",
      tone: "warning",
      title: "Your branch is no longer available",
      message: "Please choose another MAD branch to continue ordering.",
      action: "choose-branch",
    });
    next.branchId = null;
  }

  const evaluation = evaluateDelivery(next.coords, branches, { accuracyM: next.accuracyM });

  if (next.method === "delivery") {
    if (evaluation.status === "eligible") {
      const stillValid = evaluation.eligible.find((e) => e.branch.id === next.branchId);
      if (!stillValid) {
        const target = evaluation.nearestEligible!;
        const previous = context.branchId ? activeBranch(branches, context.branchId) : null;
        if (previous) {
          notices.push({
            id: "branch-switched",
            tone: "info",
            title: `Delivering from ${target.branch.name} instead`,
            message: `${previous.displayName} doesn't deliver to your location. ${target.branch.displayName} is ${formatDistance(target.distanceKm, target.branch.deliveryRadiusKm)} away and does.`,
          });
        }
        next.branchId = target.branch.id;
      }
    } else {
      // Delivery can no longer be promised: fall back to pickup, loudly.
      next.method = "pickup";
      if (!activeBranch(branches, next.branchId)) {
        next.branchId = evaluation.nearest?.branch.id ?? null;
      }
      if (evaluation.status === "outside" && evaluation.nearest) {
        notices.push({
          id: "delivery-unavailable",
          tone: "warning",
          title: "Delivery isn't available at this location",
          message: `The nearest branch, ${evaluation.nearest.branch.displayName}, is ${formatDistance(evaluation.nearest.distanceKm, evaluation.nearest.branch.deliveryRadiusKm)} away — outside its ${evaluation.nearest.branch.deliveryRadiusKm} km delivery area. We've switched you to pickup; choose the branch you'd like to collect from.`,
          action: "choose-branch",
        });
      } else {
        notices.push({
          id: "delivery-unverified",
          tone: "warning",
          title: "We couldn't verify your location",
          message:
            "Delivery needs a confirmed location. We've switched you to pickup — or set your location again to check delivery.",
          action: "change-location",
        });
      }
    }
  } else if (next.method === "pickup") {
    const branch = activeBranch(branches, next.branchId);
    if (!branch || !branch.pickupAvailable) {
      next.branchId = null;
      next.method = null;
      notices.push({
        id: "pickup-branch-missing",
        tone: "warning",
        title: "Choose a pickup branch",
        message: "Pick the MAD branch you'd like to collect your order from.",
        action: "choose-branch",
      });
    }
  } else if (next.branchId) {
    // A branch without a method is meaningless.
    next.branchId = null;
  }

  return { context: next, notices };
}

/**
 * The customer's position changed (GPS refresh, new pin, new address pin).
 * Recalculates eligibility, updates the branch if needed, and returns notices for anything
 * that changed under the customer's feet.
 */
export function applyCustomerLocation(
  previous: OrderContext,
  input: LocationInput,
  branches: Branch[],
  now: number = Date.now(),
): ReconcileResult {
  if (!isValidCoordinates(input.coords)) {
    return {
      context: previous,
      notices: [
        {
          id: "location-invalid",
          tone: "warning",
          title: "That location doesn't look right",
          message: "We couldn't read valid coordinates. Try again or drop a pin on the map.",
          action: "change-location",
        },
      ],
    };
  }

  const next: OrderContext = {
    ...previous,
    coords: input.coords,
    source: input.source,
    accuracyM: input.accuracyM ?? null,
    address: input.address ?? previous.address,
    updatedAt: now,
  };

  // First location ever: set sensible defaults (still reversible by the customer).
  if (previous.method === null) {
    const evaluation = evaluateDelivery(next.coords, branches, { accuracyM: next.accuracyM });
    if (evaluation.status === "eligible") {
      next.method = "delivery";
      next.branchId = evaluation.nearestEligible!.branch.id;
    } else if (evaluation.nearest) {
      next.method = "pickup";
      next.branchId = evaluation.nearest.branch.id;
    }
    return reconcileContext(next, branches);
  }

  const result = reconcileContext(next, branches);

  // Pickup customers who moved into a delivery zone get a heads-up (no silent switch).
  if (previous.method === "pickup" && result.context.method === "pickup") {
    const evaluation = evaluateDelivery(next.coords, branches, { accuracyM: next.accuracyM });
    if (evaluation.status === "eligible" && evaluation.nearestEligible) {
      const d = evaluation.nearestEligible;
      result.notices.push({
        id: "delivery-now-available",
        tone: "info",
        title: "Delivery is available here",
        message: `${d.branch.displayName} delivers to this location (${formatDistance(d.distanceKm, d.branch.deliveryRadiusKm)}). You're still set to pickup — change it any time.`,
        action: "change-location",
      });
    }
  }

  return result;
}

export interface ChoiceInput {
  method: FulfilmentMethod;
  branchId: string;
  /** Provide when the customer just set / adjusted a location. */
  location?: LocationInput | null;
}

export type CommitResult =
  | { ok: true; context: OrderContext }
  | { ok: false; error: string };

/** The customer explicitly confirmed a method + branch (location modal, branch cards). */
export function commitChoice(
  previous: OrderContext,
  choice: ChoiceInput,
  branches: Branch[],
  now: number = Date.now(),
): CommitResult {
  const branch = activeBranch(branches, choice.branchId);
  if (!branch) return { ok: false, error: "That branch isn't available right now." };

  const next: OrderContext = { ...previous };

  if (choice.location) {
    if (!isValidCoordinates(choice.location.coords)) {
      return { ok: false, error: "That location isn't valid. Please set it again." };
    }
    next.coords = choice.location.coords;
    next.source = choice.location.source;
    next.accuracyM = choice.location.accuracyM ?? null;
    if (choice.location.address !== undefined) next.address = choice.location.address;
  }

  if (choice.method === "pickup") {
    if (!branch.pickupAvailable) {
      return { ok: false, error: `Pickup isn't available at ${branch.displayName}.` };
    }
  } else {
    const evaluation = evaluateDelivery(next.coords, branches, { accuracyM: next.accuracyM });
    const entry = distanceFor(evaluation, branch.id);
    if (evaluation.status === "unverified" || !entry) {
      return {
        ok: false,
        error: "Delivery needs a verified location. Set your location first, or choose pickup.",
      };
    }
    if (!entry.withinRadius) {
      return {
        ok: false,
        error: `${branch.displayName} is ${formatDistance(entry.distanceKm, branch.deliveryRadiusKm)} away — outside its ${branch.deliveryRadiusKm} km delivery area.`,
      };
    }
  }

  next.method = choice.method;
  next.branchId = branch.id;
  next.updatedAt = now;
  return { ok: true, context: next };
}

export type FulfilmentCheck =
  | { ok: true; method: "pickup"; branch: Branch; distanceKm: number | null }
  | { ok: true; method: "delivery"; branch: DeliverableBranch; distanceKm: number }
  | {
      ok: false;
      code:
        | "no-method"
        | "no-branch"
        | "branch-unavailable"
        | "no-location"
        | "location-unverified"
        | "outside-radius";
      message: string;
    };

/**
 * Authoritative "can this order be fulfilled the way the customer chose?" check.
 * Used by the cart, the checkout page and — again — at the moment of submission.
 */
export function validateFulfilment(context: OrderContext, branches: Branch[]): FulfilmentCheck {
  if (!context.method) {
    return { ok: false, code: "no-method", message: "Choose delivery or pickup to continue." };
  }
  if (!context.branchId) {
    return { ok: false, code: "no-branch", message: "Choose a MAD branch to continue." };
  }
  const branch = activeBranch(branches, context.branchId);
  if (!branch) {
    return {
      ok: false,
      code: "branch-unavailable",
      message: "That branch isn't available. Please choose another.",
    };
  }

  const evaluation = evaluateDelivery(context.coords, branches, { accuracyM: context.accuracyM });

  if (context.method === "pickup") {
    if (!branch.pickupAvailable) {
      return {
        ok: false,
        code: "branch-unavailable",
        message: `Pickup isn't available at ${branch.displayName}.`,
      };
    }
    const entry = distanceFor(evaluation, branch.id);
    return { ok: true, method: "pickup", branch, distanceKm: entry?.distanceKm ?? null };
  }

  if (!context.coords) {
    return {
      ok: false,
      code: "no-location",
      message: "Set your location so we can check that we deliver to you.",
    };
  }
  const entry = distanceFor(evaluation, branch.id);
  if (evaluation.status === "unverified" || !entry) {
    return {
      ok: false,
      code: "location-unverified",
      message: "We couldn't verify your location. Set it again or switch to pickup.",
    };
  }
  if (!entry.withinRadius) {
    return {
      ok: false,
      code: "outside-radius",
      message: `${branch.displayName} is ${formatDistance(entry.distanceKm, branch.deliveryRadiusKm)} from you — outside its ${branch.deliveryRadiusKm} km delivery area. Switch to pickup or choose another branch.`,
    };
  }
  return { ok: true, method: "delivery", branch: entry.branch, distanceKm: entry.distanceKm };
}
