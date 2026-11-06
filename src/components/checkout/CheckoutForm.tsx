"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Info, Truck, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useCart } from "@/hooks/useCart";
import { demoOrderStore } from "@/hooks/useDemoOrder";
import { orderStore, useBranches, useLocation } from "@/hooks/useOrder";
import { ui } from "@/hooks/useUi";
import { formatDistance } from "@/lib/distance";
import { formatCurrency } from "@/lib/formatCurrency";
import { lineTotal } from "@/lib/cart";
import { buildDemoOrder, generateOrderReference } from "@/lib/order";
import { validateFulfilment } from "@/lib/orderState";
import { createCheckoutSchema, type CheckoutValues } from "@/lib/validation";
import { CartSummary } from "../cart/CartSummary";
import { DeliveryStatusChip } from "../location/DeliveryStatus";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Input";

/**
 * Frontend-only checkout. Validates the form (React Hook Form + Zod), re-checks delivery
 * eligibility at the moment of submission, and produces a DEMO confirmation. Nothing is sent to
 * a server and no payment is taken.
 */
export function CheckoutForm() {
  const branches = useBranches();
  const { lines, totals, clear } = useCart();
  const { context, fulfilment } = useLocation();
  const [submitError, setSubmitError] = useState<{ message: string; showFix: boolean } | null>(null);

  const schema = useMemo(() => createCheckoutSchema(context.method), [context.method]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", email: "", address: context.address, instructions: "" },
  });

  const hasDemoPrices = lines.some((l) => l.demoPrice);
  const isDelivery = context.method === "delivery";
  const blocked = !fulfilment.ok;

  async function onSubmit(values: CheckoutValues) {
    setSubmitError(null);

    // 1 — Re-check eligibility against the CURRENT stored state, not what was true when the page loaded.
    const check = validateFulfilment(orderStore.getSnapshot(), branches);
    if (!check.ok) {
      setSubmitError({ message: check.message, showFix: true });
      ui.pushNotice({
        id: "checkout-fulfilment",
        tone: "warning",
        title: "We couldn't confirm how to fulfil this order",
        message: check.message,
        action: "change-location",
      });
      return;
    }
    if (lines.length === 0) {
      setSubmitError({ message: "Your cart is empty. Add something first.", showFix: false });
      return;
    }
    if (totals.belowMinimum) {
      setSubmitError({ message: "Your order is below the minimum order amount.", showFix: false });
      return;
    }

    // 2 — A short beat so the loading state is visible (this is a simulation).
    await new Promise((resolve) => setTimeout(resolve, 650));

    // 3 — Build and store the demo confirmation, then clear the cart.
    demoOrderStore.set(
      buildDemoOrder({
        reference: generateOrderReference(),
        fulfilment: check,
        customer: values,
        lines,
        totals,
      }),
    );
    clear();
    ui.clearNotices();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid content-start gap-8 lg:col-span-7">
        {/* ---------------------------------------------- fulfilment */}
        <section aria-labelledby="fulfil-title" className="grid gap-4">
          <h2 id="fulfil-title" className="display-md">
            1 · {isDelivery ? "Delivery" : "Pickup"} details
          </h2>

          <DeliveryStatusChip variant="block" />

          {fulfilment.ok ? (
            <p className="flex items-start gap-3 rounded-sm border border-leaf/40 bg-leaf/10 p-3 text-sm">
              {fulfilment.method === "delivery" ? (
                <Truck aria-hidden className="mt-0.5 size-5 shrink-0 text-leaf" />
              ) : (
                <ShoppingBag aria-hidden className="mt-0.5 size-5 shrink-0 text-leaf" />
              )}
              <span>
                {fulfilment.method === "delivery" ? (
                  <>
                    Delivering from <strong>{fulfilment.branch.displayName}</strong> —{" "}
                    {formatDistance(fulfilment.distanceKm, fulfilment.branch.deliveryRadiusKm)} from your pin, inside
                    its {fulfilment.branch.deliveryRadiusKm} km delivery area.
                  </>
                ) : (
                  <>
                    Collect from <strong>{fulfilment.branch.displayName}</strong>, {fulfilment.branch.address}.
                  </>
                )}
              </span>
            </p>
          ) : (
            <div role="alert" className="grid gap-3 rounded-sm border border-gold bg-gold/10 p-4">
              <p className="flex gap-2 text-sm font-semibold">
                <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
                {fulfilment.message}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => ui.openLocation()}>
                  Change location
                </Button>
                <Button size="sm" variant="outline" onClick={() => ui.openLocation({ view: "branches" })}>
                  Choose pickup
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ---------------------------------------------- customer */}
        <section aria-labelledby="you-title" className="grid gap-5">
          <h2 id="you-title" className="display-md">
            2 · Your details
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="fullName" label="Full name" error={errors.fullName?.message}>
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="Ayesha Khan"
                invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                {...register("fullName")}
              />
            </Field>

            <Field
              id="phone"
              label="Mobile number"
              error={errors.phone?.message}
              hint="Pakistani mobile, e.g. 0300 1234567"
            >
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="03XX XXXXXXX"
                invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                {...register("phone")}
              />
            </Field>
          </div>

          <Field id="email" label="Email" optional error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </Field>

          {isDelivery && (
            <Field
              id="address"
              label="Delivery address"
              error={errors.address?.message}
              hint={
                context.source === "demo"
                  ? "You're using a demo test location — type any address for the demo."
                  : "House / flat, street and area. Your map pin was used to check delivery; this tells the rider where to come."
              }
            >
              <Textarea
                id="address"
                rows={3}
                autoComplete="street-address"
                placeholder="House 12, Street 4, Block D2, Johar Town"
                invalid={!!errors.address}
                aria-describedby={errors.address ? "address-error" : "address-hint"}
                {...register("address")}
              />
            </Field>
          )}

          <Field id="instructions" label="Order instructions" optional error={errors.instructions?.message}>
            <Textarea
              id="instructions"
              rows={3}
              placeholder="Anything we should know?"
              invalid={!!errors.instructions}
              aria-describedby={errors.instructions ? "instructions-error" : undefined}
              {...register("instructions")}
            />
          </Field>
        </section>

        {/* ---------------------------------------------- submit */}
        <section className="grid gap-4">
          <p className="flex gap-3 rounded-sm border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed">
            <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
            <span>
              <strong>This is a demo.</strong> Placing it only shows a confirmation screen. Nothing is sent to MAD,
              nobody will cook or deliver it, and no payment is taken.
            </span>
          </p>

          {submitError && (
            <p role="alert" className="rounded-sm border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
              {submitError.message}
              {submitError.showFix && (
                <>
                  {" "}
                  <button type="button" onClick={() => ui.openLocation()} className="font-semibold underline underline-offset-4">
                    Change location
                  </button>
                </>
              )}
            </p>
          )}

          <Button type="submit" size="lg" block loading={isSubmitting} disabled={blocked || lines.length === 0}>
            Place demo order · {formatCurrency(totals.total)}
          </Button>
        </section>
      </form>

      {/* ---------------------------------------------- summary */}
      <aside aria-labelledby="summary-title" className="lg:col-span-5">
        <div className="rounded-sm border border-paper/15 bg-coal p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 id="summary-title" className="display-md">
            Your order
          </h2>
          <ul className="mt-4 divide-y divide-paper/10">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 py-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-char">
                  <Image src={line.image} alt={line.imageAlt} fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{line.name}</p>
                  <p className="text-sm text-smoke">
                    {line.quantity} × {formatCurrency(line.unitPrice)}
                  </p>
                </div>
                <p className="font-display text-xl tabular-nums">{formatCurrency(lineTotal(line))}</p>
              </li>
            ))}
          </ul>
          <CartSummary totals={totals} method={context.method} hasDemoPrices={hasDemoPrices} className="mt-4" />
        </div>
      </aside>
    </div>
  );
}
