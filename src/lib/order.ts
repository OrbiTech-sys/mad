import type { FulfilmentCheck } from "./orderState";
import type { CartLine, DemoOrder, OrderTotals } from "@/types/order";
import { normalizePkMobile, type CheckoutValues } from "./validation";

// No 0/O/1/I/L: references get read out over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Demo reference such as MAD-DEMO-7K3Q9X. Always prefixed so it can never pass for a real order. */
export function generateOrderReference(random: (n: number) => Uint8Array = randomBytes): string {
  const bytes = random(6);
  return `MAD-DEMO-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function buildDemoOrder(input: {
  reference: string;
  /** Defaults to the current time; pass a value in tests. */
  now?: number;
  fulfilment: Extract<FulfilmentCheck, { ok: true }>;
  customer: CheckoutValues;
  lines: CartLine[];
  totals: OrderTotals;
}): DemoOrder {
  const { fulfilment, customer } = input;
  const { branch } = fulfilment;

  return {
    reference: input.reference,
    placedAt: input.now ?? Date.now(),
    method: fulfilment.method,
    branch: {
      id: branch.id,
      name: branch.name,
      displayName: branch.displayName,
      address: branch.address,
      googleMapsUrl: branch.googleMapsUrl,
    },
    distanceKm: fulfilment.distanceKm,
    customer: {
      fullName: customer.fullName.trim(),
      phone: normalizePkMobile(customer.phone) ?? customer.phone.trim(),
      email: customer.email.trim(),
      address: fulfilment.method === "delivery" ? customer.address.trim() : "",
      instructions: customer.instructions.trim(),
    },
    lines: input.lines.map((l) => ({ ...l })),
    totals: { ...input.totals },
  };
}
