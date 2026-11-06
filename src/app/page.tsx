import { BrandStory } from "@/components/home/BrandStory";
import { Categories } from "@/components/home/Categories";
import { Deals } from "@/components/home/Deals";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { Locations } from "@/components/home/Locations";
import { Marquee } from "@/components/home/Marquee";
import { getBranches, getCategories, getDeals, getProducts } from "@/lib/repository";

export default async function HomePage() {
  const [products, deals, categories, branches] = await Promise.all([
    getProducts(),
    getDeals(),
    getCategories(),
    getBranches(),
  ]);

  const ticker = categories.map((c) => c.name);

  return (
    <>
      <Hero branchCount={branches.length} />
      <Marquee items={[...ticker, "Lahore"]} />
      <Categories products={products} deals={deals} categories={categories} />
      <FeaturedProducts products={products} />
      <Deals deals={deals} />
      <BrandStory branchCount={branches.length} />
      <Locations branches={branches} />
    </>
  );
}
