export type CategoryId =
  | "burgers"
  | "wraps"
  | "loaded-fries"
  | "sandwiches"
  | "pizza"
  | "sides"
  | "drinks"
  | "deals";

export type ProductCategoryId = Exclude<CategoryId, "deals">;

export interface Category {
  id: CategoryId;
  name: string;
  order: number;
  image?: ImageAsset;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position, e.g. "50% 35%". */
  focus?: string;
}

/**
 * `demo`     – placeholder value invented for the proof of concept. Always labelled in the UI.
 * `verified` – confirmed by the business owner.
 */
export type DataStatus = "demo" | "verified";

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: ProductCategoryId;
  /** Short brand-voice hook. Deliberately makes no ingredient / size claims. */
  tagline: string;
  /** Owner-verified description. null until MAD supplies it. */
  description: string | null;
  /** Whole rupees. null = no price yet. */
  price: number | null;
  priceStatus: DataStatus;
  image: ImageAsset;
  available: boolean;
  featured: boolean;
  sortOrder: number;
}

export interface DealItem {
  productId: string;
  quantity: number;
}

export interface Deal {
  id: string;
  name: string;
  tagline: string;
  items: DealItem[];
  image: ImageAsset;
  /**
   * Explicit price. When null the deal is priced as the plain sum of its items
   * (no discount is ever invented).
   */
  price: number | null;
  priceStatus: DataStatus;
  /** Where the deal name came from, for the owner-verification list. */
  nameSource: "public-listing" | "demo";
  sortOrder: number;
}

export interface ResolvedDealItem {
  product: Product;
  quantity: number;
}

export interface ResolvedDeal extends Omit<Deal, "items"> {
  items: ResolvedDealItem[];
  // `price` is the explicit override from the Deal; use dealPrice() (lib/pricing.ts) for the
  // final amount, which falls back to the sum of the items.
}
