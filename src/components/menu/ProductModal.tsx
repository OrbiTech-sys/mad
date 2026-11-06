"use client";

import { Check, Info } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { ui, useUi } from "@/hooks/useUi";
import { formatCurrency } from "@/lib/formatCurrency";
import { productPrice } from "@/lib/pricing";
import type { Product } from "@/types/product";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { QuantityStepper } from "../ui/QuantityStepper";

/** Product details. Mounted once in AppProviders; open with ui.openProduct(product). */
export function ProductModal() {
  const product = useUi((s) => s.product);
  return (
    <Modal open={product !== null} onClose={ui.closeProduct} label={product ? `${product.name} details` : "Product details"} size="xl" surface="light">
      {product && <ProductDetails key={product.id} product={product} />}
    </Modal>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const { addProduct } = useCart();
  const [quantity, setQuantity] = useState(1);
  const price = productPrice(product);
  const orderable = product.available && price !== null;

  return (
    <div className="grid md:grid-cols-[1.05fr_1fr]">
      <div className="relative aspect-[4/3] bg-cream-deep md:aspect-auto md:min-h-[32rem]">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width:768px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: product.image.focus }}
        />
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-8">
        <div className="pr-8">
          <Badge tone="light">{product.categoryId.replace("-", " ")}</Badge>
          <h2 className="display-lg mt-3">{product.name}</h2>
          <p className="mt-3 text-lg text-ash">{product.tagline}</p>
        </div>

        {product.description ? (
          <p className="leading-relaxed">{product.description}</p>
        ) : (
          <p className="flex gap-2 rounded-sm border border-ink/15 bg-bone p-3 text-sm leading-relaxed text-ash">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            Ingredients, sizes and customisations will appear here once MAD confirms them. Photo is representative.
          </p>
        )}

        <div className="flex items-end justify-between gap-4 border-y border-ink/15 py-4">
          <div>
            {price !== null ? (
              <>
                <p className="font-display text-5xl leading-none tabular-nums">{formatCurrency(price)}</p>
                {product.priceStatus === "demo" && (
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-ember-deep">
                    Demo price — not an official MAD price
                  </p>
                )}
              </>
            ) : (
              <p className="font-semibold text-ash">Price to be confirmed</p>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ash">
            <span aria-hidden className={`size-2 rounded-full ${product.available ? "bg-leaf-deep" : "bg-danger-deep"}`} />
            {product.available ? "Available" : "Unavailable"}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-4">
          <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} tone="light" />
          <Button
            size="lg"
            variant="dark"
            className="min-w-0 flex-1"
            disabled={!orderable}
            onClick={() => {
              if (addProduct(product, quantity)) ui.closeProduct();
            }}
          >
            <Check aria-hidden className="hidden size-5 xs:block" />
            Add to cart{price !== null ? ` · ${formatCurrency(price * quantity)}` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
