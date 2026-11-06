"use client";

import { m } from "framer-motion";
import { MapPin, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui, useUi } from "@/hooks/useUi";
import { cn } from "@/lib/cn";
import { DeliveryStatusChip } from "../location/DeliveryStatus";
import { Logo } from "./Logo";
import { Modal } from "../ui/Modal";
import { NAV_LINKS, isActive } from "./navLinks";
import { OrderNowButton } from "./OrderNowButton";

/**
 * Full-screen mobile / tablet menu. Slides down with staggered links. Built on the shared
 * Modal so it gets a focus trap, Escape-to-close, scroll lock and focus restore for free.
 * It has its own header row so the logo and close button sit exactly where the Navbar's are.
 */
export function MobileNavigation() {
  const open = useUi((s) => s.mobileMenuOpen);
  const pathname = usePathname();
  const close = () => ui.setMobileMenu(false);

  return (
    <Modal open={open} onClose={close} label="Main menu" variant="fullscreen" hideClose>
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
        <Logo onClick={close} />
        <button
          type="button"
          onClick={close}
          aria-label="Close menu"
          className="grid size-11 place-items-center rounded-sm text-paper transition-colors hover:bg-paper/10"
        >
          <X aria-hidden className="size-7" />
        </button>
      </div>
      <nav id="mobile-menu" aria-label="Mobile" className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col px-5 pb-8 pt-6">
        <ul className="grid gap-1">
          {NAV_LINKS.map((link, index) => {
            const active = isActive(link, pathname);
            return (
              <m.li
                key={link.label}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={link.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-baseline gap-3 border-b border-paper/10 py-2 font-display text-5xl uppercase leading-none tracking-wide transition-colors",
                    active ? "text-ember" : "text-paper hover:text-gold",
                  )}
                >
                  {link.label}
                </Link>
              </m.li>
            );
          })}
        </ul>

        <m.div
          className="mt-auto grid gap-3 pt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          <p className="flex items-center gap-2 text-sm text-smoke">
            <MapPin aria-hidden className="size-4 text-ember" />
            Delivery within 5 km of our Lahore branches
          </p>
          <DeliveryStatusChip variant="block" />
          <OrderNowButton size="lg" block arrow />
        </m.div>
      </nav>
    </Modal>
  );
}
