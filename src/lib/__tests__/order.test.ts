import { describe, expect, it } from "vitest";
import { BRANCHES } from "@/data/branches";
import type { CartLine } from "@/types/order";
import { computeTotals } from "../cart";
import { buildDemoOrder, generateOrderReference } from "../order";
import { destinationPoint } from "../distance";
import { EMPTY_CONTEXT, validateFulfilment } from "../orderState";
import { createStore } from "../storage";
import { demoOrderSchema, cartStateSchema, orderContextSchema } from "../validation";

const johar = BRANCHES[0];
const coords = { lat: johar.latitude!, lng: johar.longitude! };

const line: CartLine = {
  id: "product:mighty-burger",
  kind: "product",
  refId: "mighty-burger",
  name: "Mighty Burger",
  image: "/images/mighty-burger.jpg",
  imageAlt: "Mighty burger",
  unitPrice: 1000,
  quantity: 2,
  demoPrice: true,
};

describe("demo order reference", () => {
  it("is always prefixed MAD-DEMO- and uses an unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOrderReference()).toMatch(/^MAD-DEMO-[2-9A-HJKMNP-Z]{6}$/);
    }
  });

  it("is deterministic for a given byte source (testable)", () => {
    expect(generateOrderReference(() => new Uint8Array([0, 1, 2, 3, 4, 5]))).toBe("MAD-DEMO-234567");
  });
});

describe("buildDemoOrder", () => {
  const context = {
    ...EMPTY_CONTEXT,
    method: "delivery" as const,
    branchId: johar.id,
    coords: destinationPoint(coords, 90, 2),
    source: "gps" as const,
  };
  const check = validateFulfilment(context, BRANCHES);

  it("captures fulfilment, normalised phone, totals and a copy of the lines", () => {
    if (!check.ok) throw new Error("fixture should be valid");
    const order = buildDemoOrder({
      reference: "MAD-DEMO-ABC234",
      now: 1_700_000_000_000,
      fulfilment: check,
      customer: {
        fullName: "  Ayesha Khan ",
        phone: "+92 300 1234567",
        email: "",
        address: " House 12, Street 4, Johar Town ",
        instructions: "",
      },
      lines: [line],
      totals: computeTotals([line], "delivery"),
    });

    expect(order.method).toBe("delivery");
    expect(order.branch.id).toBe("johar-town");
    expect(order.distanceKm).toBeCloseTo(2, 1);
    expect(order.customer.fullName).toBe("Ayesha Khan");
    expect(order.customer.phone).toBe("03001234567");
    expect(order.customer.address).toBe("House 12, Street 4, Johar Town");
    expect(order.totals.total).toBe(2000);
    expect(order.lines).not.toBe([line]);
    // Survives the persistence schema, so a refresh keeps the confirmation.
    expect(demoOrderSchema.safeParse(JSON.parse(JSON.stringify(order))).success).toBe(true);
  });

  it("drops the address for pickup orders", () => {
    const pickup = validateFulfilment({ ...EMPTY_CONTEXT, method: "pickup", branchId: johar.id }, BRANCHES);
    if (!pickup.ok) throw new Error("fixture should be valid");
    const order = buildDemoOrder({
      reference: "MAD-DEMO-ABC234",
      fulfilment: pickup,
      customer: { fullName: "Ali", phone: "03001234567", email: "", address: "should not be kept", instructions: "" },
      lines: [line],
      totals: computeTotals([line], "pickup"),
    });
    expect(order.customer.address).toBe("");
    expect(order.method).toBe("pickup");
  });
});

describe("persisted-data schemas reject garbage", () => {
  it("cart", () => {
    expect(cartStateSchema.safeParse({ lines: [{ id: 1 }] }).success).toBe(false);
    expect(cartStateSchema.safeParse({ lines: [{ ...line, quantity: 0 }] }).success).toBe(false);
    expect(cartStateSchema.safeParse({ lines: [{ ...line, quantity: 999 }] }).success).toBe(false);
    expect(cartStateSchema.safeParse({ lines: [line] }).success).toBe(true);
  });

  it("order context", () => {
    expect(orderContextSchema.safeParse(EMPTY_CONTEXT).success).toBe(true);
    expect(orderContextSchema.safeParse({ ...EMPTY_CONTEXT, method: "teleport" }).success).toBe(false);
    expect(orderContextSchema.safeParse({ ...EMPTY_CONTEXT, coords: { lat: 999, lng: 0 } }).success).toBe(false);
  });
});

describe("createStore", () => {
  it("returns the initial state on the server snapshot and notifies subscribers on change", () => {
    const store = createStore({ n: 0 });
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.set({ n: 1 });
    store.set((s) => ({ n: s.n + 1 }));
    expect(store.getSnapshot().n).toBe(2);
    expect(store.getServerSnapshot().n).toBe(0);
    expect(calls).toBe(2);
    unsubscribe();
    store.set({ n: 3 });
    expect(calls).toBe(2);
  });

  it("does not notify when the value is unchanged (stable snapshots)", () => {
    const store = createStore({ n: 0 });
    let calls = 0;
    store.subscribe(() => calls++);
    store.set(store.getSnapshot());
    expect(calls).toBe(0);
  });
});
