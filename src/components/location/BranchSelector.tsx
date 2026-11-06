"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import type { DeliveryEvaluation } from "@/lib/delivery";
import { formatDistance } from "@/lib/distance";
import { cn } from "@/lib/cn";
import type { Branch } from "@/types/branch";
import type { FulfilmentMethod } from "@/types/order";
import { Badge } from "../ui/Badge";

/**
 * Radio list of branches. In `delivery` mode only branches that cover the customer's location
 * can be chosen (the rest explain why not). In `pickup` mode every active branch is selectable.
 * Native radio inputs → arrow-key navigation and screen-reader semantics come for free.
 */
export function BranchSelector({
  branches,
  evaluation,
  method,
  value,
  onChange,
  legend,
}: {
  branches: Branch[];
  evaluation: DeliveryEvaluation | null;
  method: FulfilmentMethod;
  value: string | null;
  onChange: (branchId: string) => void;
  legend: string;
}) {
  const name = useId();

  // Nearest first when we know where the customer is; otherwise keep the configured order.
  const rows = branches
    .map((branch, index) => {
      const entry = evaluation?.distances.find((d) => d.branch.id === branch.id) ?? null;
      return { branch, entry, number: index + 1 };
    })
    .sort((a, b) => (a.entry && b.entry ? a.entry.distanceKm - b.entry.distanceKm : a.number - b.number));

  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 text-sm font-semibold text-paper">{legend}</legend>
      <div className="grid gap-2">
        {rows.map(({ branch, entry, number }) => {
          const deliverable = method === "delivery" ? Boolean(entry?.withinRadius) : branch.pickupAvailable;
          const checked = value === branch.id;
          const inputId = `${name}-${branch.id}`;

          return (
            <div key={branch.id}>
              <input
                id={inputId}
                type="radio"
                name={name}
                className="peer sr-only"
                checked={checked}
                disabled={!deliverable}
                onChange={() => onChange(branch.id)}
              />
              <label
                htmlFor={inputId}
                className={cn(
                  "flex min-h-16 cursor-pointer items-center gap-3 rounded-sm border p-3 transition-colors duration-150",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold",
                  checked ? "border-ember bg-ember/10" : "border-paper/15 hover:border-paper/40",
                  !deliverable && "cursor-not-allowed opacity-60 hover:border-paper/15",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full font-display text-lg leading-none",
                    checked ? "bg-ember text-ink" : "bg-paper/10 text-paper",
                  )}
                >
                  {checked ? <Check className="size-4" /> : number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">{branch.displayName}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-smoke">{branch.address}</span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {entry && (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatDistance(entry.distanceKm, branch.deliveryRadiusKm)}
                    </span>
                  )}
                  {method === "delivery" ? (
                    entry?.withinRadius ? (
                      <Badge tone="ok">Delivers to you</Badge>
                    ) : entry ? (
                      <Badge tone="warn">Outside {branch.deliveryRadiusKm} km</Badge>
                    ) : null
                  ) : (
                    <Badge tone="dark">Pickup</Badge>
                  )}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
