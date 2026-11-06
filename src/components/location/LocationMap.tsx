"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/maps";
import { cn } from "@/lib/cn";
import { isDeliverableBranch, branchCoordinates, type Branch, type Coordinates } from "@/types/branch";

export interface LocationMapProps {
  branches: Branch[];
  /** The customer's current position, if any. */
  customer?: Coordinates | null;
  accuracyM?: number | null;
  /** Provide to let the customer tap the map / drag the pin to set their location. */
  onPick?: (coords: Coordinates) => void;
  showRadius?: boolean;
  highlightBranchId?: string | null;
  className?: string;
  ariaLabel?: string;
  /** Overlay text shown when the map is interactive. */
  hint?: string;
}

const pinIcon = (label: string, modifier = "") =>
  L.divIcon({
    className: "",
    html: `<div class="mad-pin ${modifier}"><div class="mad-pin__body"><span class="mad-pin__label">${label}</span></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    tooltipAnchor: [0, -30],
  });

const ember = "#e65c25"; // brand --color-ember (Leaflet needs a literal colour string)
const gold = "#f3b64b"; // brand --color-gold

export default function LocationMap({
  branches,
  customer,
  accuracyM,
  onPick,
  showRadius = true,
  highlightBranchId,
  className,
  ariaLabel = "Map of MAD branches and delivery areas",
  hint = "Tap the map or drag the pin to set your exact spot",
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const branchLayer = useRef<L.LayerGroup | null>(null);
  const customerLayer = useRef<L.LayerGroup | null>(null);
  const onPickRef = useRef(onPick);
  const movedByUser = useRef(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  });

  const deliverable = branches.filter(isDeliverableBranch);

  /* 1 — create the map once */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: Boolean(onPickRef.current),
      // On touch devices a one-finger drag must scroll the page, not trap it in the map.
      dragging: Boolean(onPickRef.current) || !L.Browser.mobile,
      attributionControl: true,
    });

    let loaded = 0;
    let errors = 0;
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 })
      .on("tileload", () => {
        loaded += 1;
      })
      .on("tileerror", () => {
        errors += 1;
        if (loaded === 0 && errors >= 3) setTilesFailed(true);
      })
      .addTo(map);

    branchLayer.current = L.layerGroup().addTo(map);
    customerLayer.current = L.layerGroup().addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (!onPickRef.current) return;
      movedByUser.current = true;
      onPickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    const points = branches.filter(isDeliverableBranch).map((b) => branchCoordinates(b));
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), {
        padding: [48, 48],
        maxZoom: 12,
      });
    } else {
      map.setView([0, 0], 2);
    }

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      branchLayer.current = null;
      customerLayer.current = null;
    };
    // Created once. Branch data is applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 2 — branch pins + radius circles */
  useEffect(() => {
    const layer = branchLayer.current;
    if (!layer) return;
    layer.clearLayers();

    deliverable.forEach((branch, index) => {
      const center: L.LatLngTuple = [branch.latitude, branch.longitude];
      const highlighted = branch.id === highlightBranchId;

      if (showRadius) {
        L.circle(center, {
          radius: branch.deliveryRadiusKm * 1000,
          color: ember,
          weight: highlighted ? 2.5 : 1.5,
          dashArray: highlighted ? undefined : "6 6",
          fillColor: ember,
          fillOpacity: highlighted ? 0.16 : 0.07,
          interactive: false,
        }).addTo(layer);
      }

      L.marker(center, {
        icon: pinIcon(String(index + 1)),
        title: `${branch.displayName} — ${branch.address}`,
        alt: branch.displayName,
        keyboard: true,
        zIndexOffset: highlighted ? 500 : 0,
      })
        .bindTooltip(`${index + 1}. ${branch.displayName}`, { direction: "top", offset: [0, -4] })
        .addTo(layer);
    });
    // `deliverable` is derived from `branches` on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, showRadius, highlightBranchId]);

  /* 3 — customer pin (+ accuracy circle) */
  useEffect(() => {
    const map = mapRef.current;
    const layer = customerLayer.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!customer) return;

    const position: L.LatLngTuple = [customer.lat, customer.lng];

    if (accuracyM && accuracyM > 0) {
      L.circle(position, {
        radius: accuracyM,
        color: gold,
        weight: 1,
        fillColor: gold,
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(layer);
    }

    const marker = L.marker(position, {
      icon: pinIcon("YOU", "mad-pin--you"),
      draggable: Boolean(onPickRef.current),
      keyboard: false,
      title: "Your delivery location",
      zIndexOffset: 1000,
    }).addTo(layer);

    marker.on("dragend", () => {
      const next = marker.getLatLng();
      movedByUser.current = true;
      onPickRef.current?.({ lat: next.lat, lng: next.lng });
    });

    // Frame the customer with their nearest branch — unless the customer themself just moved the pin.
    if (movedByUser.current) {
      movedByUser.current = false;
      if (!map.getBounds().contains(position)) map.panTo(position);
      return;
    }
    const near = deliverable
      .map((b) => ({ b, d: map.distance(position, [b.latitude, b.longitude]) }))
      .sort((a, c) => a.d - c.d)[0];
    const bounds = L.latLngBounds([position]);
    if (near) bounds.extend([near.b.latitude, near.b.longitude]);
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.lat, customer?.lng, accuracyM]);

  return (
    <div className={cn("relative isolate overflow-hidden bg-coal", className)}>
      <div ref={containerRef} role="region" aria-label={ariaLabel} className="absolute inset-0" />
      {onPick && (
        <p className="pointer-events-none absolute bottom-7 left-3 z-[500] max-w-[70%] rounded-sm bg-ink/85 px-3 py-2 text-xs font-medium text-paper">
          {hint}
        </p>
      )}
      {tilesFailed && (
        <div
          role="status"
          className="absolute inset-0 z-[600] grid place-items-center bg-coal/90 p-6 text-center text-sm text-smoke"
        >
          <p>
            Map tiles couldn&apos;t load (are you offline?). Branch pins and radius still work — or choose pickup.
          </p>
        </div>
      )}
    </div>
  );
}
