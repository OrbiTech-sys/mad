"use client";

import { AnimatePresence, m } from "framer-motion";
import type { ReactNode } from "react";
import type { Category, CategoryId, Product, ResolvedDeal } from "@/types/product";
import type { CategoryFilter } from "./CategoryNavigation";
import { MenuDealCard, ProductCard } from "./ProductCard";

/**
 * Filtered grid. Switching category cross-fades cards in place (opacity + scale only),
 * so the result is instant while still feeling smooth.
 */
export function ProductGrid({
  products,
  deals,
  categories,
  active,
  id,
  limit,
}: {
  products: Product[];
  deals: ResolvedDeal[];
  categories: Category[];
  active: CategoryFilter;
  id?: string;
  /** Cap the number of cards (home page teaser). */
  limit?: number;
}) {
  const byId = new Map<CategoryId, Category>(categories.map((c) => [c.id, c]));

  const shownProducts = active === "all" ? products : products.filter((p) => p.categoryId === active);
  const shownDeals = active === "all" || active === "deals" ? deals : [];

  const items: Array<{ key: string; node: ReactNode }> = [
    ...(active === "deals" ? [] : shownProducts).map((product, index) => ({
      key: `p-${product.id}`,
      node: <ProductCard product={product} category={byId.get(product.categoryId)} priority={index < 2} />,
    })),
    ...shownDeals.map((deal) => ({ key: `d-${deal.id}`, node: <MenuDealCard deal={deal} /> })),
  ].slice(0, limit);

  return (
    <div
      id={id}
      role="region"
      aria-label={`${active === "all" ? "All" : (byId.get(active)?.name ?? "Menu")} items`}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
    >
      {/* Concise announcement for screen readers when the filter changes (instead of re-reading every card). */}
      <p role="status" className="sr-only">
        Showing {items.length} {items.length === 1 ? "item" : "items"} in {active === "all" ? "the full menu" : (byId.get(active)?.name ?? "this category")}
      </p>
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map(({ key, node }) => (
          <m.div
            key={key}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            {node}
          </m.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && (
        <p className="col-span-full rounded-sm border border-dashed border-ink/30 p-8 text-center text-ash">
          Nothing in this category yet.
        </p>
      )}
    </div>
  );
}
