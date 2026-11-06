import { SITE } from "@/data/site";
import type { CartLine, OrderTotals } from "@/types/order";
import type { Product, ResolvedDeal } from "@/types/product";
import { dealPrice, productPrice } from "./pricing";

export const MAX_LINE_QUANTITY = 20;

export const clampQuantity = (n: number): number =>
  Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(Number.isFinite(n) ? n : 1)));

/** Cart line for a product, or null when the product can't currently be ordered. */
export function lineFromProduct(product: Product): CartLine | null {
  const price = productPrice(product);
  if (price === null || !product.available) return null;
  return {
    id: `product:${product.id}`,
    kind: "product",
    refId: product.id,
    name: product.name,
    image: product.image.src,
    imageAlt: product.image.alt,
    unitPrice: price,
    quantity: 1,
    demoPrice: product.priceStatus === "demo",
  };
}

export function lineFromDeal(deal: ResolvedDeal): CartLine | null {
  const price = dealPrice(deal);
  if (price === null) return null;
  return {
    id: `deal:${deal.id}`,
    kind: "deal",
    refId: deal.id,
    name: `${deal.name} (deal)`,
    image: deal.image.src,
    imageAlt: deal.image.alt,
    unitPrice: price,
    quantity: 1,
    demoPrice: deal.priceStatus === "demo" || deal.items.some((i) => i.product.priceStatus === "demo"),
  };
}

export function addLine(lines: CartLine[], line: CartLine, quantity = 1): CartLine[] {
  const existing = lines.find((l) => l.id === line.id);
  if (existing) {
    return lines.map((l) =>
      l.id === line.id ? { ...l, quantity: clampQuantity(l.quantity + quantity) } : l,
    );
  }
  return [...lines, { ...line, quantity: clampQuantity(quantity) }];
}

/** Sets an absolute quantity; a quantity below 1 removes the line. */
export function setLineQuantity(lines: CartLine[], id: string, quantity: number): CartLine[] {
  if (quantity < 1) return removeLine(lines, id);
  return lines.map((l) => (l.id === id ? { ...l, quantity: clampQuantity(quantity) } : l));
}

export const removeLine = (lines: CartLine[], id: string): CartLine[] =>
  lines.filter((l) => l.id !== id);

export const lineTotal = (line: CartLine): number => line.unitPrice * line.quantity;

export const itemCount = (lines: CartLine[]): number =>
  lines.reduce((sum, l) => sum + l.quantity, 0);

export const subtotal = (lines: CartLine[]): number =>
  lines.reduce((sum, l) => sum + lineTotal(l), 0);

export interface FeeConfig {
  deliveryFee: number | null;
  taxRate: number | null;
  minimumOrder: number | null;
}

/**
 * Totals. Fees are only applied when configured in data/site.ts — nothing is invented.
 * The delivery fee applies to delivery orders only.
 */
export function computeTotals(
  lines: CartLine[],
  method: "delivery" | "pickup" | null,
  fees: FeeConfig = SITE.fees,
): OrderTotals {
  const sub = subtotal(lines);
  const deliveryFee = method === "delivery" ? fees.deliveryFee : null;
  const tax = fees.taxRate !== null ? Math.round(sub * fees.taxRate) : null;
  const total = sub + (deliveryFee ?? 0) + (tax ?? 0);
  const feesConfigured =
    fees.deliveryFee !== null || fees.taxRate !== null || fees.minimumOrder !== null;

  return {
    subtotal: sub,
    deliveryFee,
    tax,
    total,
    feesConfigured,
    minimumOrder: fees.minimumOrder,
    belowMinimum: fees.minimumOrder !== null && sub > 0 && sub < fees.minimumOrder,
  };
}
