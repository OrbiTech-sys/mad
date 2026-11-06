"use client";

import { useEffect, type ReactNode } from "react";
import { BranchesProvider, reconcileStoredOrder } from "@/hooks/useOrder";
import type { Branch } from "@/types/branch";
import { CartDrawer } from "./cart/CartDrawer";
import { LocationNotices } from "./location/DeliveryStatus";
import { LocationModal } from "./location/LocationModal";
import { MobileNavigation } from "./layout/MobileNavigation";
import { MobileOrderBar } from "./layout/MobileOrderBar";
import { Navbar } from "./layout/Navbar";
import { ToastHost } from "./layout/ToastHost";
import { ProductModal } from "./menu/ProductModal";
import { MotionProvider } from "./ui/MotionProvider";

/**
 * Client shell: motion config, branch data, persisted-state reconciliation, and the global
 * overlays (cart drawer, location modal, product modal, mobile menu, toasts).
 */
export function AppProviders({ branches, children }: { branches: Branch[]; children: ReactNode }) {
  // Re-validate whatever was saved in localStorage against the live branch list.
  useEffect(() => {
    reconcileStoredOrder(branches);

    // Another tab changed the saved location: validate it here too (the store has already reloaded it).
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "mad.order.v1") reconcileStoredOrder(branches);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [branches]);

  return (
    <MotionProvider>
      <BranchesProvider branches={branches}>
        <Navbar />
        <LocationNotices />
        {children}
        <MobileOrderBar />
        <CartDrawer />
        <LocationModal />
        <ProductModal />
        <MobileNavigation />
        <ToastHost />
      </BranchesProvider>
    </MotionProvider>
  );
}
