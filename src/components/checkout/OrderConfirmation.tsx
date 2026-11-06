"use client";

import { m } from "framer-motion";
import { Check, Copy, MapPin, Navigation, ShoppingBag, Truck } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { demoOrderStore } from "@/hooks/useDemoOrder";
import { lineTotal } from "@/lib/cart";
import { formatDistance } from "@/lib/distance";
import { formatCurrency } from "@/lib/formatCurrency";
import type { DemoOrder } from "@/types/order";
import { CartSummary } from "../cart/CartSummary";
import { Badge } from "../ui/Badge";
import { ButtonLink, Button } from "../ui/Button";

const formatPlacedAt = (ts: number) =>
  new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }).format(ts);

/** Professional — but unmistakably DEMO — order confirmation. */
export function OrderConfirmation({ order }: { order: DemoOrder }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const isDelivery = order.method === "delivery";

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(order.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure context / permissions): the reference is still on screen.
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl"
    >
      <div role="status" className="rounded-sm border-2 border-dashed border-gold bg-gold/10 p-4 text-center sm:p-5">
        <p className="font-display text-2xl uppercase tracking-[0.08em] text-gold sm:text-3xl">
          Demo order confirmation
        </p>
        <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-paper/90">
          This is a demonstration. <strong>No order was sent to MAD</strong>, nobody will prepare or deliver it, and no
          payment was taken.
        </p>
      </div>

      <div className="mt-10 grid place-items-center text-center">
        <m.span
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.15 }}
          className="grid size-20 place-items-center rounded-full bg-leaf text-ink"
        >
          <Check aria-hidden className="size-10" strokeWidth={3} />
        </m.span>
        <h1 ref={headingRef} tabIndex={-1} className="display-lg mt-6 outline-none">
          Thanks, {order.customer.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-3 text-smoke">Here&apos;s what a confirmation for this order would look like.</p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-sm border border-paper/20 bg-coal px-4 py-3">
          <span className="text-sm text-smoke">Demo reference</span>
          <span className="font-display text-3xl tracking-[0.1em]">{order.reference}</span>
          <button
            type="button"
            onClick={copyReference}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-paper/25 px-3 text-sm font-semibold transition-colors hover:bg-paper hover:text-ink"
          >
            {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-smoke">Placed {formatPlacedAt(order.placedAt)} (Pakistan time)</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="c-fulfil" className="rounded-sm border border-paper/15 bg-coal p-5">
          <h2 id="c-fulfil" className="flex items-center gap-2 font-display text-2xl uppercase tracking-wide text-gold">
            {isDelivery ? <Truck aria-hidden className="size-5" /> : <ShoppingBag aria-hidden className="size-5" />}
            {isDelivery ? "Delivery" : "Pickup"}
          </h2>
          <p className="mt-3 font-semibold">{order.branch.displayName}</p>
          <p className="mt-1 flex gap-2 text-sm text-smoke">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" />
            {order.branch.address}
          </p>
          {isDelivery && order.distanceKm !== null && (
            <p className="mt-2 text-sm text-smoke">{formatDistance(order.distanceKm)} from your pin</p>
          )}
          {isDelivery && order.customer.address && (
            <p className="mt-3 text-sm">
              <span className="block text-xs font-semibold uppercase tracking-wider text-smoke">Deliver to</span>
              {order.customer.address}
            </p>
          )}
          <a
            href={order.branch.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-gold underline-offset-4 hover:underline"
          >
            <Navigation aria-hidden className="size-4" />
            {isDelivery ? "Branch on Google Maps" : "Directions to this branch"}
          </a>
        </section>

        <section aria-labelledby="c-you" className="rounded-sm border border-paper/15 bg-coal p-5">
          <h2 id="c-you" className="font-display text-2xl uppercase tracking-wide text-gold">
            Your details
          </h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Detail label="Name" value={order.customer.fullName} />
            <Detail label="Mobile" value={order.customer.phone} />
            {order.customer.email && <Detail label="Email" value={order.customer.email} />}
            {order.customer.instructions && <Detail label="Instructions" value={order.customer.instructions} />}
          </dl>
        </section>
      </div>

      <section aria-labelledby="c-items" className="mt-4 rounded-sm border border-paper/15 bg-coal p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="c-items" className="display-md">
            Order summary
          </h2>
          <Badge tone="demo">Demo</Badge>
        </div>
        <ul className="mt-4 divide-y divide-paper/10">
          {order.lines.map((line) => (
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
        <CartSummary
          totals={order.totals}
          method={order.method}
          hasDemoPrices={order.lines.some((l) => l.demoPrice)}
          className="mt-4"
        />
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/menu" size="lg" onClick={() => demoOrderStore.reset()}>
          Back to the menu
        </ButtonLink>
        <Button size="lg" variant="outline" onClick={() => demoOrderStore.reset()}>
          Start another demo order
        </Button>
      </div>
    </m.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-smoke">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
