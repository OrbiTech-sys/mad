import { Phone } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { BranchesExplorer } from "@/components/location/BranchesExplorer";
import { SITE } from "@/data/site";
import { directionsUrl } from "@/lib/maps";
import { getBranches } from "@/lib/repository";
import { hasVerifiedCoordinates } from "@/types/branch";

export const metadata: Metadata = {
  title: "Locations & Delivery",
  description:
    "MAD has three branches in Lahore — Johar Town, Gulberg and Valencia. We deliver within 5 km of each branch; further away you can pick up.",
};

export default async function LocationsPage() {
  const branches = await getBranches();

  // Structured data only for what is verified: names, addresses, map pins and the phone numbers shown on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": branches.map((b) => ({
      "@type": "Restaurant",
      name: `MAD - Mighty & Delicious (${b.name})`,
      servesCuisine: ["Fast food", "Burgers", "Wraps", "Pizza"],
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address,
        addressLocality: SITE.city,
        addressCountry: SITE.country,
      },
      ...(hasVerifiedCoordinates(b)
        ? { geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude } }
        : {}),
      ...(b.phone ? { telephone: b.phone.tel } : {}),
      hasMap: directionsUrl(b),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so branch text can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <PageHeader title={<>Find your <span className="text-gold">MAD</span></>}>
        <p>
          {branches.length} branches across Lahore. We deliver within {SITE.delivery.defaultRadiusKm} km of each one —
          set your location and we&apos;ll show which branch is yours.
        </p>
      </PageHeader>

      <section className="bg-coal py-10 md:py-16" aria-label="Branches and map">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <BranchesExplorer branches={branches} tall interactive />
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-title" data-surface="light" className="bg-cream py-16 text-ink md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h2 id="contact-title" className="display-lg">
            Get in <span className="text-ember-deep">touch</span>
          </h2>
          <p className="mt-3 max-w-xl text-lg text-ash">
            Call the branch nearest you. Opening hours, email and social links will be added here once MAD confirms
            them.
          </p>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {branches.map((b) => (
              <li key={b.id} className="flex flex-col gap-4 rounded-sm border border-ink/15 bg-bone p-5 shadow-card">
                <div>
                  <h3 className="font-display text-4xl uppercase leading-none">{b.displayName}</h3>
                  <p className="mt-2 text-sm leading-snug text-ash">{b.address}</p>
                </div>
                <div className="mt-auto grid gap-2">
                  {b.phone && (
                    <a
                      href={`tel:${b.phone.tel}`}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-ink px-4 font-display text-2xl tracking-[0.06em] text-cream transition-colors hover:bg-ember hover:text-ink"
                    >
                      <Phone aria-hidden className="size-5" />
                      {b.phone.display}
                    </a>
                  )}
                  <a
                    href={directionsUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-sm border border-ink/40 px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-cream"
                  >
                    Directions<span className="sr-only"> to {b.displayName} (opens Google Maps)</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
