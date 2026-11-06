import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { cn } from "@/lib/cn";
import type { FulfilmentMethod, OrderTotals } from "@/types/order";

/**
 * Order totals. Delivery fee, tax and minimum order are NOT invented: when they aren't
 * configured (data/site.ts → SITE.fees) a clear notice is shown instead of a made-up number.
 */
export function CartSummary({
  totals,
  method,
  hasDemoPrices,
  className,
}: {
  totals: OrderTotals;
  method: FulfilmentMethod | null;
  hasDemoPrices: boolean;
  className?: string;
}) {
  const deliveryFeePending = method === "delivery" && totals.deliveryFee === null;

  return (
    <dl className={cn("grid gap-2 text-sm", className)}>
      <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
      {method === "delivery" && (
        <Row
          label="Delivery fee"
          value={totals.deliveryFee !== null ? formatCurrency(totals.deliveryFee) : "To be confirmed"}
          muted={totals.deliveryFee === null}
        />
      )}
      {totals.tax !== null && <Row label="Tax" value={formatCurrency(totals.tax)} />}
      <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-paper/15 pt-3">
        <dt className="font-display text-2xl uppercase tracking-wide">Total</dt>
        <dd className="font-display text-3xl tabular-nums text-gold">{formatCurrency(totals.total)}</dd>
      </div>

      {(deliveryFeePending || !totals.feesConfigured || hasDemoPrices) && (
        <p className="mt-1 flex gap-2 text-xs leading-relaxed text-smoke">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            {hasDemoPrices && "Prices are demo placeholders. "}
            {!totals.feesConfigured &&
              "Delivery fees, taxes and minimum order haven't been configured for this demo, so none are added. "}
            {totals.belowMinimum && totals.minimumOrder !== null
              ? `Minimum order is ${formatCurrency(totals.minimumOrder)}.`
              : ""}
          </span>
        </p>
      )}
    </dl>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-smoke">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", muted && "font-normal text-smoke")}>{value}</dd>
    </div>
  );
}
