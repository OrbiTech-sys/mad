"use client";

import { AnimatePresence, m } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Crosshair,
  Loader2,
  LocateOff,
  MapPin,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBranches, useLocation } from "@/hooks/useOrder";
import { ui, useUi, type LocationIntent } from "@/hooks/useUi";
import { SITE } from "@/data/site";
import { distanceFor, evaluateDelivery } from "@/lib/delivery";
import { formatDistance } from "@/lib/distance";
import {
  getGeolocationPermission,
  requestCurrentPosition,
  type GeoFailure,
  type GeoPermission,
} from "@/lib/geolocation";
import { cn } from "@/lib/cn";
import type { ChoiceInput } from "@/lib/orderState";
import type { Coordinates } from "@/types/branch";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { AddressStep } from "./AddressStep";
import { BranchSelector } from "./BranchSelector";
import { DemoLocations } from "./DemoLocations";
import { ResultStep, type LocationDraft } from "./ResultStep";

type View = "choose" | "detecting" | "address" | "branches" | "result";

/** Mounted once in AppProviders. Open it with ui.openLocation(). */
export function LocationModal() {
  const open = useUi((s) => s.locationOpen);
  const intent = useUi((s) => s.locationIntent);

  return (
    <Modal open={open} onClose={ui.closeLocation} label="Choose delivery or pickup" size="lg">
      <LocationFlow intent={intent} />
    </Modal>
  );
}

