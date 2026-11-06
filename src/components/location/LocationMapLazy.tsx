"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { LocationMapProps } from "./LocationMap";

function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("skeleton relative grid place-items-center overflow-hidden bg-coal text-sm text-smoke", className)}
    >
      Loading map…
    </div>
  );
}

// Leaflet touches `window`, so it is client-only and code-split out of the main bundle.
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <MapSkeleton className="absolute inset-0" />,
});

/** The map, mounted lazily: only once its container is near the viewport. */
export function LazyLocationMap(props: LocationMapProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = holder.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={holder} className={cn("relative", props.className)}>
      {near ? <LocationMap {...props} className="size-full" /> : <MapSkeleton className="absolute inset-0" />}
    </div>
  );
}

export { LocationMap, MapSkeleton };
