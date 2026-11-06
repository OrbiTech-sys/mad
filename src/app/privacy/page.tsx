import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy placeholder for the MAD proof of concept.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy policy">
        <p>Placeholder — MAD&apos;s final policy will be supplied before launch.</p>
      </PageHeader>
      <section className="bg-cream py-14 text-ink" data-surface="light">
        <div className="mx-auto grid max-w-3xl gap-5 px-4 text-lg leading-relaxed text-ash md:px-6">
          <h2 className="font-display text-4xl uppercase text-ink">What this demo does today</h2>
          <p>
            This proof-of-concept site has no accounts and no server for orders. Your cart, chosen branch, and the
            location you share are saved only in <strong className="text-ink">your own browser</strong> (local storage)
            so they survive a refresh. Clearing site data removes them.
          </p>
          <p>
            If you use &ldquo;Use my current location&rdquo;, your browser sends your coordinates to this page only;
            they are used on your device to work out which branch is nearest. If you search for an address on the map, the
            text you type is sent to the free OpenStreetMap Nominatim service to find it, and map tiles are loaded from
            OpenStreetMap.
          </p>
          <p>Demo orders are never transmitted to MAD. No payments are processed.</p>
        </div>
      </section>
    </>
  );
}
