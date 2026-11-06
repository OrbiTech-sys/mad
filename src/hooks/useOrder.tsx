"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { evaluateDelivery, type DeliveryEvaluation } from "@/lib/delivery";
import {
  applyCustomerLocation,
  commitChoice,
  EMPTY_CONTEXT,
  reconcileContext,
  validateFulfilment,
  type ChoiceInput,
  type CommitResult,
  type FulfilmentCheck,
  type LocationInput,
  type ReconcileResult,
} from "@/lib/orderState";
import { createStore } from "@/lib/storage";
import { orderContextSchema } from "@/lib/validation";
import type { Branch } from "@/types/branch";
import type { OrderContext } from "@/types/order";
import { useHydrated, useStore } from "./useStore";
import { ui } from "./useUi";

/**
 * Persisted ordering context (method, branch, coordinates, typed address).
 * Everything is validated on read, so corrupt or hand-edited localStorage can't break the app.
 */
export const orderStore = createStore<OrderContext>(EMPTY_CONTEXT, {
  key: "mad.order.v1",
  parse: (raw) => {
    const result = orderContextSchema.safeParse(raw);
    return result.success ? result.data : null;
  },
});

/* ---------------------------------------------------------------- branches */

const BranchesContext = createContext<Branch[]>([]);

/** Branches come from the data layer (server) and are handed to the client once, here. */
export function BranchesProvider({ branches, children }: { branches: Branch[]; children: ReactNode }) {
  return <BranchesContext.Provider value={branches}>{children}</BranchesContext.Provider>;
}

export function useBranches(): Branch[] {
  return useContext(BranchesContext);
}

/* ---------------------------------------------------------------- location */

export interface LocationApi {
  hydrated: boolean;
  context: OrderContext;
  evaluation: DeliveryEvaluation;
  /** Authoritative: can the current selection be fulfilled right now? */
  fulfilment: FulfilmentCheck;
  /** The customer's location changed: recalculates, may switch branch/method, and notifies. */
  setLocation: (input: LocationInput) => ReconcileResult;
  /** The customer explicitly confirmed a method + branch (and optionally a location). */
  confirmChoice: (choice: ChoiceInput) => CommitResult;
  clearAll: () => void;
}

export function useLocation(): LocationApi {
  const branches = useBranches();
  const context = useStore(orderStore);
  const hydrated = useHydrated();

  const evaluation = useMemo(
    () => evaluateDelivery(context.coords, branches, { accuracyM: context.accuracyM }),
    [context.coords, context.accuracyM, branches],
  );
  const fulfilment = useMemo(() => validateFulfilment(context, branches), [context, branches]);

  const setLocation = useCallback(
    (input: LocationInput): ReconcileResult => {
      const result = applyCustomerLocation(orderStore.getSnapshot(), input, branches);
      orderStore.set(result.context);
      for (const notice of result.notices) ui.pushNotice(notice);
      return result;
    },
    [branches],
  );

  const confirmChoice = useCallback(
    (choice: ChoiceInput): CommitResult => {
      const result = commitChoice(orderStore.getSnapshot(), choice, branches);
      if (result.ok) {
        orderStore.set(result.context);
        // The customer just made an explicit decision: earlier warnings are now stale.
        ui.clearNotices();
      }
      return result;
    },
    [branches],
  );

  const clearAll = useCallback(() => {
    orderStore.reset();
    ui.clearNotices();
  }, []);

  return { hydrated, context, evaluation, fulfilment, setLocation, confirmChoice, clearAll };
}

/* ------------------------------------------------------------------ branch */

export type SelectBranchResult =
  | { status: "set"; method: "delivery" | "pickup" }
  | { status: "needs-location" };

export interface BranchApi {
  branches: Branch[];
  selectedBranch: Branch | null;
  method: OrderContext["method"];
  /** "Order from this branch" — keeps the customer's method when it is still valid. */
  selectBranch: (branchId: string) => SelectBranchResult;
}

export function useBranch(): BranchApi {
  const branches = useBranches();
  const { context, evaluation, confirmChoice } = useLocation();

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === context.branchId && b.active) ?? null,
    [branches, context.branchId],
  );

  const selectBranch = useCallback(
    (branchId: string): SelectBranchResult => {
      const branch = branches.find((b) => b.id === branchId);
      if (!branch) return { status: "needs-location" };

      if (context.method === "delivery") {
        const entry = evaluation.distances.find((d) => d.branch.id === branchId);
        if (entry?.withinRadius) {
          confirmChoice({ method: "delivery", branchId });
          return { status: "set", method: "delivery" };
        }
        // Delivery isn't possible from that branch for this customer: say so, don't pretend.
        confirmChoice({ method: "pickup", branchId });
        ui.pushNotice({
          id: "branch-pickup-only",
          tone: "info",
          title: `Pickup from ${branch.displayName}`,
          message: `${branch.displayName} doesn't deliver to your saved location, so this order will be for pickup.`,
          action: "change-location",
        });
        return { status: "set", method: "pickup" };
      }

      if (context.method === "pickup") {
        confirmChoice({ method: "pickup", branchId });
        return { status: "set", method: "pickup" };
      }

      return { status: "needs-location" };
    },
    [branches, context.method, evaluation.distances, confirmChoice],
  );

  return { branches, selectedBranch, method: context.method, selectBranch };
}

/** Re-validates the persisted context against the live branch list (run once on app start). */
export function reconcileStoredOrder(branches: Branch[]) {
  const before = orderStore.getSnapshot();
  const { context, notices } = reconcileContext(before, branches);
  if (JSON.stringify(context) !== JSON.stringify(before)) orderStore.set(context);
  for (const notice of notices) ui.pushNotice(notice);

  // GPS fixes go stale: remind delivery customers to refresh after 12 hours.
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  if (context.method === "delivery" && context.source === "gps" && Date.now() - context.updatedAt > TWELVE_HOURS) {
    ui.pushNotice({
      id: "location-stale",
      tone: "info",
      title: "Is this still where you are?",
      message: "Your saved location is from a while ago. Refresh it to make sure delivery still applies.",
      action: "change-location",
    });
  }
}
