"use client";

import { useCallback, useMemo } from "react";
import {
  addLine,
  computeTotals,
  itemCount,
  lineFromDeal,
  lineFromProduct,
  removeLine,
  setLineQuantity,
} from "@/lib/cart";
import { createStore } from "@/lib/storage";
import { cartStateSchema } from "@/lib/validation";
import type { CartLine } from "@/types/order";
import type { Product, ResolvedDeal } from "@/types/product";
import { orderStore } from "./useOrder";
import { useHydrated, useStore } from "./useStore";
import { ui } from "./useUi";

interface CartState {
  lines: CartLine[];
}

const EMPTY_CART: CartState = { lines: [] };

export const cartStore = createStore<CartState>(EMPTY_CART, {
  key: "mad.cart.v1",
  parse: (raw) => {
    const result = cartStateSchema.safeParse(raw);
    return result.success ? result.data : null;
  },
});

export function useCart() {
  const { lines } = useStore(cartStore);
  const { method } = useStore(orderStore);
  const hydrated = useHydrated();

  const totals = useMemo(() => computeTotals(lines, method), [lines, method]);
  const count = useMemo(() => itemCount(lines), [lines]);

  const announce = useCallback((line: CartLine, quantity: number) => {
    ui.toast(`${quantity > 1 ? `${quantity} × ` : ""}${line.name} added`, {
      action: { label: "View cart", onClick: ui.openCart },
    });
  }, []);

  const addProduct = useCallback(
    (product: Product, quantity = 1): boolean => {
      const line = lineFromProduct(product);
      if (!line) {
        ui.toast(`${product.name} can't be ordered right now.`, { tone: "warning" });
        return false;
      }
      cartStore.set((s) => ({ lines: addLine(s.lines, line, quantity) }));
      announce(line, quantity);
      return true;
    },
    [announce],
  );

  const addDeal = useCallback(
    (deal: ResolvedDeal): boolean => {
      const line = lineFromDeal(deal);
      if (!line) {
        ui.toast(`${deal.name} can't be ordered right now.`, { tone: "warning" });
        return false;
      }
      cartStore.set((s) => ({ lines: addLine(s.lines, line, 1) }));
      announce(line, 1);
      return true;
    },
    [announce],
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    cartStore.set((s) => ({ lines: setLineQuantity(s.lines, id, quantity) }));
  }, []);

  const remove = useCallback((id: string) => {
    cartStore.set((s) => ({ lines: removeLine(s.lines, id) }));
  }, []);

  const clear = useCallback(() => cartStore.set(EMPTY_CART), []);

  return { hydrated, lines, count, totals, addProduct, addDeal, setQuantity, remove, clear };
}

/** Quantity of a given product already in the cart (for "In cart" hints). */
export function useLineQuantity(lineId: string): number {
  const { lines } = useStore(cartStore);
  return lines.find((l) => l.id === lineId)?.quantity ?? 0;
}
