"use client";

import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, ChevronDown, Info, MapPin, X } from "lucide-react";
import { useBranch, useLocation } from "@/hooks/useOrder";
import { ui, useUi } from "@/hooks/useUi";
import { formatDistance } from "@/lib/distance";
import { distanceFor } from "@/lib/delivery";
import { cn } from "@/lib/cn";
import type { Branch } from "@/types/branch";
import { Badge } from "../ui/Badge";

/**
 * Compact "where am I ordering from?" control. Opens the location modal.
 * - `nav`: single line for the header
 * - `block`: two-line card for menus, cart and checkout
 */
export function DeliveryStatusChip({
  variant = "nav",
  className,
}: {
  variant?: "nav" | "block";
  className?: string;
}) {
  const { hydrated, fulfilment, evaluation, context } = useLocation();
  const { selectedBranch } = useBranch();

  const open = () => ui.openLocation();
  const base =
    "group/chip inline-flex min-h-11 min-w-0 items-center gap-2 rounded-sm border text-left transition-colors duration-150 " +
    "border-paper/20 text-paper hover:border-paper/60";

  if (!hydrated) {
    return <span aria-hidden className={cn(base, "w-40 animate-pulse px-3 opacity-50", className)} />;
  }

  const ready = Boolean(context.method && selectedBranch);
  const deliveryBroken = ready && context.method === "delivery" && !fulfilment.ok;

  let primary = "Set your location";
  let secondary = "Delivery or pickup";
  if (ready && selectedBranch) {
    primary = `${context.method === "delivery" ? "Delivery" : "Pickup"} · ${selectedBranch.name}`;
    const entry = distanceFor(evaluation, selectedBranch.id);
    secondary =
      context.method === "delivery" && entry
        ? `${formatDistance(entry.distanceKm, selectedBranch.deliveryRadiusKm)} away`
        : context.method === "pickup"
          ? "Collect in store"
          : "";
    if (deliveryBroken) secondary = "Delivery unavailable — change";
  }

  if (variant === "nav") {
    return (
      <button type="button" onClick={open} className={cn(base, "size-11 justify-center xl:size-auto xl:max-w-[15rem] xl:justify-start xl:px-3", className)} aria-label={`${primary}. Change location`}>
        <MapPin aria-hidden className={cn("size-5 shrink-0 xl:size-4", ready && !deliveryBroken ? "text-ember" : "text-gold")} />
        <span className="hidden truncate text-sm font-semibold xl:inline">{primary}</span>
        <ChevronDown aria-hidden className="hidden size-4 shrink-0 text-smoke xl:block" />
      </button>
    );
  }

  return (
    <button type="button" onClick={open} className={cn(base, "w-full p-3", className)} aria-label={`${primary}. Change location`}>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          deliveryBroken ? "bg-danger/15 text-danger" : "bg-ember/15 text-ember",
        )}
      >
        <MapPin aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight">{primary}</span>
        <span className={cn("block truncate text-xs leading-tight", deliveryBroken ? "text-danger" : "text-smoke")}>
          {secondary}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gold">Change</span>
    </button>
  );
}

/** One-line delivery verdict for a specific branch card (Locations section / page). */
export function BranchDeliveryIndicator({ branch }: { branch: Branch }) {
  const { hydrated, evaluation } = useLocation();
  if (!hydrated) return <span aria-hidden className="block h-6 w-44 animate-pulse rounded-sm bg-paper/10" />;

  if (evaluation.status === "unverified") {
    return (
      <button
        type="button"
        onClick={() => ui.openLocation()}
        className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-gold underline-offset-4 hover:underline"
      >
        <MapPin aria-hidden className="size-4" /> Set your location to check delivery
      </button>
    );
  }

  const entry = distanceFor(evaluation, branch.id);
  if (!entry) return null;

  return entry.withinRadius ? (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <Badge tone="ok">Delivers to you</Badge>
      <span className="text-smoke">{formatDistance(entry.distanceKm, branch.deliveryRadiusKm)} from your location</span>
    </p>
  ) : (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <Badge tone="warn">Pickup only</Badge>
      <span className="text-smoke">
        {formatDistance(entry.distanceKm, branch.deliveryRadiusKm)} away · outside {branch.deliveryRadiusKm} km delivery
      </span>
    </p>
  );
}

/**
 * Persistent banner for things that changed under the customer's feet (delivery no longer
 * available, branch switched…). Stays until dismissed — never a silent change.
 */
export function LocationNotices() {
  const notices = useUi((s) => s.notices);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 px-3 md:top-[4.5rem] md:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-2" role="region" aria-label="Order updates">
        <AnimatePresence initial={false}>
          {notices.map((notice) => (
            <m.div
              key={notice.id}
              layout
              role={notice.tone === "warning" ? "alert" : "status"}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-sm border p-3 pr-2 shadow-lift sm:p-4 sm:pr-3",
                notice.tone === "warning" ? "border-gold bg-coal text-paper" : "border-paper/20 bg-coal text-paper",
              )}
            >
              {notice.tone === "warning" ? (
                <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
              ) : (
                <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-ember" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{notice.title}</p>
                <p className="mt-1 text-sm leading-snug text-smoke">{notice.message}</p>
                {notice.action && (
                  <button
                    type="button"
                    onClick={() => {
                      ui.dismissNotice(notice.id);
                      ui.openLocation(notice.action === "choose-branch" ? { view: "branches" } : {});
                    }}
                    className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-gold underline underline-offset-4"
                  >
                    {notice.action === "choose-branch" ? "Choose a branch" : "Change location"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => ui.dismissNotice(notice.id)}
                aria-label={`Dismiss: ${notice.title}`}
                className="grid size-10 shrink-0 place-items-center rounded-sm text-smoke hover:bg-paper/10 hover:text-paper"
              >
                <X aria-hidden className="size-5" />
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
