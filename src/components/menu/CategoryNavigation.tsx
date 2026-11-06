"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { Category, CategoryId } from "@/types/product";

export type CategoryFilter = CategoryId | "all";

export interface CategoryOption {
  category: Category;
  count: number;
}

/**
 * Horizontal category navigation.
 * - `chips`: compact pills (sticky bar on the menu page)
 * - `tiles`: photographic tiles (home page)
 * The active category is always highlighted and exposed with aria-pressed; the active item
 * scrolls into view so it never hides off-screen on a phone.
 */
export function CategoryNavigation({
  options,
  active,
  onSelect,
  totalCount,
  variant = "chips",
  className,
  controls,
}: {
  options: CategoryOption[];
  active: CategoryFilter;
  onSelect: (id: CategoryFilter) => void;
  totalCount: number;
  variant?: "chips" | "tiles";
  className?: string;
  /** id of the region this navigation controls */
  controls?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    // Scroll only the strip horizontally; never move the page.
    if (el && listRef.current) {
      const list = listRef.current;
      const target = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [active]);

  const all: CategoryOption[] = [
    { category: { id: "burgers", name: "All", order: 0 }, count: totalCount },
    ...options,
  ];

  return (
    <nav aria-label="Menu categories" className={className}>
      <ul
        ref={listRef}
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-proximity gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0",
          variant === "tiles" && "gap-3 pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible",
        )}
      >
        {all.map(({ category, count }, index) => {
          const id: CategoryFilter = index === 0 ? "all" : category.id;
          const selected = active === id;

          if (variant === "tiles") {
            return (
              <li key={id} className="snap-start">
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-controls={controls}
                  onClick={() => onSelect(id)}
                  className={cn(
                    "group relative block h-40 w-36 overflow-hidden rounded-sm text-left outline-offset-4 transition-[transform,box-shadow] duration-300 sm:h-48 sm:w-44 lg:w-full",
                    "motion-safe:hover:-translate-y-1",
                    selected ? "ring-4 ring-ember" : "ring-1 ring-ink/15",
                  )}
                >
                  {category.image && index > 0 ? (
                    <Image
                      src={category.image.src}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 16vw, 176px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      style={{ objectPosition: category.image.focus }}
                    />
                  ) : (
                    <span aria-hidden className="absolute inset-0 bg-ember" />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 transition-opacity duration-300",
                      index === 0 ? "opacity-0" : "bg-gradient-to-t from-ink via-ink/35 to-transparent",
                    )}
                  />
                  <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                    <span
                      className={cn(
                        "font-display text-2xl uppercase leading-[0.95] sm:text-3xl",
                        index === 0 ? "text-ink" : "text-paper",
                      )}
                    >
                      {category.name}
                    </span>
                    <span
                      className={cn(
                        "mb-0.5 rounded-sm px-1.5 py-0.5 text-xs font-bold tabular-nums",
                        selected ? "bg-ember text-ink" : "bg-paper/90 text-ink",
                      )}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              </li>
            );
          }

          return (
            <li key={id} className="snap-start">
              <button
                type="button"
                aria-pressed={selected}
                aria-controls={controls}
                onClick={() => onSelect(id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-sm border px-4 font-display text-xl uppercase tracking-[0.06em] transition-colors duration-150",
                  selected
                    ? "border-ember bg-ember text-ink"
                    : "border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-cream",
                )}
              >
                {category.name}
                <span className={cn("font-sans text-xs font-bold tabular-nums", selected ? "text-ink/70" : "text-ash")}>
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