function LocationFlow({ intent }: { intent: LocationIntent }) {
  const router = useRouter();
  const branches = useBranches();
  const { context, fulfilment, confirmChoice } = useLocation();

  const [view, setView] = useState<View>(intent.view === "branches" ? "branches" : "choose");
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [preferred, setPreferred] = useState<string | null>(intent.preferredBranchId ?? null);
  const [hint, setHint] = useState<string | null>(null);
  const [geo, setGeo] = useState<
    | { status: "loading" }
    | { status: "error"; failure: GeoFailure; message: string; permission: GeoPermission }
    | null
  >(null);
  const requestId = useRef(0);

  const branchMode = intent.view === "branches" ? "any" : "pickup";

  /* ------------------------------------------------------------ actions -- */

  /** Commits a choice. Returns an error message, or null on success. */
  function finish(choice: ChoiceInput): string | null {
    const result = confirmChoice(choice);
    if (!result.ok) return result.error;

    const branch = branches.find((b) => b.id === choice.branchId);
    // Use the committed coordinates (not the stale hook value) for the confirmation toast.
    const entry = distanceFor(evaluateDelivery(result.context.coords, branches), choice.branchId);

    ui.closeLocation();
    const wasDelivery = context.method === "delivery";
    if (wasDelivery && choice.method === "pickup" && choice.location) {
      ui.toast("Delivery isn't available at your new location — your order is now set to pickup.", { tone: "warning", ms: 6000 });
    } else {
      ui.toast(
        choice.method === "delivery"
          ? `Delivering from ${branch?.displayName ?? "your branch"}${entry ? ` · ${formatDistance(entry.distanceKm, entry.branch.deliveryRadiusKm)} away` : ""}`
          : `Pickup at ${branch?.displayName ?? "your branch"}`,
      );
    }
    if (intent.afterComplete === "menu") router.push("/menu");
    if (intent.afterComplete === "checkout") router.push("/checkout");
    return null;
  }

  async function startGps() {
    const id = ++requestId.current;
    setHint(null);
    setGeo({ status: "loading" });
    setView("detecting");

    const result = await requestCurrentPosition();
    if (id !== requestId.current) return; // cancelled while waiting for the browser prompt

    if (result.ok) {
      setDraft({ coords: result.coords, source: "gps", accuracyM: result.accuracyM, address: context.address });
      setGeo(null);
      setView("result");
      return;
    }
    const permission = await getGeolocationPermission();
    if (id !== requestId.current) return;
    setGeo({ status: "error", failure: result.reason, message: result.message, permission });
  }

  function cancelGps() {
    requestId.current += 1;
    setGeo(null);
    setView("choose");
  }

  function pickDemo(coords: Coordinates) {
    setDraft({ coords, source: "demo", accuracyM: null, address: context.address });
    setView("result");
  }

  function goBack() {
    requestId.current += 1;
    setGeo(null);
    setView("choose");
  }

  /* -------------------------------------------------------------- views -- */

  const closeAndContinue = () => {
    ui.closeLocation();
    if (intent.afterComplete === "menu") router.push("/menu");
    if (intent.afterComplete === "checkout") router.push("/checkout");
  };

  let body: ReactNode;

  if (view === "detecting") {
    body = (
      <GpsStep
        geo={geo}
        onCancel={cancelGps}
        onRetry={startGps}
        onAddress={() => setView("address")}
        onPickup={() => setView("branches")}
      />
    );
  } else if (view === "address") {
    body = (
      <AddressStep
        branches={branches}
        initialAddress={context.address}
        onConfirm={({ coords, address }) => {
          setDraft({ coords, source: "map-pin", accuracyM: null, address });
          setView("result");
        }}
        onUseGps={startGps}
        onPickup={() => setView("branches")}
      />
    );
  } else if (view === "branches") {
    body = (
      <BranchPicker
        mode={branchMode}
        initial={preferred}
        onPickup={(branchId) => finish({ method: "pickup", branchId })}
        onDeliver={(branchId) => {
          if (context.coords) return finish({ method: "delivery", branchId });
          setPreferred(branchId);
          const name = branches.find((b) => b.id === branchId)?.displayName ?? "that branch";
          setHint(`To deliver from ${name} we need to know where you are. Share your location or drop a pin.`);
          setView("choose");
          return null;
        }}
        hasLocation={Boolean(context.coords)}
      />
    );
  } else if (view === "result" && draft) {
    body = (
      <ResultStep
        draft={draft}
        branches={branches}
        preferredBranchId={preferred}
        onMovePin={(coords) => setDraft({ ...draft, coords, source: "map-pin", accuracyM: null })}
        onConfirm={({ method, branchId }) =>
          finish({
            method,
            branchId,
            location: { coords: draft.coords, source: draft.source, accuracyM: draft.accuracyM, address: draft.address },
          })
        }
        onChangeLocation={goBack}
      />
    );
  } else {
    body = (
      <ChooseStep
        branchCount={branches.length}
        hint={hint}
        currentSummary={
          fulfilment.ok
            ? fulfilment.method === "delivery"
              ? `Delivery from ${fulfilment.branch.displayName} · ${formatDistance(fulfilment.distanceKm, fulfilment.branch.deliveryRadiusKm)} away`
              : `Pickup at ${fulfilment.branch.displayName}`
            : null
        }
        onKeep={closeAndContinue}
        onGps={startGps}
        onAddress={() => setView("address")}
        onPickup={() => setView("branches")}
        onChooseBranch={() => setView("branches")}
        demo={
          SITE.poc.showDemoTools ? (
            <DemoLocations branches={branches} onSelect={(scenario) => pickDemo(scenario.coords)} />
          ) : null
        }
      />
    );
  }

  return (
    <div className="p-5 pt-6 sm:p-8">
      {view !== "choose" && (
        <button
          type="button"
          onClick={goBack}
          className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-semibold text-smoke transition-colors hover:text-paper"
        >
          <ArrowLeft aria-hidden className="size-4" /> All options
        </button>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <ViewShell key={view}>{body}</ViewShell>
      </AnimatePresence>
    </div>
  );
}

/** Animated container that also moves focus to the new step, so keyboard / SR users aren't stranded. */
function ViewShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <m.div
      ref={ref}
      tabIndex={-1}
      className="outline-none"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

/* ================================================================ steps === */

function ChooseStep({
  branchCount,
  hint,
  currentSummary,
  onKeep,
  onGps,
  onAddress,
  onPickup,
  onChooseBranch,
  demo,
}: {
  branchCount: number;
  hint: string | null;
  currentSummary: string | null;
  onKeep: () => void;
  onGps: () => void;
  onAddress: () => void;
  onPickup: () => void;
  onChooseBranch: () => void;
  demo: ReactNode;
}) {
  return (
    <div className="grid gap-5">
      <div className="pr-10">
        <h2 className="display-lg">Where should we bring the MAD?</h2>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-smoke">
          We deliver within <strong className="font-semibold text-paper">{SITE.delivery.defaultRadiusKm} km</strong> of
          each of our {branchCount} Lahore branches (measured in a straight line). Further out? You can always pick up
          from any branch.
        </p>
      </div>

      {hint && (
        <p role="status" className="rounded-sm border border-gold/50 bg-gold/10 p-3 text-sm text-paper">
          {hint}
        </p>
      )}

      {currentSummary && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-leaf/40 bg-leaf/10 p-3">
          <p className="text-sm">
            <span className="block text-xs font-semibold uppercase tracking-wider text-leaf">Currently selected</span>
            <span className="font-semibold">{currentSummary}</span>
          </p>
          <Button size="sm" variant="outline" onClick={onKeep}>
            Keep this
          </Button>
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        <Option icon={Crosshair} title="Use my current location" text="Fastest — we'll check which branch delivers to you." onClick={onGps} primary />
        <Option icon={MapPin} title="Enter delivery address" text="Type it, then confirm your pin on the map." onClick={onAddress} />
        <Option icon={ShoppingBag} title="Select pickup" text="Collect from any branch. No location needed." onClick={onPickup} />
        <Option icon={Store} title="Choose a branch" text={`Browse our ${branchCount} Lahore branches.`} onClick={onChooseBranch} />
      </ul>

      {demo}
    </div>
  );
}

function Option({
  icon: Icon,
  title,
  text,
  onClick,
  primary,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex min-h-24 w-full items-start gap-3 rounded-sm border p-4 text-left transition-[border-color,background-color,transform] duration-150",
          "motion-safe:hover:-translate-y-0.5",
          primary ? "border-ember bg-ember/10 hover:bg-ember/15" : "border-paper/15 hover:border-paper/50",
        )}
      >
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full",
            primary ? "bg-ember text-ink" : "bg-paper/10 text-paper",
          )}
        >
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl uppercase leading-none tracking-wide">{title}</span>
          <span className="mt-1.5 block text-sm leading-snug text-smoke">{text}</span>
        </span>
        <ChevronRight aria-hidden className="mt-1 size-5 shrink-0 text-smoke transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
}

