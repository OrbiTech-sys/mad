"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { ui } from "@/hooks/useUi";
import { formatCurrency } from "@/lib/formatCurrency";
import { dealPrice, productPrice } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { Category, Product, ResolvedDeal } from "@/types/product";
import { Badge } from "../ui/Badge";

const SIZES = "(min-width:1280px) 22vw, (min-width:1024px) 30vw, (min-width:640px) 45vw, 40vw";

/** + button with check feedback. Disabled (with reason) when the item can't be ordered. */
function AddButton({ name, onAdd, disabled }: { name: string; onAdd: () => boolean; disabled?: boolean }) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={added ? `${name} added to cart` : `Add ${name} to cart`}
      onClick={() => {
        if (!onAdd()) return;
        setAdded(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1400);
      }}
      className={cn(
        "relative z-10 grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm transition-[background-color,transform,box-shadow] duration-200",
        "motion-safe:active:scale-95",
        added ? "bg-leaf-deep text-bone" : "bg-ink text-cream hover:bg-ember hover:text-ink motion-safe:hover:-translate-y-0.5",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={added ? "check" : "plus"}
          initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {added ? <Check aria-hidden className="size-6" /> : <Plus aria-hidden className="size-6" />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}

function PriceBlock({ price, demo }: { price: number | null; demo: boolean }) {
  if (price === null) {
    return <p className="text-sm font-semibold text-ash">Price to be confirmed</p>;
  }
  return (
    <div className="min-w-0">
      <p className="font-display text-3xl leading-none tabular-nums">{formatCurrency(price)}</p>
      {demo && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ember-deep">Demo price</p>}
    </div>
  );
}

/**
 * Product card. On phones it is a compact horizontal row (more items per screen, app-like);
 * from sm up it becomes a photo-first vertical card. The whole card opens the details modal
 * through the "stretched link" on the name; the + button stays independently clickable.
 */
export function ProductCard({
  product,
  category,
  priority = false,
}: {
  product: Product;
  category?: Category;
  priority?: boolean;
}) {
  const { addProduct } = useCart();
  const price = productPrice(product);
  const orderable = product.available && price !== null;

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-sm bg-bone text-ink shadow-card sm:flex-col",
        "transition-[translate,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1 hover:shadow-lift",
      )}
    >
      <div className="relative aspect-square w-[38%] shrink-0 overflow-hidden bg-cream-deep sm:aspect-[4/3] sm:w-full">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes={SIZES}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.07]"
          style={{ objectPosition: product.image.focus }}
        />
        <div className="absolute left-2 top-2 hidden sm:block">
          <Badge tone="dark" className="bg-ink/85 text-cream">
            {category?.name ?? product.categoryId}
          </Badge>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl uppercase leading-[0.95] sm:text-3xl">
            <button
              type="button"
              onClick={() => ui.openProduct(product)}
              className="text-left outline-offset-8 after:absolute after:inset-0 after:content-['']"
              aria-label={`${product.name} — view details`}
            >
              {product.name}
            </button>
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-ash">{product.tagline}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <PriceBlock price={price} demo={product.priceStatus === "demo"} />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ash">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", product.available ? "bg-leaf-deep" : "bg-danger-deep")}
              />
              {product.available ? "Available" : "Unavailable"}
            </p>
          </div>
          <AddButton name={product.name} disabled={!orderable} onAdd={() => addProduct(product)} />
        </div>
      </div>
    </article>
  );
}

/** Deal shown inside the menu grid (the larger promotional version lives in the Deals section). */
export function MenuDealCard({ deal }: { deal: ResolvedDeal }) {
  const { addDeal } = useCart();
  const price = dealPrice(deal);

  return (
    <article className="group relative flex overflow-hidden rounded-sm bg-bone text-ink shadow-card transition-[translate,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-1 hover:shadow-lift sm:flex-col">
      <div className="relative aspect-square w-[38%] shrink-0 overflow-hidden bg-cream-deep sm:aspect-[4/3] sm:w-full">
        <Image
          src={deal.image.src}
          alt={deal.image.alt}
          fill
          sizes={SIZES}
          className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.07]"
          style={{ objectPosition: deal.image.focus }}
        />
        <div className="absolute left-2 top-2">
          <Badge tone="demo">Demo deal</Badge>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="font-display text-2xl uppercase leading-[0.95] sm:text-3xl">{deal.name}</h3>
          <ul className="mt-1.5 text-sm leading-snug text-ash">
            {deal.items.map((item) => (
              <li key={item.product.id}>
                {item.quantity} × {item.product.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <PriceBlock price={price} demo />
          <AddButton name={deal.name} disabled={price === null} onAdd={() => addDeal(deal)} />
        </div>
      </div>
    </article>
  );
}
