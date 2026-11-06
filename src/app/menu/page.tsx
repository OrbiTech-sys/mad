import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuPageExplorer, MenuStatic } from "@/components/menu/MenuExplorer";
import { Badge } from "@/components/ui/Badge";
import { getCategories, getDeals, getProducts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse the MAD menu: burgers, wraps, pizza, loaded fries and deals. Filter by category and add to your cart for delivery or pickup in Lahore.",
};

export default async function MenuPage() {
  const [products, deals, categories] = await Promise.all([getProducts(), getDeals(), getCategories()]);
  const data = { products, deals, categories };

  return (
    <>
      <PageHeader title={<>The <span className="text-ember">menu</span></>}>
        <p>Pick a category, tap a card for details, tap + to add to your cart.</p>
      </PageHeader>

      <section data-surface="light" className="bg-cream pb-20 pt-8 text-ink md:pb-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-sm border border-ink/15 bg-bone p-3 text-sm text-ash">
            <Badge tone="demo">Demo menu</Badge>
            <p className="min-w-[14rem] flex-1">
              Product names come from public listings. Prices are placeholders and descriptions, sizes and
              customisations will appear once MAD confirms them. Photos are representative.
            </p>
          </div>

          {/* useSearchParams (?category=) needs Suspense; the fallback is the full static menu. */}
          <Suspense fallback={<MenuStatic data={data} />}>
            <MenuPageExplorer data={data} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
