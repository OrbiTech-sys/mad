import Link from "next/link";
import type { Branch } from "@/types/branch";
import { BranchesExplorer } from "../location/BranchesExplorer";
import { Reveal } from "../ui/Reveal";

/** Home: branch discovery. Delivery verdicts per branch update as soon as a location is set. */
export function Locations({ branches }: { branches: Branch[] }) {
  return (
    <section id="locations" aria-labelledby="locations-title" className="bg-coal py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 id="locations-title" className="display-xl lg:col-span-7">
            Find your <span className="text-gold">nearest MAD</span>
          </h2>
          <div className="lg:col-span-4 lg:col-start-9">
            <p className="text-lg text-smoke">
              {branches.length} branches across Lahore. We deliver within {branches[0]?.deliveryRadiusKm ?? 5} km of
              each one — set your location to see which one is yours.
            </p>
            <Link
              href="/locations"
              className="mt-3 inline-flex min-h-11 items-center font-display text-2xl uppercase tracking-wide text-gold underline decoration-ember decoration-2 underline-offset-[6px]"
            >
              All locations &amp; contact →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 md:mt-14">
          <BranchesExplorer branches={branches} />
        </div>
      </div>
    </section>
  );
}
