import { describe, expect, it } from "vitest";
import { BRANCHES } from "@/data/branches";
import type { OrderContext } from "@/types/order";
import { destinationPoint, midpoint } from "../distance";
import {
  applyCustomerLocation,
  commitChoice,
  EMPTY_CONTEXT,
  reconcileContext,
  validateFulfilment,
} from "../orderState";

const byId = (id: string) => BRANCHES.find((b) => b.id === id)!;
const at = (id: string) => ({ lat: byId(id).latitude!, lng: byId(id).longitude! });

const FAR = destinationPoint(at("gulberg"), 0, 25);
const NEAR_JOHAR = destinationPoint(at("johar-town"), 90, 1);
const NOW = 1_700_000_000_000;

const ctx = (patch: Partial<OrderContext>): OrderContext => ({ ...EMPTY_CONTEXT, ...patch });

describe("reconcileContext — never keeps an invalid delivery selection silently", () => {
  it("leaves a valid delivery context untouched", () => {
    const input = ctx({ method: "delivery", branchId: "johar-town", coords: NEAR_JOHAR, source: "gps" });
    const { context, notices } = reconcileContext(input, BRANCHES);
    expect(context).toEqual(input);
    expect(notices).toHaveLength(0);
  });

  it("switches delivery → pickup, keeps the branch, and notifies when the location is outside every radius", () => {
    const input = ctx({ method: "delivery", branchId: "johar-town", coords: FAR, source: "gps" });
    const { context, notices } = reconcileContext(input, BRANCHES);
    expect(context.method).toBe("pickup");
    expect(context.branchId).toBe("johar-town");
    expect(notices.map((n) => n.id)).toContain("delivery-unavailable");
    expect(notices[0].tone).toBe("warning");
  });

  it("moves delivery to the eligible branch (and says so) when the chosen branch no longer covers the customer", () => {
    const input = ctx({ method: "delivery", branchId: "gulberg", coords: NEAR_JOHAR });
    const { context, notices } = reconcileContext(input, BRANCHES);
    expect(context.method).toBe("delivery");
    expect(context.branchId).toBe("johar-town");
    expect(notices.map((n) => n.id)).toContain("branch-switched");
  });

  it("falls back to pickup when delivery is chosen but there are no coordinates", () => {
    const input = ctx({ method: "delivery", branchId: "johar-town", coords: null });
    const { context, notices } = reconcileContext(input, BRANCHES);
    expect(context.method).toBe("pickup");
    expect(notices.map((n) => n.id)).toContain("delivery-unverified");
  });

  it("drops a saved branch that no longer exists", () => {
    const input = ctx({ method: "pickup", branchId: "wapda-town-ghost" });
    const { context, notices } = reconcileContext(input, BRANCHES);
    expect(context.branchId).toBeNull();
    expect(context.method).toBeNull();
    expect(notices.length).toBeGreaterThan(0);
  });

  it("discards corrupt coordinates", () => {
    const input = ctx({ method: "pickup", branchId: "gulberg", coords: { lat: 999, lng: 0 } });
    expect(reconcileContext(input, BRANCHES).context.coords).toBeNull();
  });
});

describe("applyCustomerLocation — the customer changes location", () => {
  it("first-ever location inside a zone defaults to delivery from the nearest eligible branch", () => {
    const { context } = applyCustomerLocation(
      EMPTY_CONTEXT,
      { coords: NEAR_JOHAR, source: "gps", accuracyM: 30 },
      BRANCHES,
      NOW,
    );
    expect(context.method).toBe("delivery");
    expect(context.branchId).toBe("johar-town");
    expect(context.updatedAt).toBe(NOW);
  });

  it("first-ever location outside every zone defaults to pickup at the nearest branch", () => {
    const { context } = applyCustomerLocation(EMPTY_CONTEXT, { coords: FAR, source: "map-pin" }, BRANCHES, NOW);
    expect(context.method).toBe("pickup");
    expect(context.branchId).toBe("gulberg");
  });

  it("a delivery customer who moves out of range is switched to pickup WITH a notice", () => {
    const previous = ctx({ method: "delivery", branchId: "johar-town", coords: NEAR_JOHAR, source: "gps" });
    const { context, notices } = applyCustomerLocation(previous, { coords: FAR, source: "gps" }, BRANCHES, NOW);
    expect(context.method).toBe("pickup");
    expect(context.coords).toEqual(FAR);
    expect(notices.some((n) => n.id === "delivery-unavailable")).toBe(true);
  });

  it("a delivery customer who moves to another zone is re-assigned to that branch with a notice", () => {
    const previous = ctx({ method: "delivery", branchId: "johar-town", coords: NEAR_JOHAR });
    const nearValencia = destinationPoint(at("valencia"), 250, 1);
    const { context, notices } = applyCustomerLocation(previous, { coords: nearValencia, source: "gps" }, BRANCHES, NOW);
    expect(context.method).toBe("delivery");
    expect(context.branchId).toBe("valencia");
    expect(notices.map((n) => n.id)).toContain("branch-switched");
  });

  it("a pickup customer is told (not silently switched) when delivery becomes available", () => {
    const previous = ctx({ method: "pickup", branchId: "gulberg", coords: FAR });
    const { context, notices } = applyCustomerLocation(previous, { coords: NEAR_JOHAR, source: "gps" }, BRANCHES, NOW);
    expect(context.method).toBe("pickup");
    expect(notices.map((n) => n.id)).toContain("delivery-now-available");
  });

  it("rejects invalid coordinates without touching the saved context", () => {
    const previous = ctx({ method: "pickup", branchId: "gulberg" });
    const result = applyCustomerLocation(previous, { coords: { lat: NaN, lng: 1 }, source: "gps" }, BRANCHES, NOW);
    expect(result.context).toBe(previous);
    expect(result.notices[0].id).toBe("location-invalid");
  });
});

