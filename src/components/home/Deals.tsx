"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/formatCurrency";
import { dealPrice } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { ResolvedDeal } from "@/types/product";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

/**
 * Promotional section. EVERYTHING here is demo data (data/deals.ts): no discounts, expiry
 * dates or "active offers" are invented. Each deal is priced as the plain sum of its items.
 */
export function Deals({ deals }: { deals: ResolvedDeal[] }) {
  if (deals.length === 0) return null;
  const [lead, second, third, ...more] = deals;

  return (
    <section id="deals" aria-labelledby="deals-title" data-surface="light" className="bg-ember py-16 text-ink md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="deals-title" className="display-xl lg:col-span-7">
            Deals &amp; combos
          </h2>
          <div className="lg:col-span-4 lg:col-start-9">
            <Badge tone="dark" className="bg-ink text-cream">
              Demo content
            </Badge>
            <p className="mt-3 text-lg font-medium leading-snug">
              These bundles are placeholders. MAD&apos;s real offers, prices and dates will replace them.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-3 md:mt-14 md:gap-4 lg:grid-cols-12">
          {lead && <DealCard deal={lead} large className="min-h-[26rem] lg:col-span-7 lg:row-span-2" />}
          {second && <DealCard deal={second} className="min-h-[16rem] lg:col-span-5" />}
          {third && <DealCard deal={third} className="min-h-[16rem] lg:col-span-5" />}
          {more.map((deal) => (
            <DealCard key={deal.id} deal={deal} className="min-h-[18rem] lg:col-span-6" />
          ))}
        </div>
      </div>
    </section>
  );
}

function DealCard({ deal, className, large }: { deal: ResolvedDeal; className?: string; large?: boolean }) {
  const { addDeal } = useCart();
  const price = dealPrice(deal);

  return (
    <Reveal as="article" data-surface="dark" className={cn("group relative isolate flex overflow-hidden rounded-sm bg-ink text-paper", className)}>
      <Image
        src={deal.image.src}
        alt={deal.image.alt}
        fill
        sizes={large ? "(min-width:1024px) 58vw, 100vw" : "(min-width:1024px) 40vw, 100vw"}
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.05]"
        style={{ objectPosition: deal.image.focus }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />

      <div className="relative z-10 mt-auto flex w-full flex-col gap-4 p-5 md:p-6">
        <div>
          <Badge tone="demo">Demo deal</Badge>
          <h3 className={cn("mt-3 font-display uppercase leading-[0.92]", large ? "text-6xl md:text-7xl" : "text-4xl md:text-5xl")}>
            {deal.name}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-snug text-paper/85">
            {deal.items.map((i) => `${i.quantity} × ${i.product.name}`).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {price !== null ? (
              <>
                <p className="font-display text-4xl leading-none text-gold md:text-5xl">{formatCurrency(price)}</p>
                <p className="mt-1 text-xs text-smoke">Demo total · sum of item prices, no discount applied</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-smoke">Price to be confirmed</p>
            )}
          </div>
          <Button variant="gold" size="md" disabled={price === null} onClick={() => addDeal(deal)}>
            <Plus aria-hidden className="size-5" />
            Add deal
            <span className="sr-only"> {deal.name} to cart</span>
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
