"use client";

import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { ui, useUi } from "@/hooks/useUi";
import { cn } from "@/lib/cn";
import { DeliveryStatusChip } from "../location/DeliveryStatus";
import { Logo } from "./Logo";
import { NAV_LINKS, isActive } from "./navLinks";
import { OrderNowButton } from "./OrderNowButton";

/**
 * Header. Transparent over the hero, solid (with a hairline) once the page scrolls.
 * The cart button is always visible, on every breakpoint.
 */
export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const menuOpen = useUi((s) => s.mobileMenuOpen);
  const { count, hydrated } = useCart();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
        scrolled || menuOpen
          ? "border-paper/10 bg-ink/90 backdrop-blur-md supports-[backdrop-filter]:bg-ink/80"
          : "border-transparent bg-gradient-to-b from-ink/70 to-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:h-[4.5rem] md:px-6">
        <Logo />

        <nav aria-label="Main" className="ml-3 hidden lg:block xl:ml-6">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link, pathname);
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group/link relative flex min-h-11 items-center whitespace-nowrap px-2 font-display text-lg uppercase tracking-[0.08em] transition-colors duration-200 xl:px-3 xl:text-xl",
                      active ? "text-paper" : "text-paper/75 hover:text-paper",
                    )}
                  >
                    {link.label}
                    {active ? (
                      <m.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 bottom-1.5 xl:inset-x-3 h-0.5 bg-ember"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-1.5 xl:inset-x-3 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover/link:scale-x-100"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden lg:block">
            <DeliveryStatusChip variant="nav" />
          </div>

          <button
            type="button"
            onClick={ui.openCart}
            aria-label={`Open cart${hydrated ? `, ${count} ${count === 1 ? "item" : "items"}` : ""}`}
            className="relative grid size-11 place-items-center rounded-sm text-paper transition-colors hover:bg-paper/10"
          >
            <ShoppingBag aria-hidden className="size-6" />
            <AnimatePresence>
              {hydrated && count > 0 && (
                <m.span
                  key={count}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-ember px-1 text-[11px] font-bold leading-5 text-ink"
                >
                  {count > 99 ? "99+" : count}
                </m.span>
              )}
            </AnimatePresence>
          </button>

          <div className="hidden md:block">
            <OrderNowButton size="sm" />
          </div>

          <button
            type="button"
            onClick={() => ui.setMobileMenu(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="relative grid size-11 place-items-center rounded-sm text-paper transition-colors hover:bg-paper/10 lg:hidden"
          >
            {menuOpen ? <X aria-hidden className="size-7" /> : <Menu aria-hidden className="size-7" />}
          </button>
        </div>
      </div>
    </header>
  );
}
