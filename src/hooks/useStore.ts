"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "@/lib/storage";

/** Subscribes a component to a Store (see lib/storage.ts). */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

const noopSubscribe = () => () => {};

/** false during SSR and the hydration pass, true afterwards. Use to avoid flashes of empty state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
