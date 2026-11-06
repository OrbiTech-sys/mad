"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { ui } from "@/hooks/useUi";
import { formatCurrency } from "@/lib/formatCurrency";
import { productPrice } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";
import { Reveal } from "../ui/Reveal";

/** Editorial "signature" showcase: one big feature plus supporting tiles. Uses products flagged `featured`. */
export function FeaturedProducts({ products }: { products: Product[] }) {
  const featured = products.filter((p) => p.featured).slice(0, 5);
  if (featured.length < 3) return null;
  const [lead, ...rest] = featured;

  return (
    <section aria-labelledby="signature-title" className="grain relative isolate bg-ink py-16 md:py-24">
      <span aria-hidden className="grain-layer" />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="max-w-3xl">
          <h2 id="signature-title" className="display-xl">
            The <span className="text-gold">signature</span> bites
          </h2>
          <p className="mt-4 max-w-xl text-lg text-smoke">
            The ones to start with. Tap any card for details — photos are representative until MAD supplies its own.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-3 md:mt-14 md:gap-4 lg:grid-cols-12 lg:grid-rows-2">
          <Tile product={lead} className="min-h-[26rem] lg:col-span-6 lg:row-span-2 lg:min-h-[36rem]" large />
          {rest.map((product) => (
            <Tile key={product.id} product={product} className="min-h-[15rem] lg:col-span-3" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tile({ product, className, large }: { product: Product; className?: string; large?: boolean }) {
  const { addProduct } = useCart();
  const price = productPrice(product);

  return (
    <Reveal className={cn("group relative isolate overflow-hidden rounded-sm bg-coal", className)}>
      <Image
        src={product.image.src}
        alt={product.image.alt}
        fill
        sizes={large ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 100vw"}
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.06]"
        style={{ objectPosition: product.image.focus }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
        <div className="min-w-0">
          <h3 className={cn("font-display uppercase leading-[0.92]", large ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl")}>
            <button
              type="button"
              onClick={() => ui.openProduct(product)}
              aria-label={`${product.name} — view details`}
              className="text-left after:absolute after:inset-0 after:content-['']"
            >
              {product.name}
            </button>
          </h3>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-sm text-paper/85">
            {price !== null ? (
              <>
                <span className="font-display text-2xl text-gold">{formatCurrency(price)}</span>
                {product.priceStatus === "demo" && <span className="text-xs uppercase tracking-wider text-smoke">demo price</span>}
              </>
            ) : (
              "Price to be confirmed"
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={price === null || !product.available}
          onClick={() => addProduct(product)}
          aria-label={`Add ${product.name} to cart`}
          className="relative z-10 grid size-12 shrink-0 place-items-center rounded-sm bg-ember text-ink transition-[filter,transform] hover:brightness-110 motion-safe:active:scale-95 disabled:opacity-40"
        >
          <Plus aria-hidden className="size-6" />
        </button>
      </div>
    </Reveal>
  );
}