function GpsStep({
  geo,
  onCancel,
  onRetry,
  onAddress,
  onPickup,
}: {
  geo: { status: "loading" } | { status: "error"; failure: GeoFailure; message: string; permission: GeoPermission } | null;
  onCancel: () => void;
  onRetry: () => void;
  onAddress: () => void;
  onPickup: () => void;
}) {
  if (geo?.status === "error") {
    const retryable = geo.failure === "timeout" || geo.failure === "unavailable" || geo.failure === "invalid";
    return (
      <div className="grid gap-5" role="alert">
        <div className="flex items-start gap-3 pr-10">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
            <LocateOff aria-hidden className="size-6" />
          </span>
          <div>
            <h2 className="display-md">We couldn&apos;t find you</h2>
            <p className="mt-2 text-sm leading-relaxed text-smoke">{geo.message}</p>
            {geo.failure === "denied" && (
              <p className="mt-2 text-sm leading-relaxed text-smoke">
                To allow it: tap the lock icon beside the web address → Site settings → Location → Allow, then try
                again.
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {retryable && (
            <Button variant="outline" onClick={onRetry}>
              <Crosshair aria-hidden className="size-5" /> Try again
            </Button>
          )}
          <Button onClick={onAddress}>
            <MapPin aria-hidden className="size-5" /> Enter address / pin
          </Button>
          <Button variant="outline" onClick={onPickup}>
            <ShoppingBag aria-hidden className="size-5" /> Pick up instead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid place-items-center gap-5 py-8 text-center" role="status" aria-live="polite">
      <div className="relative grid size-20 place-items-center">
        <span aria-hidden className="absolute inset-0 rounded-full bg-ember/40 motion-safe:animate-[pulse-ring_1.6s_ease-out_infinite]" />
        <span className="relative grid size-16 place-items-center rounded-full bg-ember text-ink">
          <Loader2 aria-hidden className="size-7 animate-spin" />
        </span>
      </div>
      <div>
        <h2 className="display-md">Finding you…</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-smoke">
          Your browser will ask to share your location. Choose “Allow” and we&apos;ll check which branch delivers to you.
        </p>
      </div>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function BranchPicker({
  mode,
  initial,
  hasLocation,
  onPickup,
  onDeliver,
}: {
  mode: "pickup" | "any";
  initial: string | null;
  hasLocation: boolean;
  onPickup: (branchId: string) => string | null;
  onDeliver: (branchId: string) => string | null;
}) {
  const branches = useBranches();
  const { evaluation } = useLocation();
  const [selected, setSelected] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const branch = branches.find((b) => b.id === selected) ?? null;

  return (
    <div className="grid gap-5">
      <div className="pr-10">
        <h2 className="display-md">{mode === "pickup" ? "Pick up from…" : "Choose your branch"}</h2>
        <p className="mt-2 text-sm text-smoke">
          {mode === "pickup"
            ? "Pickup is available at every branch, wherever you are."
            : "Pick a branch, then choose whether to collect or have it delivered."}
        </p>
      </div>

      <BranchSelector
        branches={branches}
        evaluation={evaluation.origin ? evaluation : null}
        method="pickup"
        value={selected}
        onChange={(id) => {
          setSelected(id);
          setError(null);
        }}
        legend="MAD branches"
      />

      {error && (
        <p role="alert" className="rounded-sm border border-danger/50 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className={cn("grid gap-2", mode === "any" && "sm:grid-cols-2")}>
        <Button
          size="lg"
          disabled={!branch}
          onClick={() => branch && setError(onPickup(branch.id))}
        >
          <ShoppingBag aria-hidden className="size-5" />
          {branch ? `Pick up from ${branch.name}` : "Select a branch"}
        </Button>
        {mode === "any" && (
          <Button
            size="lg"
            variant="outline"
            disabled={!branch}
            onClick={() => branch && setError(onDeliver(branch.id))}
          >
            {hasLocation ? "Deliver from here" : "Deliver — set location"}
          </Button>
        )}
      </div>
    </div>
  );
}
