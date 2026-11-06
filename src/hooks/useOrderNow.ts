"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useLocation } from "./useOrder";
import { ui } from "./useUi";

/**
 * "Order Now" behaviour: the first time (no valid method + branch yet) it opens the location
 * modal; afterwards it simply takes the customer to the menu.
 */
export function useOrderNow() {
  const router = useRouter();
  const pathname = usePathname();
  const { fulfilment } = useLocation();

  return useCallback(() => {
    ui.setMobileMenu(false);
    if (fulfilment.ok) {
      if (pathname === "/menu") window.scrollTo({ top: 0, behavior: "smooth" });
      else router.push("/menu");
      return;
    }
    ui.openLocation({ afterComplete: "menu" });
  }, [fulfilment.ok, pathname, router]);
}
