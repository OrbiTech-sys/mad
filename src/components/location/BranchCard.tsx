"use client";

import { Navigation, Phone, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBranch } from "@/hooks/useOrder";
import { ui } from "@/hooks/useUi";
import { directionsUrl } from "@/lib/maps";
import { cn } from "@/lib/cn";
import type { Branch } from "@/types/branch";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { BranchDeliveryIndicator } from "./DeliveryStatus";

/** One branch: address, directions, pickup availability, live delivery verdict, and "Order from this branch". */
export function BranchCard({
  branch,
  number,
  active,
  onHover,
}: {
  branch: Branch;
  /** Matches the numbered pin on the map. */
  number: number;
  active?: boolean;
  onHover?: (branchId: string | null) => void;
}) {
  const router = useRouter();
  const { selectBranch, selectedBranch, method } = useBranch();
  const isSelected = selectedBranch?.id === branch.id && method !== null;

  function orderFromHere() {
    const result = selectBranch(branch.id);
    if (result.status === "set") {
      ui.toast(`${method === "delivery" ? "Ordering from" : "Pickup at"} ${branch.displayName}`);
      router.push("/menu");
    } else {
      // No method yet: let the customer choose pickup or delivery for THIS branch.
      ui.openLocation({ view: "branches", preferredBranchId: branch.id, afterComplete: "menu" });
    }
  }

  return (
    <article
      onMouseEnter={() => onHover?.(branch.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocusCapture={() => onHover?.(branch.id)}
      onBlurCapture={() => onHover?.(null)}
      aria-labelledby={`branch-${branch.id}`}
      className={cn(
        "grid gap-4 rounded-sm border p-5 transition-colors duration-200",
        active || isSelected ? "border-ember bg-ember/[0.07]" : "border-paper/15 bg-ink/40 hover:border-paper/40",
      )}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ember font-display text-xl leading-none text-ink"
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`branch-${branch.id}`} className="font-display text-4xl uppercase leading-none tracking-wide">
            {branch.name}
          </h3>
          <p className="mt-2 text-sm leading-snug text-smoke">{branch.address}</p>
        </div>
        {isSelected && <Badge tone="ember">Your branch</Badge>}
      </header>

      <div className="grid gap-2">
        <BranchDeliveryIndicator branch={branch} />
        <p className="flex items-center gap-2 text-sm text-smoke">
          <ShoppingBag aria-hidden className="size-4 text-ember" />
          {branch.pickupAvailable ? "Pickup available" : "Pickup not available"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={orderFromHere} className="flex-1 sm:flex-none">
          Order from this branch
        </Button>
        <a
          href={directionsUrl(branch)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-paper/30 px-4 text-sm font-semibold transition-colors hover:border-paper hover:bg-paper hover:text-ink"
        >
          <Navigation aria-hidden className="size-4" />
          Directions
          <span className="sr-only"> to {branch.displayName} (opens Google Maps)</span>
        </a>
        {branch.phone && (
          <a
            href={`tel:${branch.phone.tel}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm font-semibold text-gold underline-offset-4 hover:underline"
          >
            <Phone aria-hidden className="size-4" />
            {branch.phone.display}
          </a>
        )}
      </div>
    </article>
  );
}
