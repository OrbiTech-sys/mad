import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/data/site";
import { directionsUrl } from "@/lib/maps";
import { getBranches, getCategories } from "@/lib/repository";
import { Logo } from "./Logo";
import { OrderNowButton } from "./OrderNowButton";

/**
 * Footer. Social links are deliberately absent: none have been supplied by MAD.
 * Phone numbers come from branches.ts and only render when a branch has one.
 */
export async function Footer() {
  const [branches, categories] = await Promise.all([getBranches(), getCategories()]);

  return (
    <footer className="relative overflow-hidden border-t border-paper/10 bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-6 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-xs text-smoke">
              Burgers, wraps, pizza and loaded fries. Delivery within {SITE.delivery.defaultRadiusKm} km of our
              {" "}
              {branches.length} Lahore branches — or collect from the one nearest you.
            </p>
            <div className="mt-6">
              <OrderNowButton size="md" arrow />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-[0.7fr_1.6fr_0.8fr]">
            <nav aria-label="Menu shortcuts">
              <h2 className="font-display text-2xl uppercase tracking-wide text-gold">Menu</h2>
              <ul className="mt-4 grid gap-1">
                <li>
                  <FooterLink href="/menu">Full menu</FooterLink>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <FooterLink href={`/menu?category=${c.id}`}>{c.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="font-display text-2xl uppercase tracking-wide text-gold">Branches</h2>
              <ul className="mt-4 grid gap-5">
                {branches.map((branch) => (
                  <li key={branch.id} className="text-sm">
                    <p className="font-semibold text-paper">{branch.displayName}</p>
                    <p className="mt-1 flex gap-2 leading-snug text-smoke">
                      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ember" />
                      {branch.address}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                      {branch.phone && (
                        <a
                          href={`tel:${branch.phone.tel}`}
                          className="inline-flex min-h-9 items-center gap-1.5 text-paper underline-offset-4 hover:underline"
                        >
                          <Phone aria-hidden className="size-4 text-ember" />
                          {branch.phone.display}
                        </a>
                      )}
                      <a
                        href={directionsUrl(branch)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center text-gold underline-offset-4 hover:underline"
                      >
                        Directions<span className="sr-only"> to {branch.displayName} (opens Google Maps)</span>
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <nav aria-label="Company">
              <h2 className="font-display text-2xl uppercase tracking-wide text-gold">MAD</h2>
              <ul className="mt-4 grid gap-1">
                <li>
                  <FooterLink href="/#story">Our story</FooterLink>
                </li>
                <li>
                  <FooterLink href="/#deals">Deals</FooterLink>
                </li>
                <li>
                  <FooterLink href="/locations">Locations</FooterLink>
                </li>
                <li>
                  <FooterLink href="/locations#contact">Contact</FooterLink>
                </li>
                <li>
                  <FooterLink href="/privacy">Privacy Policy</FooterLink>
                </li>
                <li>
                  <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <p
          aria-hidden
          className="mt-16 select-none whitespace-nowrap font-display text-[clamp(4.5rem,17.5vw,17rem)] leading-[0.78] tracking-[0.01em] text-paper/[0.06]"
        >
          MIGHTY &amp; DELICIOUS
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-paper/10 pt-6 text-sm text-smoke md:flex-row md:items-center md:justify-between">
          <p>© MAD — Mighty &amp; Delicious. Lahore, Pakistan.</p>
          <p className="max-w-xl md:text-right">
            Proof-of-concept website: menu, prices and deals are demo content and photos are representative stock
            images. No real orders are placed and no payments are taken.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center text-smoke underline-offset-4 transition-colors hover:text-paper hover:underline"
    >
      {children}
    </Link>
  );
}
