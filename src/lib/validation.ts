import { z } from "zod";
import type { FulfilmentMethod } from "@/types/order";
import { MAX_LINE_QUANTITY } from "./cart";

/**
 * Normalises a Pakistani mobile number to the local 11-digit form (03XXXXXXXXX).
 * Accepts: 0300 1234567 · 0300-1234567 · +92 300 1234567 · 92300… · 0092300… · 3001234567
 * Returns null when the input is not a valid Pakistani mobile number (3[0-4]X XXXXXXX).
 */
export function normalizePkMobile(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  const match = compact.match(/^(?:\+92|0092|92|0)?(3[0-4]\d{8})$/);
  return match ? `0${match[1]}` : null;
}

/* ---------------------------------------------------------------- checkout */

export function createCheckoutSchema(method: FulfilmentMethod | null) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(80, "Name is too long"),
    phone: z
      .string()
      .trim()
      .min(1, "Enter your mobile number")
      .refine(
        (v) => normalizePkMobile(v) !== null,
        "Enter a valid Pakistani mobile number, e.g. 0300 1234567",
      ),
    email: z
      .string()
      .trim()
      .max(120, "Email is too long")
      .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email, or leave it empty"),
    address:
      method === "delivery"
        ? z
            .string()
            .trim()
            .min(10, "Enter your full delivery address (house, street, area)")
            .max(250, "Address is too long")
        : z.string().trim().max(250, "Address is too long"),
    instructions: z.string().trim().max(300, "Keep instructions under 300 characters"),
  });
}

export type CheckoutValues = z.infer<ReturnType<typeof createCheckoutSchema>>;

/* ------------------------------------------------------ persisted data (LS) */

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const cartLineSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["product", "deal"]),
  refId: z.string().min(1),
  name: z.string().min(1),
  image: z.string(),
  imageAlt: z.string(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  demoPrice: z.boolean(),
});

export const cartStateSchema = z.object({
  lines: z.array(cartLineSchema),
});

export const orderContextSchema = z.object({
  method: z.enum(["delivery", "pickup"]).nullable(),
  branchId: z.string().nullable(),
  coords: coordinatesSchema.nullable(),
  accuracyM: z.number().nonnegative().nullable(),
  source: z.enum(["gps", "map-pin", "demo"]).nullable(),
  address: z.string().max(500),
  updatedAt: z.number(),
});

export const demoOrderSchema = z.object({
  reference: z.string(),
  placedAt: z.number(),
  method: z.enum(["delivery", "pickup"]),
  branch: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string(),
    address: z.string(),
    googleMapsUrl: z.string(),
  }),
  distanceKm: z.number().nullable(),
  customer: z.object({
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    instructions: z.string(),
  }),
  lines: z.array(cartLineSchema),
  totals: z.object({
    subtotal: z.number(),
    deliveryFee: z.number().nullable(),
    tax: z.number().nullable(),
    total: z.number(),
    feesConfigured: z.boolean(),
    minimumOrder: z.number().nullable(),
    belowMinimum: z.boolean(),
  }),
});
