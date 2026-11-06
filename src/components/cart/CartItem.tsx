"use client";

import { m } from "framer-motion";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { lineTotal } from "@/lib/cart";
import { formatCurrency } from "@/lib/formatCurrency";
import type { CartLine } from "@/types/order";
import { QuantityStepper } from "../ui/QuantityStepper";

export function CartItem({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <m.li
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-3 border-b border-paper/10 py-4 last:border-b-0"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-char">
        <Image src={line.image} alt={line.imageAlt} fill sizes="80px" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{line.name}</p>
            <p className="mt-0.5 text-sm text-smoke">
              {formatCurrency(line.unitPrice)} each{line.demoPrice ? " · demo price" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${line.name} from cart`}
            className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-sm text-smoke transition-colors hover:bg-paper/10 hover:text-danger"
          >
            <Trash2 aria-hidden className="size-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <QuantityStepper value={line.quantity} onChange={onQuantity} label={line.name} size="sm" />
          <p className="font-display text-2xl tabular-nums tracking-wide" aria-label={`Line total ${formatCurrency(lineTotal(line))}`}>
            {formatCurrency(lineTotal(line))}
          </p>
        </div>
      </div>
    </m.li>
  );
}
