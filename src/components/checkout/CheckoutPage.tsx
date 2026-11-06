"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { demoOrderStore } from "@/hooks/useDemoOrder";
import { useStore } from "@/hooks/useStore";
import { ButtonLink } from "../ui/Button";
import { CheckoutForm } from "./CheckoutForm";
import { OrderConfirmation } from "./OrderConfirmation";

/** Chooses between: loading, confirmation (after a demo order), empty cart, and the form. */
export function CheckoutPage() {
  const { hydrated, lines } = useCart();
  const order = useStore(demoOrderStore);

  if (!hydrated) {
    return (
      <div aria-busy className="grid gap-4" role="status">
        <span className="sr-only">Loading checkout…</span>
        <div className="skeleton relative h-12 w-1/2 overflow-hidden rounded-sm bg-coal" />
        <div className="skeleton relative h-96 overflow-hidden rounded-sm bg-coal" />
      </div>
    );
  }

  if (order) return <OrderConfirmation order={order} />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid max-w-md justify-items-center gap-5 py-12 text-center">
        <span className="grid size-24 place-items-center rounded-full border border-dashed border-paper/30 text-gold">
          <ShoppingBag aria-hidden className="size-10" />
        </span>
        <h2 className="display-md">Nothing to check out</h2>
        <p className="text-smoke">Your cart is empty. Add a few mighty bites first.</p>
        <ButtonLink href="/menu" size="lg">
          Browse the menu
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <header className="mb-10 max-w-3xl">
        <h1 className="display-xl">Checkout</h1>
        <p className="mt-3 text-lg text-smoke">
          A demo checkout: fill it in to see the confirmation. Nothing is sent and nothing is charged.
        </p>
      </header>
      <CheckoutForm />
    </>
  );
}
