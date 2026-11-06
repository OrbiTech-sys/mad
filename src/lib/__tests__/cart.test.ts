import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import type { CartLine } from "@/types/order";
import {
  addLine,
  clampQuantity,
  computeTotals,
  itemCount,
  lineFromProduct,
  lineTotal,
  MAX_LINE_QUANTITY,
  removeLine,
  setLineQuantity,
  subtotal,
} from "../cart";
import { formatCurrency } from "../formatCurrency";

const line = (id: string, unitPrice: number, quantity = 1): CartLine => ({
  id,
  kind: "product",
  refId: id,
  name: id,
  image: "/x.jpg",
  imageAlt: "x",
  unitPrice,
  quantity,
  demoPrice: true,
});

describe("cart lines", () => {
  it("adds a new line and merges repeats", () => {
    let lines = addLine([], line("a", 700));
    lines = addLine(lines, line("a", 700), 2);
    lines = addLine(lines, line("b", 600));
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.id === "a")?.quantity).toBe(3);
  });

  it("clamps quantities between 1 and the max", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-4)).toBe(1);
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(999)).toBe(MAX_LINE_QUANTITY);
    expect(clampQuantity(NaN)).toBe(1);
    const lines = addLine([line("a", 1, MAX_LINE_QUANTITY)], line("a", 1), 5);
    expect(lines[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("sets absolute quantities and removes a line when it drops below 1", () => {
    const lines = [line("a", 700, 2), line("b", 600, 1)];
    expect(setLineQuantity(lines, "a", 5).find((l) => l.id === "a")?.quantity).toBe(5);
    expect(setLineQuantity(lines, "a", 0).map((l) => l.id)).toEqual(["b"]);
    expect(removeLine(lines, "b").map((l) => l.id)).toEqual(["a"]);
  });

  it("does not mutate its input", () => {
    const lines = [line("a", 700, 2)];
    const snapshot = JSON.stringify(lines);
    addLine(lines, line("a", 700));
    setLineQuantity(lines, "a", 9);
    removeLine(lines, "a");
    expect(JSON.stringify(lines)).toBe(snapshot);
  });
});

describe("totals", () => {
  const lines = [line("a", 700, 2), line("b", 1200, 1), line("c", 600, 3)];

  it("computes line totals, item count and subtotal exactly", () => {
    expect(lineTotal(lines[0])).toBe(1400);
    expect(itemCount(lines)).toBe(6);
    expect(subtotal(lines)).toBe(1400 + 1200 + 1800);
  });

  it("invents no fees: total equals subtotal when nothing is configured", () => {
    const t = computeTotals(lines, "delivery", { deliveryFee: null, taxRate: null, minimumOrder: null });
    expect(t.subtotal).toBe(4400);
    expect(t.total).toBe(4400);
    expect(t.deliveryFee).toBeNull();
    expect(t.tax).toBeNull();
    expect(t.feesConfigured).toBe(false);
    expect(t.belowMinimum).toBe(false);
  });

  it("applies a configured delivery fee to delivery only", () => {
    const fees = { deliveryFee: 150, taxRate: null, minimumOrder: null };
    expect(computeTotals(lines, "delivery", fees).total).toBe(4550);
    expect(computeTotals(lines, "pickup", fees).total).toBe(4400);
    expect(computeTotals(lines, null, fees).total).toBe(4400);
  });

  it("applies tax and flags a minimum order when configured", () => {
    const t = computeTotals(lines, "pickup", { deliveryFee: null, taxRate: 0.1, minimumOrder: 5000 });
    expect(t.tax).toBe(440);
    expect(t.total).toBe(4840);
    expect(t.belowMinimum).toBe(true);
  });

  it("is zero for an empty cart", () => {
    expect(computeTotals([], "pickup").total).toBe(0);
  });
});

describe("products → cart lines", () => {
  it("builds a line from a priced, available product", () => {
    const burger = PRODUCTS.find((p) => p.id === "mighty-burger")!;
    const l = lineFromProduct(burger)!;
    expect(l.id).toBe("product:mighty-burger");
    expect(l.unitPrice).toBe(burger.price);
    expect(l.demoPrice).toBe(true);
  });

  it("refuses products with no price or that are unavailable", () => {
    const base = PRODUCTS[0];
    expect(lineFromProduct({ ...base, price: null })).toBeNull();
    expect(lineFromProduct({ ...base, available: false })).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("groups thousands and prefixes Rs.", () => {
    expect(formatCurrency(0)).toBe("Rs. 0");
    expect(formatCurrency(999)).toBe("Rs. 999");
    expect(formatCurrency(1000)).toBe("Rs. 1,000");
    expect(formatCurrency(1234567)).toBe("Rs. 1,234,567");
  });
});
