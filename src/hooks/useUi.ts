"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/storage";
import type { OrderNotice } from "@/types/order";
import type { Product } from "@/types/product";

export interface LocationIntent {
  /** Which screen the location modal opens on. */
  view?: "choose" | "branches";
  /** A branch the customer already leaned towards (e.g. "Order from this branch"). */
  preferredBranchId?: string | null;
  /** Where to go once a method + branch has been confirmed. */
  afterComplete?: "menu" | "checkout" | null;
}

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "info" | "warning";
  action?: { label: string; onClick: () => void };
}

interface UiState {
  cartOpen: boolean;
  locationOpen: boolean;
  locationIntent: LocationIntent;
  mobileMenuOpen: boolean;
  product: Product | null;
  toasts: Toast[];
  notices: OrderNotice[];
}

const initialUi: UiState = {
  cartOpen: false,
  locationOpen: false,
  locationIntent: {},
  mobileMenuOpen: false,
  product: null,
  toasts: [],
  notices: [],
};

const uiStore = createStore<UiState>(initialUi);
const patch = (partial: Partial<UiState>) => uiStore.set((s) => ({ ...s, ...partial }));

let toastId = 0;

/** Imperative UI actions. Safe to call from event handlers anywhere on the client. */
export const ui = {
  openCart: () => patch({ cartOpen: true, mobileMenuOpen: false }),
  closeCart: () => patch({ cartOpen: false }),
  openLocation: (intent: LocationIntent = {}) =>
    patch({ locationOpen: true, locationIntent: intent, mobileMenuOpen: false, cartOpen: false }),
  closeLocation: () => patch({ locationOpen: false }),
  openProduct: (product: Product) => patch({ product }),
  closeProduct: () => patch({ product: null }),
  setMobileMenu: (open: boolean) => patch({ mobileMenuOpen: open }),

  toast(message: string, options: { tone?: Toast["tone"]; action?: Toast["action"]; ms?: number } = {}) {
    const id = ++toastId;
    const toast: Toast = { id, message, tone: options.tone ?? "success", action: options.action };
    // One toast at a time keeps the screen calm: the newest replaces the previous.
    patch({ toasts: [toast] });
    if (typeof window !== "undefined") {
      window.setTimeout(() => ui.dismissToast(id), options.ms ?? 3800);
    }
    return id;
  },
  dismissToast: (id: number) => uiStore.set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),

  pushNotice(notice: OrderNotice) {
    uiStore.set((s) => ({
      ...s,
      // A notice with the same id replaces the old one instead of stacking.
      notices: [...s.notices.filter((n) => n.id !== notice.id), notice],
    }));
  },
  dismissNotice: (id: string) =>
    uiStore.set((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== id) })),
  clearNotices: () => patch({ notices: [] }),
};

/** Select a slice of UI state. The selector must return a primitive or a stable reference. */
export function useUi<T>(selector: (state: UiState) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => selector(uiStore.getSnapshot()),
    () => selector(initialUi),
  );
}
