"use client";

import { AnimatePresence } from "framer-motion";
import { AlertTriangle, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useLocation } from "@/hooks/useOrder";
import { ui, useUi } from "@/hooks/useUi";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { DeliveryStatusChip } from "../location/DeliveryStatus";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

/** Slide-in cart. Mounted once in AppProviders; open with ui.openCart(). */
export function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const router = useRouter();
  const { lines, count, totals, setQuantity, remove, clear } = useCart();
  const { context, fulfilment } = useLocation();

  const empty = lines.length === 0;
  const hasDemoPrices = lines.some((l) => l.demoPrice);

  function checkout() {
    if (fulfilment.ok) {
      ui.closeCart();
      router.push("/checkout");
    } else {
      // No valid method/branch/location yet: collect it first, then continue to checkout.
      ui.openLocation({ afterComplete: "checkout" });
    }
  }

  return (
    <Modal open={open} onClose={ui.closeCart} label="Your cart" variant="drawer" hideClose>
      <header className="flex items-center justify-between gap-3 border-b border-paper/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="display-md">Your order</h2>
          <p className="text-sm text-smoke" aria-live="polite">
            {empty ? "Nothing here yet" : `${count} ${count === 1 ? "item" : "items"}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!empty && (
            <button
              type="button"
              onClick={clear}
              className="min-h-11 rounded-sm px-3 text-sm font-semibold text-smoke underline-offset-4 transition-colors hover:text-danger hover:underline"
            >
              Clear cart
            </button>
          )}
          <button
            type="button"
            onClick={ui.closeCart}
            aria-label="Close cart"
            className="grid size-11 place-items-center rounded-sm text-paper transition-colors hover:bg-paper/10"
          >
            <X aria-hidden className="size-6" />
          </button>
        </div>
      </header>

      {empty ? (
        <div className="grid flex-1 place-content-center justify-items-center gap-4 px-8 py-12 text-center">
          <span className="grid size-24 place-items-center rounded-full border border-dashed border-paper/30 text-gold">
            <ShoppingBag aria-hidden className="size-10" />
          </span>
          <div>
            <p className="display-md">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-[18rem] text-sm text-smoke">
              Hungry? Burgers, wraps, pizza and loaded fries are one tap away.
            </p>
          </div>
          <Link
            href="/menu"
            onClick={ui.closeCart}
            className="inline-flex min-h-12 items-center justify-center rounded-sm bg-ember px-6 font-display text-xl uppercase tracking-[0.06em] text-ink transition hover:brightness-110"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex-1 overflow-y-auto overscroll-contain px-5" aria-label="Items in your cart">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <CartItem
                  key={line.id}
                  line={line}
                  onQuantity={(q) => setQuantity(line.id, q)}
                  onRemove={() => remove(line.id)}
                />
              ))}
            </AnimatePresence>
          </ul>

          <footer className="grid gap-4 border-t border-paper/10 bg-ink/60 px-5 pb-safe pt-4">
            <DeliveryStatusChip variant="block" />

            {!fulfilment.ok && context.method && (
              <p role="alert" className="flex gap-2 rounded-sm border border-gold/50 bg-gold/10 p-3 text-sm">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                {fulfilment.message}
              </p>
            )}

            <CartSummary totals={totals} method={context.method} hasDemoPrices={hasDemoPrices} />

            <Button size="lg" block onClick={checkout} disabled={totals.belowMinimum}>
              {fulfilment.ok ? "Checkout" : "Set location to checkout"}
            </Button>
          </footer>
        </>
      )}
    </Modal>
  );
}

