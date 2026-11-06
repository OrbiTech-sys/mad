"use client";

import { useState } from "react";
import { useLocation } from "@/hooks/useOrder";
import { ui } from "@/hooks/useUi";
import { formatDistance } from "@/lib/distance";
import { cn } from "@/lib/cn";
import type { Branch, Coordinates } from "@/types/branch";
import { BranchCard } from "./BranchCard";
import { LazyLocationMap } from "./LocationMapLazy";

/**
 * Map-led branch discovery: a map with every branch's 5 km delivery area (and the customer's
 * pin once set) beside numbered branch cards. Hovering/focusing a card highlights its area.
 *
 * `interactive` lets the customer tap the map to check delivery for any spot; that runs the
 * same "location changed" logic as everywhere else (recalculate, re-assign branch, notify).
 */
export function BranchesExplorer({
  branches,
  tall,
  interactive,
}: {
  branches: Branch[];
  tall?: boolean;
  interactive?: boolean;
}) {
  const { context, evaluation, setLocation } = useLocation();
  const [highlight, setHighlight] = useState<string | null>(null);

  function pick(coords: Coordinates) {
    const { context: next, notices } = setLocation({ coords, source: "map-pin" });
    // Warnings / switches already appear in the persistent banner; confirm quietly otherwise.
    if (notices.length === 0 && next.branchId) {
      const branch = branches.find((b) => b.id === next.branchId);
      ui.toast(
        next.method === "delivery"
          ? `Delivery available from ${branch?.displayName}`
          : `Location updated · pickup at ${branch?.displayName}`,
      );
    }
  }

  const nearest = evaluation.nearest;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:order-2 lg:col-span-7">
        <LazyLocationMap
          branches={branches}
          customer={context.coords}
          accuracyM={context.accuracyM}
          highlightBranchId={highlight ?? context.branchId}
          onPick={interactive ? pick : undefined}
          hint="Tap the map to check delivery to that spot"
          ariaLabel="Map of the three MAD branches, each with its 5 km delivery area"
          className={cn("h-80 w-full rounded-sm sm:h-[26rem] lg:sticky lg:top-28", tall ? "lg:h-[36rem]" : "lg:h-[32rem]")}
        />
        <p className="mt-3 text-sm text-smoke">
          Dashed circles show each branch&apos;s {branches[0]?.deliveryRadiusKm ?? 5} km delivery area (straight-line
          distance, not driving distance).
          {interactive && context.coords && nearest
            ? ` Your pin is ${formatDistance(nearest.distanceKm, nearest.branch.deliveryRadiusKm)} from ${nearest.branch.displayName}.`
            : ""}
        </p>
      </div>
      <div className="grid content-start gap-4 lg:order-1 lg:col-span-5">
        {branches.map((branch, index) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            number={index + 1}
            active={highlight === branch.id}
            onHover={setHighlight}
          />
        ))}
      </div>
    </div>
  );
}
