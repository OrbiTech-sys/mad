"use client";

import { Crosshair, Loader2, MapPin, Search, ShoppingBag } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { GeocodeError, searchAddress, type GeocodeHit } from "@/lib/geocode";
import { branchCoordinates, isDeliverableBranch, type Branch, type Coordinates } from "@/types/branch";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Input";
import { LazyLocationMap } from "./LocationMapLazy";

export interface AddressDraft {
  coords: Coordinates;
  address: string;
}

/**
 * Manual fallback for customers who can't or won't share GPS.
 *
 * A typed address is NOT treated as validated. The customer must place (or accept) a pin on
 * the map; only that pin is used for the delivery check. Search suggestions come from a free
 * OpenStreetMap service and are only a shortcut to position the pin.
 */
export function AddressStep({
  branches,
  initialAddress,
  onConfirm,
  onUseGps,
  onPickup,
}: {
  branches: Branch[];
  initialAddress: string;
  onConfirm: (draft: AddressDraft) => void;
  onUseGps: () => void;
  onPickup: () => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState(initialAddress);
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [pin, setPin] = useState<Coordinates | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 3) {
      setSearchNote("Type a little more of your address first (area, street or landmark).");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setSearchNote(null);
    setHits([]);
    try {
      const bias = branches.filter(isDeliverableBranch).map(branchCoordinates);
      const found = await searchAddress(query, bias, controller.signal);
      setHits(found);
      if (found.length === 0) {
        setSearchNote("We couldn't find that on the map. Tap the map to drop a pin at your spot instead.");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setSearchNote(
        error instanceof GeocodeError
          ? `${error.message} Tap the map to drop a pin instead.`
          : "Address search isn't available. Tap the map to drop a pin instead.",
      );
    } finally {
      if (abortRef.current === controller) setSearching(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="display-md">Enter your delivery address</h2>
        <p className="mt-2 text-sm text-smoke">
          We don&apos;t verify typed addresses. Search to jump the map to your area, then place the pin exactly where
          your order should arrive — the pin is what we use to check delivery.
        </p>
      </div>

      <form onSubmit={onSearch} role="search" className="grid gap-3">
        <Field id={inputId} label="Address, area or landmark" hint="e.g. Johar Town Block D2, or Gulberg Main Market">
          <div className="flex gap-2">
            <Input
              id={inputId}
              name="address"
              autoComplete="street-address"
              inputMode="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="House, street, area…"
              aria-describedby={`${inputId}-hint`}
            />
            <Button type="submit" variant="outline" size="md" loading={searching} aria-label="Find on map">
              {!searching && <Search aria-hidden className="size-5" />}
              <span className="hidden sm:inline">Find</span>
            </Button>
          </div>
        </Field>

        <div aria-live="polite" className="grid gap-2">
          {searchNote && <p className="text-sm text-gold">{searchNote}</p>}
          {hits.length > 0 && (
            <ul className="grid gap-1.5" aria-label="Address suggestions">
              {hits.map((hit) => (
                <li key={`${hit.coords.lat},${hit.coords.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPin(hit.coords);
                      setHits([]);
                      setSearchNote(null);
                    }}
                    className="flex min-h-12 w-full items-start gap-2 rounded-sm border border-paper/15 p-3 text-left text-sm transition-colors hover:border-ember"
                  >
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" />
                    <span className="line-clamp-2">{hit.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      <LazyLocationMap
        branches={branches}
        customer={pin}
        onPick={setPin}
        ariaLabel="Map: tap to place your delivery pin"
        className="h-72 rounded-sm sm:h-80"
      />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Button
          size="lg"
          disabled={!pin}
          onClick={() => pin && onConfirm({ coords: pin, address: query.trim() })}
        >
          <MapPin aria-hidden className="size-5" />
          {pin ? "Check delivery for this pin" : "Place a pin to continue"}
        </Button>
        {!pin && (
          <p className="self-center text-sm text-smoke sm:col-span-2">
            No pin, no delivery check — we won&apos;t guess. You can always choose pickup instead.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-paper/10 pt-4 text-sm">
        <button
          type="button"
          onClick={onUseGps}
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-gold underline-offset-4 hover:underline"
        >
          <Crosshair aria-hidden className="size-4" /> Use my current location instead
        </button>
        <button
          type="button"
          onClick={onPickup}
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-gold underline-offset-4 hover:underline"
        >
          <ShoppingBag aria-hidden className="size-4" /> Pick up instead
        </button>
      </div>
      {searching && (
        <p className="sr-only" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" /> Searching…
        </p>
      )}
    </div>
  );
}