describe("commitChoice — explicit confirmation", () => {
  it("accepts delivery from a branch that covers the location", () => {
    const result = commitChoice(
      EMPTY_CONTEXT,
      { method: "delivery", branchId: "johar-town", location: { coords: NEAR_JOHAR, source: "gps" } },
      BRANCHES,
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("refuses delivery from a branch whose radius doesn't cover the location", () => {
    const result = commitChoice(
      EMPTY_CONTEXT,
      { method: "delivery", branchId: "gulberg", location: { coords: NEAR_JOHAR, source: "gps" } },
      BRANCHES,
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("refuses delivery with no location at all", () => {
    expect(commitChoice(EMPTY_CONTEXT, { method: "delivery", branchId: "johar-town" }, BRANCHES).ok).toBe(false);
  });

  it("always allows pickup at any active branch, even far away", () => {
    for (const b of BRANCHES) {
      const result = commitChoice(
        EMPTY_CONTEXT,
        { method: "pickup", branchId: b.id, location: { coords: FAR, source: "demo" } },
        BRANCHES,
        NOW,
      );
      expect(result.ok).toBe(true);
    }
  });

  it("refuses unknown branches", () => {
    expect(commitChoice(EMPTY_CONTEXT, { method: "pickup", branchId: "nope" }, BRANCHES).ok).toBe(false);
  });
});

describe("validateFulfilment — checked again before confirmation", () => {
  it("fails with no method / no branch", () => {
    expect(validateFulfilment(EMPTY_CONTEXT, BRANCHES)).toMatchObject({ ok: false, code: "no-method" });
    expect(validateFulfilment(ctx({ method: "pickup" }), BRANCHES)).toMatchObject({ ok: false, code: "no-branch" });
  });

  it("passes pickup without any location", () => {
    expect(validateFulfilment(ctx({ method: "pickup", branchId: "valencia" }), BRANCHES)).toMatchObject({
      ok: true,
      method: "pickup",
    });
  });

  it("passes delivery inside the radius and reports the distance", () => {
    const result = validateFulfilment(
      ctx({ method: "delivery", branchId: "johar-town", coords: NEAR_JOHAR }),
      BRANCHES,
    );
    expect(result).toMatchObject({ ok: true, method: "delivery" });
    if (result.ok && result.method === "delivery") expect(result.distanceKm).toBeCloseTo(1, 1);
  });

  it("fails delivery outside the radius — even if a stale context still says delivery", () => {
    const result = validateFulfilment(ctx({ method: "delivery", branchId: "johar-town", coords: FAR }), BRANCHES);
    expect(result).toMatchObject({ ok: false, code: "outside-radius" });
  });

  it("fails delivery without coordinates", () => {
    expect(validateFulfilment(ctx({ method: "delivery", branchId: "johar-town" }), BRANCHES)).toMatchObject({
      ok: false,
      code: "no-location",
    });
  });

  it("works for the overlap zone (either branch is valid)", () => {
    const p = midpoint(at("johar-town"), at("valencia"));
    for (const id of ["johar-town", "valencia"]) {
      expect(validateFulfilment(ctx({ method: "delivery", branchId: id, coords: p }), BRANCHES).ok).toBe(true);
    }
    expect(validateFulfilment(ctx({ method: "delivery", branchId: "gulberg", coords: p }), BRANCHES).ok).toBe(false);
  });
});
