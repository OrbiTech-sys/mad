"use client";

import { MapPin, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useBranch, useLocation } from "@/hooks/useOrder";
import { ui } from "@/hooks/useUi";
import { formatCurrency } from "@/lib/formatCurrency";
import { OrderNowButton } from "./OrderNowButton";

/**
 * Sticky bottom bar on phones — the ordering app feel.
 * No location yet → a single big ORDER NOW. Otherwise: where you're ordering + a cart button.
 */
export function MobileOrderBar() {
  const pathname = usePathname();
  const { hydrated: cartReady, count, totals } = useCart();
  const { hydrated, fulfilment, context } = useLocation();
  const { selectedBranch } = useBranch();

  if (pathname.startsWith("/checkout")) return null;

  const ready = hydrated && context.method && selectedBranch;

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-paper/15 bg-ink/95 px-3 pt-3 backdrop-blur md:hidden">
      {ready && selectedBranch ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => ui.openLocation()}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-sm border border-paper/20 px-3 text-left"
            aria-label="Change delivery or pickup location"
          >
            <MapPin aria-hidden className={fulfilment.ok ? "size-5 shrink-0 text-ember" : "size-5 shrink-0 text-gold"} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                {context.method === "delivery" ? "Delivery" : "Pickup"} · {selectedBranch.name}
              </span>
              <span className="block truncate text-xs leading-tight text-smoke">
                {fulfilment.ok ? "Tap to change" : "Needs attention — tap to fix"}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={ui.openCart}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-sm bg-ember px-4 font-display text-xl uppercase tracking-[0.06em] text-ink"
            aria-label={`Open cart, ${cartReady ? count : 0} items`}
          >
            <ShoppingBag aria-hidden className="size-5" />
            {cartReady && count > 0 ? (
              <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
            ) : (
              "Cart"
            )}
          </button>
        </div>
      ) : (
        <OrderNowButton size="lg" block arrow />
      )}
    </div>
  );
}
