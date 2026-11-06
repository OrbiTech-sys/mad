import type { Coordinates } from "./branch";

export type FulfilmentMethod = "delivery" | "pickup";

/** How the customer's coordinates were obtained. */
export type LocationSource = "gps" | "map-pin" | "demo";

export interface CartLine {
  /** `product:<id>` or `deal:<id>` */
  id: string;
  kind: "product" | "deal";
  refId: string;
  name: string;
  image: string;
  imageAlt: string;
  /** Whole rupees. */
  unitPrice: number;
  quantity: number;
  /** True while the price is a proof-of-concept placeholder. */
  demoPrice: boolean;
}

/** Everything about *how and where* the customer wants to order. Persisted. */
export interface OrderContext {
  method: FulfilmentMethod | null;
  branchId: string | null;
  coords: Coordinates | null;
  accuracyM: number | null;
  source: LocationSource | null;
  /** Free text the customer typed. NOT geographically validated. */
  address: string;
  updatedAt: number;
}

export interface OrderNotice {
  id: string;
  tone: "info" | "warning";
  title: string;
  message: string;
  action?: "change-location" | "choose-branch";
}

export interface OrderTotals {
  subtotal: number;
  /** null = not configured for this demo */
  deliveryFee: number | null;
  tax: number | null;
  total: number;
  /** True when at least one fee/tax/minimum is configured. */
  feesConfigured: boolean;
  minimumOrder: number | null;
  belowMinimum: boolean;
}

export interface DemoOrder {
  reference: string;
  placedAt: number;
  method: FulfilmentMethod;
  branch: {
    id: string;
    name: string;
    displayName: string;
    address: string;
    googleMapsUrl: string;
  };
  distanceKm: number | null;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    instructions: string;
  };
  lines: CartLine[];
  totals: OrderTotals;
}
