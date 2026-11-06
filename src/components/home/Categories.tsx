import Link from "next/link";
import type { Category, Product, ResolvedDeal } from "@/types/product";
import { HomeMenuExplorer } from "../menu/MenuExplorer";
import { Reveal } from "../ui/Reveal";

/**
 * Home: category navigation + the filtered product grid.
 * Choosing a tile filters the products below instantly; the full menu lives on /menu.
 */
export function Categories({
  products,
  deals,
  categories,
}: {
  products: Product[];
  deals: ResolvedDeal[];
  categories: Category[];
}) {
  return (
    <section id="menu" aria-labelledby="menu-title" data-surface="light" className="bg-cream py-16 text-ink md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="menu-title" className="display-xl lg:col-span-7">
            Pick your <span className="text-ember-deep">craving</span>
          </h2>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-lg leading-relaxed text-ash">
              Burgers, wraps, pizza and loaded fries. Tap a category to filter, tap a card for details, tap + to add.
            </p>
            <Link
              href="/menu"
              className="mt-3 inline-flex min-h-11 items-center font-display text-2xl uppercase tracking-wide text-ink underline decoration-ember decoration-2 underline-offset-[6px] transition-colors hover:text-ember-deep"
            >
              See the full menu →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 md:mt-14">
          <HomeMenuExplorer data={{ products, deals, categories }} />
        </div>
      </div>
    </section>
  );
}
