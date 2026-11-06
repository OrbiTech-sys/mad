"use client";

import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Category, CategoryId, Product, ResolvedDeal } from "@/types/product";
import { CategoryNavigation, type CategoryFilter, type CategoryOption } from "./CategoryNavigation";
import { ProductGrid } from "./ProductGrid";

interface ExplorerData {
  products: Product[];
  deals: ResolvedDeal[];
  categories: Category[];
}

function buildOptions({ products, deals, categories }: ExplorerData): CategoryOption[] {
  return categories.map((category) => ({
    category,
    count: category.id === "deals" ? deals.length : products.filter((p) => p.categoryId === category.id).length,
  }));
}

/** Category navigation + filtered grid. Pure presentation: the active filter is passed in. */
export function MenuExplorer({
  data,
  active,
  onSelect,
  navVariant,
  limit,
  stickyNav,
}: {
  data: ExplorerData;
  active: CategoryFilter;
  onSelect: (id: CategoryFilter) => void;
  navVariant: "chips" | "tiles";
  limit?: number;
  stickyNav?: boolean;
}) {
  const options = useMemo(() => buildOptions(data), [data]);
  const total = data.products.length + data.deals.length;
  const gridId = useId();

  return (
    <div>
      <div
        className={cn(
          stickyNav &&
            "sticky top-16 z-30 -mx-4 border-b border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-cream/85 sm:mx-0 sm:px-0 md:top-[4.5rem]",
        )}
      >
        <CategoryNavigation
          options={options}
          active={active}
          onSelect={onSelect}
          totalCount={total}
          variant={navVariant}
          controls={gridId}
        />
      </div>
      <div className={cn(navVariant === "tiles" ? "mt-8" : "mt-6")}>
        <ProductGrid
          id={gridId}
          products={data.products}
          deals={data.deals}
          categories={data.categories}
          active={active}
          limit={limit}
        />
      </div>
    </div>
  );
}

/** Suspense fallback for the menu page: the complete, unfiltered menu. */
export function MenuStatic({ data }: { data: ExplorerData }) {
  return <MenuExplorer data={data} active="all" onSelect={() => {}} navVariant="chips" stickyNav />;
}

/** Home page: filtering is local state (no URL change). */
export function HomeMenuExplorer({ data }: { data: ExplorerData }) {
  const [active, setActive] = useState<CategoryFilter>("all");
  return (
    <MenuExplorer data={data} active={active} onSelect={setActive} navVariant="tiles" limit={active === "all" ? 8 : undefined} />
  );
}

const VALID = (data: ExplorerData, value: string | null): CategoryFilter => {
  if (!value) return "all";
  return data.categories.some((c) => c.id === (value as CategoryId)) ? (value as CategoryId) : "all";
};

/** Menu page: the active category lives in `?category=` so it is linkable and survives refresh. */
export function MenuPageExplorer({ data }: { data: ExplorerData }) {
  const params = useSearchParams();
  const active = VALID(data, params.get("category"));

  function select(id: CategoryFilter) {
    const url = new URL(window.location.href);
    if (id === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", id);
    // Next.js integrates native history calls with useSearchParams, so this updates instantly.
    window.history.replaceState(null, "", url);
  }

  return <MenuExplorer data={data} active={active} onSelect={select} navVariant="chips" stickyNav />;
}
