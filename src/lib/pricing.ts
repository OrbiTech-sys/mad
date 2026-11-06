import { SITE } from "@/data/site";
import type { Product, ResolvedDeal } from "@/types/product";

/**
 * The price the customer may see/pay, or null.
 * Demo prices are suppressed once `SITE.poc.showDemoPrices` is switched off, so unverified
 * numbers can never leak into a live menu.
 */
export function productPrice(product: Pick<Product, "price" | "priceStatus">): number | null {
  if (product.price === null) return null;
  if (product.priceStatus === "demo" && !SITE.poc.showDemoPrices) return null;
  return product.price;
}

/** Deal price: explicit when set, otherwise the plain sum of its items (no discount invented). */
export function dealPrice(deal: ResolvedDeal): number | null {
  if (deal.price !== null) {
    if (deal.priceStatus === "demo" && !SITE.poc.showDemoPrices) return null;
    return deal.price;
  }
  let sum = 0;
  for (const { product, quantity } of deal.items) {
    const price = productPrice(product);
    if (price === null || !product.available) return null;
    sum += price * quantity;
  }
  return sum;
}
