"use client";

import { FlaskConical } from "lucide-react";
import { useMemo } from "react";
import { buildDemoLocations, type DemoLocation } from "@/lib/demoLocations";
import type { Branch } from "@/types/branch";
import { Badge } from "../ui/Badge";

/**
 * Proof-of-concept helper: jump to a believable location without leaving your desk.
 * Every point is computed from the real branch coordinates (offsets / midpoints) and
 * self-checked against the delivery rule, so the labels are always true.
 */
export function DemoLocations({
  branches,
  onSelect,
}: {
  branches: Branch[];
  onSelect: (scenario: DemoLocation) => void;
}) {
  const scenarios = useMemo(() => buildDemoLocations(branches), [branches]);
  if (scenarios.length === 0) return null;

  return (
    <details className="group rounded-sm border border-dashed border-gold/50 bg-gold/5">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-gold [&::-webkit-details-marker]:hidden">
        <FlaskConical aria-hidden className="size-4" />
        POC test locations
        <span className="ml-auto text-xs font-normal text-smoke group-open:hidden">Demo from anywhere</span>
      </summary>
      <div className="border-t border-dashed border-gold/30 p-3">
        <p className="mb-3 text-sm text-smoke">
          Simulate being somewhere else to see each delivery outcome. Points are calculated from the real branch
          coordinates.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex min-h-14 w-full flex-col items-start gap-1 rounded-sm border border-paper/15 bg-ink/40 p-3 text-left transition-colors hover:border-gold"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-semibold leading-tight">{s.label}</span>
                  <Badge tone={s.expect === "eligible" ? "ok" : "warn"}>
                    {s.expect === "eligible" ? "Delivery" : "Pickup"}
                  </Badge>
                </span>
                <span className="text-xs leading-snug text-smoke">{s.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
