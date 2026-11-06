import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions placeholder for the MAD proof of concept.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Terms & conditions">
        <p>Placeholder — MAD&apos;s final terms will be supplied before launch.</p>
      </PageHeader>
      <section className="bg-cream py-14 text-ink" data-surface="light">
        <div className="mx-auto grid max-w-3xl gap-5 px-4 text-lg leading-relaxed text-ash md:px-6">
          <h2 className="font-display text-4xl uppercase text-ink">About this demo</h2>
          <p>
            This website is a proof of concept. Menu items, prices, deals and photos are demonstration content and do
            not represent MAD&apos;s official offering. Placing a &ldquo;demo order&rdquo; does not create a real order,
            and nothing will be prepared or delivered.
          </p>
          <p>
            Delivery is shown as available when a location is within each branch&apos;s delivery radius, measured as
            straight-line distance. The final delivery policy, fees and minimum order will be confirmed by MAD.
          </p>
        </div>
      </section>
    </>
  );
}
