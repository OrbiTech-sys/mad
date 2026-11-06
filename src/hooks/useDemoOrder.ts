"use client";

import { createStore } from "@/lib/storage";
import { demoOrderSchema } from "@/lib/validation";
import type { DemoOrder } from "@/types/order";

/**
 * The last DEMO order confirmation, kept so a refresh doesn't lose the confirmation screen.
 * It is never sent anywhere: this lives only in this browser's localStorage.
 */
export const demoOrderStore = createStore<DemoOrder | null>(null, {
  key: "mad.demo-order.v1",
  parse: (raw) => {
    const result = demoOrderSchema.safeParse(raw);
    return result.success ? result.data : null;
  },
});
