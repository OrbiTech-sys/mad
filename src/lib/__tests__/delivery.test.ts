import { describe, expect, it } from "vitest";
import { BRANCHES } from "@/data/branches";
import type { Branch } from "@/types/branch";
import { evaluateDelivery } from "../delivery";
import { destinationPoint, haversineKm, midpoint } from "../distance";

const byId = (id: string) => BRANCHES.find((b) => b.id === id)!;
const coords = (b: Branch) => ({ lat: b.latitude!, lng: b.longitude! });

const johar = byId("johar-town");
const gulberg = byId("gulberg");
const valencia = byId("valencia");

describe("the real branch configuration", () => {
  it("has three active branches with verified coordinates and a 5 km radius", () => {
    expect(BRANCHES).toHaveLength(3);
    for (const b of BRANCHES) {
      expect(b.active).toBe(true);
      expect(b.deliveryRadiusKm).toBe(5);
      expect(b.latitude).not.toBeNull();
      expect(b.longitude).not.toBeNull();
      expect(b.verification.coordinates).toBe("google-maps-place-pin");
    }
  });
});

describe("evaluateDelivery — 5 km boundary", () => {
  // Isolate one branch so neighbours can't interfere with the boundary assertions.
  const only = [johar];

  it("delivers from a branch to its own doorstep", () => {
    const ev = evaluateDelivery(coords(johar), BRANCHES);
    expect(ev.status).toBe("eligible");
    expect(ev.nearestEligible?.branch.id).toBe("johar-town");
    expect(ev.nearestEligible?.distanceKm).toBeCloseTo(0, 6);
  });

  it("is eligible at 4.99 km", () => {
    const p = destinationPoint(coords(johar), 90, 4.99);
    const ev = evaluateDelivery(p, only);
    expect(ev.status).toBe("eligible");
    expect(ev.eligible[0].distanceKm).toBeCloseTo(4.99, 5);
  });

  it("is NOT eligible at 5.01 km", () => {
    const p = destinationPoint(coords(johar), 90, 5.01);
    const ev = evaluateDelivery(p, only);
    expect(ev.status).toBe("outside");
    expect(ev.eligible).toHaveLength(0);
    expect(ev.nearest?.branch.id).toBe("johar-town");
  });

  it("treats distance exactly equal to the radius as eligible (<=)", () => {
    const p = destinationPoint(coords(johar), 30, 5);
    const exact = { ...johar, deliveryRadiusKm: haversineKm(p, coords(johar)) };
    const ev = evaluateDelivery(p, [exact]);
    expect(ev.status).toBe("eligible");
  });

  it("respects a per-branch radius", () => {
    const p = destinationPoint(coords(johar), 0, 3);
    expect(evaluateDelivery(p, [{ ...johar, deliveryRadiusKm: 2 }]).status).toBe("outside");
    expect(evaluateDelivery(p, [{ ...johar, deliveryRadiusKm: 3.5 }]).status).toBe("eligible");
  });
});

describe("evaluateDelivery — multiple branches", () => {
  it("lists several eligible branches in an overlap zone, nearest first", () => {
    const p = midpoint(coords(johar), coords(valencia));
    const ev = evaluateDelivery(p, BRANCHES);
    expect(ev.status).toBe("eligible");
    expect(ev.eligible.map((e) => e.branch.id).sort()).toEqual(["johar-town", "valencia"]);
    expect(ev.eligible[0].distanceKm).toBeLessThanOrEqual(ev.eligible[1].distanceKm);
  });

  it("recommends the NEAREST eligible branch, not merely the first", () => {
    // Slightly towards Valencia from the midpoint.
    const mid = midpoint(coords(johar), coords(valencia));
    const p = destinationPoint(mid, 200, 1); // roughly towards Valencia (south-south-west)
    const ev = evaluateDelivery(p, BRANCHES);
    expect(ev.eligible.length).toBeGreaterThanOrEqual(2);
    expect(ev.nearestEligible?.branch.id).toBe("valencia");
  });

  it("offers pickup (outside) when beyond every radius, still reporting the nearest branch", () => {
    const p = destinationPoint(coords(gulberg), 0, 25);
    const ev = evaluateDelivery(p, BRANCHES);
    expect(ev.status).toBe("outside");
    expect(ev.nearestEligible).toBeNull();
    expect(ev.nearest).not.toBeNull();
    expect(ev.distances).toHaveLength(3);
  });
});

describe("evaluateDelivery — cannot verify", () => {
  it.each([
    ["null", null, "no-location"],
    ["undefined", undefined, "no-location"],
    ["NaN", { lat: NaN, lng: 74 }, "invalid-coordinates"],
    ["null island", { lat: 0, lng: 0 }, "invalid-coordinates"],
    ["out of range", { lat: 200, lng: 74 }, "invalid-coordinates"],
  ])("never claims delivery for %s", (_name, input, reason) => {
    const ev = evaluateDelivery(input as never, BRANCHES);
    expect(ev.status).toBe("unverified");
    expect(ev.reason).toBe(reason);
    expect(ev.eligible).toHaveLength(0);
  });

  it("ignores inactive branches and branches without verified coordinates", () => {
    const inactive = { ...johar, active: false };
    const unverified: Branch = {
      ...gulberg,
      latitude: null,
      longitude: null,
      verification: { ...gulberg.verification, coordinates: "unverified" },
    };
    const ev = evaluateDelivery(coords(johar), [inactive, unverified, valencia]);
    expect(ev.distances.map((d) => d.branch.id)).toEqual(["valencia"]);
  });

  it("is unverified when no branch has verified coordinates", () => {
    const unverified: Branch = {
      ...johar,
      latitude: null,
      longitude: null,
      verification: { ...johar.verification, coordinates: "unverified" },
    };
    const ev = evaluateDelivery(coords(johar), [unverified]);
    expect(ev.status).toBe("unverified");
    expect(ev.reason).toBe("no-verified-branches");
  });
});

describe("evaluateDelivery — GPS accuracy", () => {
  it("flags results whose verdict could flip within the accuracy circle", () => {
    const p = destinationPoint(coords(johar), 90, 4.9);
    expect(evaluateDelivery(p, [johar], { accuracyM: 500 }).nearBoundary).toBe(true);
    expect(evaluateDelivery(p, [johar], { accuracyM: 20 }).nearBoundary).toBe(false);
    expect(evaluateDelivery(p, [johar]).nearBoundary).toBe(false);
  });
});
