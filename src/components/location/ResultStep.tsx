"use client";

import { AlertTriangle, CheckCircle2, HelpCircle, ShoppingBag, Truck, type LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { evaluateDelivery } from "@/lib/delivery";
import { formatDistance } from "@/lib/distance";
import { cn } from "@/lib/cn";
import type { Branch, Coordinates } from "@/types/branch";
import type { FulfilmentMethod, LocationSource } from "@/types/order";
import { Button } from "../ui/Button";
import { BranchSelector } from "./BranchSelector";
import { LazyLocationMap } from "./LocationMapLazy";

export interface LocationDraft {
  coords: Coordinates;
  source: LocationSource;
  accuracyM: number | null;
  address: string;
}

const SOURCE_LABEL: Record<LocationSource, string> = {
  gps: "Your device location",
  "map-pin": "Pin you placed",
  demo: "Demo test location",
};

/**
 * Shows the delivery decision for a verified position and lets the customer confirm.
 *
 * Scenario A (inside ≥1 radius) → recommend nearest eligible branch, delivery on, pickup optional.
 * Scenario B (outside all)      → friendly explanation, pickup at any active branch.
 * If the pin is dragged so that delivery stops being valid, the selection flips to pickup and
 * says so in a live region — it never keeps an invalid delivery choice silently.
 */
export function ResultStep({
  draft,
  branches,
  preferredBranchId,
  onMovePin,
  onConfirm,
  onChangeLocation,
}: {
  draft: LocationDraft;
  branches: Branch[];
  preferredBranchId: string | null;
  onMovePin: (coords: Coordinates) => void;
  /** Returns an error message, or null on success. */
  onConfirm: (choice: { method: FulfilmentMethod; branchId: string }) => string | null;
  onChangeLocation: () => void;
}) {
  const evaluation = useMemo(
    () => evaluateDelivery(draft.coords, branches, { accuracyM: draft.accuracyM }),
    [draft.coords, draft.accuracyM, branches],
  );
  const [wantedMethod, setWantedMethod] = useState<FulfilmentMethod | null>(null);
  const [wantedBranch, setWantedBranch] = useState<string | null>(preferredBranchId);
  const [error, setError] = useState<string | null>(null);

  const canDeliver = evaluation.status === "eligible";

  // Effective selection, derived on every render so it can never go stale.
  const { method, branchId, flipped } = useMemo(() => {
    let m: FulfilmentMethod = wantedMethod ?? (canDeliver ? "delivery" : "pickup");
    let didFlip = false;
    if (m === "delivery" && !canDeliver) {
      m = "pickup";
      didFlip = wantedMethod === "delivery";
    }

    let b = wantedBranch;
    if (m === "delivery") {
      const ok = evaluation.eligible.some((e) => e.branch.id === b);
      if (!ok) b = evaluation.nearestEligible?.branch.id ?? null;
    } else if (!b || !branches.some((x) => x.id === b)) {
      b = evaluation.nearest?.branch.id ?? branches[0]?.id ?? null;
    }
    return { method: m, branchId: b, flipped: didFlip };
  }, [wantedMethod, wantedBranch, canDeliver, evaluation, branches]);

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const nearest = evaluation.nearest;

  function confirm() {
    if (!branchId) return;
    setError(onConfirm({ method, branchId }));
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="display-md">Can we deliver to you?</h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-smoke">
          <span>
            {SOURCE_LABEL[draft.source]}
            {draft.accuracyM ? ` (accurate to about ${draft.accuracyM >= 1000 ? `${(draft.accuracyM / 1000).toFixed(1)} km` : `${draft.accuracyM} m`})` : ""}
          </span>
          <button
            type="button"
            onClick={onChangeLocation}
            className="min-h-9 font-semibold text-gold underline underline-offset-4"
          >
            Change
          </button>
        </p>
      </div>

      <LazyLocationMap
        branches={branches}
        customer={draft.coords}
        accuracyM={draft.accuracyM}
        highlightBranchId={branchId}
        onPick={onMovePin}
        ariaLabel="Map showing your location and each branch's 5 km delivery area"
        className="h-64 rounded-sm sm:h-72"
      />

      <div aria-live="polite" className="grid gap-3">
        {canDeliver && evaluation.nearestEligible ? (
          <VerdictCard tone="ok" icon={CheckCircle2} title="Good news — we deliver to you">
            {evaluation.eligible.length > 1
              ? `${evaluation.eligible.length} branches cover this spot. Nearest: ${evaluation.nearestEligible.branch.displayName}, ${formatDistance(evaluation.nearestEligible.distanceKm, evaluation.nearestEligible.branch.deliveryRadiusKm)} away.`
              : `${evaluation.nearestEligible.branch.displayName} is ${formatDistance(evaluation.nearestEligible.distanceKm, evaluation.nearestEligible.branch.deliveryRadiusKm)} away and delivers here.`}
          </VerdictCard>
        ) : nearest ? (
          <VerdictCard tone="warn" icon={AlertTriangle} title="Delivery isn't available at this location">
            Our nearest branch, {nearest.branch.displayName}, is{" "}
            {formatDistance(nearest.distanceKm, nearest.branch.deliveryRadiusKm)} away — outside its{" "}
            {nearest.branch.deliveryRadiusKm} km delivery area. No problem: you can pick up from any MAD branch.
          </VerdictCard>
        ) : (
          <VerdictCard tone="unknown" icon={HelpCircle} title="We can't check delivery right now">
            No branch has a verified location yet, so we can&apos;t confirm delivery. Pickup is still available.
          </VerdictCard>
        )}

        {evaluation.nearBoundary && (
          <p className="rounded-sm border border-gold/40 bg-gold/10 p-3 text-sm text-paper">
            You&apos;re close to the edge of a delivery area and your location is only approximate. Drag the pin to
            your exact spot to be sure.
          </p>
        )}
        {draft.source === "gps" && !evaluation.nearBoundary && (
          <p className="text-sm text-smoke">Not quite right? Tap the map or drag the pin to your exact spot.</p>
        )}
        {flipped && (
          <p role="status" className="rounded-sm border border-gold bg-gold/10 p-3 text-sm font-semibold text-paper">
            Delivery isn&apos;t available at the new pin, so we&apos;ve switched you to pickup.
          </p>
        )}
      </div>

      <div role="radiogroup" aria-label="How would you like to get your order?" className="grid grid-cols-2 gap-2">
        <MethodOption
          icon={Truck}
          label="Delivery"
          sub={canDeliver ? "To your pin" : "Not available here"}
          checked={method === "delivery"}
          disabled={!canDeliver}
          onSelect={() => setWantedMethod("delivery")}
        />
        <MethodOption
          icon={ShoppingBag}
          label="Pickup"
          sub="Collect in store"
          checked={method === "pickup"}
          onSelect={() => setWantedMethod("pickup")}
        />
      </div>

      <BranchSelector
        key={method}
        branches={branches}
        evaluation={evaluation}
        method={method}
        value={branchId}
        onChange={(id) => {
          setWantedBranch(id);
          setError(null);
        }}
        legend={method === "delivery" ? "Delivering from" : "Pick up from"}
      />

      {error && (
        <p role="alert" className="rounded-sm border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button size="lg" block disabled={!branch} onClick={confirm}>
        {branch ? (method === "delivery" ? `Deliver from ${branch.name}` : `Pick up from ${branch.name}`) : "Choose a branch"}
      </Button>
    </div>
  );
}

function VerdictCard({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "ok" | "warn" | "unknown";
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-sm border p-4",
        tone === "ok" && "border-leaf/40 bg-leaf/10",
        tone === "warn" && "border-gold/50 bg-gold/10",
        tone === "unknown" && "border-paper/20 bg-paper/5",
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-6 shrink-0", tone === "ok" ? "text-leaf" : tone === "warn" ? "text-gold" : "text-smoke")}
      />
      <div>
        <p className="font-display text-2xl uppercase leading-none tracking-wide">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-paper/90">{children}</p>
      </div>
    </div>
  );
}

function MethodOption({
  icon: Icon,
  label,
  sub,
  checked,
  disabled,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onSelect()}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-sm border p-3 text-left transition-colors duration-150",
        checked ? "border-ember bg-ember/10" : "border-paper/15 hover:border-paper/40",
        disabled && "cursor-not-allowed opacity-55 hover:border-paper/15",
      )}
    >
      <Icon aria-hidden className={cn("size-6 shrink-0", checked ? "text-ember" : "text-smoke")} />
      <span className="min-w-0">
        <span className="block font-display text-2xl uppercase leading-none tracking-wide">{label}</span>
        <span className="mt-1 block truncate text-xs text-smoke">{sub}</span>
      </span>
    </button>
  );
}
