import { BRANCHES, getBranchConfigWarnings } from "@/data/branches";
import { CATEGORIES } from "@/data/categories";
import { DEALS } from "@/data/deals";
import { PRODUCTS } from "@/data/products";
import type { Branch } from "@/types/branch";
import type { Category, Product, ResolvedDeal } from "@/types/product";

/**
 * DATA ACCESS LAYER.
 *
 * The UI only ever talks to these async functions — never to the static arrays in /data.
 * When MAD moves to a database (Drizzle), replace the bodies below with queries and keep the
 * signatures. No component needs to change.
 */

export async function getProducts(): Promise<Product[]> {
  return [...PRODUCTS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getDeals(): Promise<ResolvedDeal[]> {
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  return [...DEALS]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((deal) => ({
      ...deal,
      items: deal.items.flatMap((item) => {
        const product = byId.get(item.productId);
        return product ? [{ product, quantity: item.quantity }] : [];
      }),
    }));
}

/** Categories that actually contain something. Empty candidates (sides, drinks…) stay hidden. */
export async function getCategories(): Promise<Category[]> {
  const used = new Set<string>(PRODUCTS.map((p) => p.categoryId));
  if (DEALS.length > 0) used.add("deals");
  return CATEGORIES.filter((c) => used.has(c.id)).sort((a, b) => a.order - b.order);
}

export async function getBranches(): Promise<Branch[]> {
  if (process.env.NODE_ENV !== "production") {
    for (const warning of getBranchConfigWarnings(BRANCHES)) console.warn(warning);
  }
  return BRANCHES.filter((b) => b.active);
}
