import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { Footer } from "@/components/layout/Footer";
import { SITE } from "@/data/site";
import { getBranches } from "@/lib/repository";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "MAD — Mighty & Delicious | Burgers, Wraps & Pizza in Lahore",
    template: "%s | MAD — Mighty & Delicious",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["MAD Mighty & Delicious", "fast food Lahore", "burgers Lahore", "wraps", "pizza", "loaded fries"],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    title: "MAD — Mighty & Delicious",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "MAD — Mighty & Delicious",
    description: SITE.description,
  },
  // A proof of concept with demo content must not be indexed. Flip SITE.poc.indexable at launch.
  robots: SITE.poc.indexable ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171615",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const branches = await getBranches();

  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-gold focus:px-4 focus:py-3 focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <AppProviders branches={branches}>
          {/* pb-24: room for the sticky mobile order bar */}
          <div className="flex min-h-dvh flex-col pb-24 md:pb-0">
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
