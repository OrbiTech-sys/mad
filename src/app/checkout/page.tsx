import type { Metadata } from "next";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout (demo)",
  description: "Demo checkout for the MAD proof of concept. No order is placed and no payment is taken.",
  robots: { index: false, follow: false },
};

export default function Checkout() {
  return (
    <div className="bg-ink pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <CheckoutPage />
      </div>
    </div>
  );
}
