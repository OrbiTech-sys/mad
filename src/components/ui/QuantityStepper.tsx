"use client";

import { AnimatePresence, m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { cn } from "@/lib/cn";

/**
 * − 2 + control. 44px touch targets. `min` of 0 lets the minus button reach "remove".
 * The number animates (transform/opacity only) whenever it changes.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_LINE_QUANTITY,
  label,
  tone = "dark",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** e.g. the product name, for screen readers */
  label: string;
  tone?: "dark" | "light";
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-10" : "size-11";
  const btn = cn(
    "grid place-items-center rounded-sm border transition-colors duration-150 disabled:pointer-events-none disabled:opacity-35",
    box,
    tone === "dark"
      ? "border-paper/25 text-paper hover:border-paper hover:bg-paper hover:text-ink"
      : "border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-cream",
  );

  return (
    <div role="group" aria-label={`Quantity of ${label}`} className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className={btn}
        aria-label={`Decrease quantity of ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus aria-hidden className="size-4" />
      </button>

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "relative grid h-10 min-w-9 place-items-center overflow-hidden text-center font-display text-2xl tabular-nums",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {value}
          </m.span>
        </AnimatePresence>
      </span>

      <button
        type="button"
        className={btn}
        aria-label={`Increase quantity of ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
