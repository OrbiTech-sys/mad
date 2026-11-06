import type { Deal } from "@/types/product";

/**
 * DEMO DEALS — NOT ACTIVE OFFERS.
 *
 * MAD has not supplied its real offers, so nothing here is a discount, an expiry date or a
 * live promotion. Each deal is a plain bundle of seed products priced as the SUM of its
 * items (`price: null`). The name "MAD MAX" appears in MAD's public social posts as a deal
 * name; its contents here are placeholders.
 *
 * When MAD provides real offers: set `price` (and `priceStatus: "verified"`), then edit items.
 */
export const DEALS: Deal[] = [
  {
    id: "mad-max",
    name: "MAD MAX",
    tagline: "The big one. Demo bundle.",
    items: [
      { productId: "mighty-burger", quantity: 1 },
      { productId: "loaded-fries", quantity: 1 },
    ],
    image: {
      src: "/images/deal-mad-max.jpg",
      alt: "A stacked double burger with melted cheese (representative photo)",
      width: 1200,
      height: 906,
      focus: "50% 45%",
    },
    price: null,
    priceStatus: "demo",
    nameSource: "public-listing",
    sortOrder: 1,
  },
  {
    id: "burger-duo",
    name: "Burger Duo",
    tagline: "Two burgers, one table. Demo bundle.",
    items: [
      { productId: "classic-mad-crispy-burger", quantity: 2 },
      { productId: "loaded-fries", quantity: 1 },
    ],
    image: {
      src: "/images/deal-burger-duo.jpg",
      alt: "A burger beside a basket of fries (representative photo)",
      width: 1200,
      height: 801,
      focus: "50% 50%",
    },
    price: null,
    priceStatus: "demo",
    nameSource: "demo",
    sortOrder: 2,
  },
  {
    id: "wrap-combo",
    name: "Wrap Combo",
    tagline: "Pick up a pair. Demo bundle.",
    items: [
      { productId: "smoky-bbq-wrap", quantity: 1 },
      { productId: "spicy-mexican-wrap", quantity: 1 },
    ],
    image: {
      src: "/images/deal-wrap-combo.jpg",
      alt: "Chicken wraps with red onion and herbs (representative photo)",
      width: 1200,
      height: 795,
      focus: "50% 50%",
    },
    price: null,
    priceStatus: "demo",
    nameSource: "demo",
    sortOrder: 3,
  },
  {
    id: "pizza-night",
    name: "Pizza Night",
    tagline: "Two pizzas, no arguments. Demo bundle.",
    items: [
      { productId: "chicken-tikka-pizza", quantity: 1 },
      { productId: "spicy-mexican-pizza", quantity: 1 },
    ],
    image: {
      src: "/images/deal-pizza-night.jpg",
      alt: "A pizza with fresh basil on a marble surface (representative photo)",
      width: 1200,
      height: 801,
      focus: "50% 50%",
    },
    price: null,
    priceStatus: "demo",
    nameSource: "demo",
    sortOrder: 4,
  },
  {
    id: "family-bundle",
    name: "Family Bundle",
    tagline: "Feed the whole crew. Demo bundle.",
    items: [
      { productId: "mighty-burger", quantity: 2 },
      { productId: "classic-mad-crispy-burger", quantity: 2 },
      { productId: "loaded-fries", quantity: 2 },
      { productId: "chicken-tikka-pizza", quantity: 1 },
    ],
    image: {
      src: "/images/deal-family-bundle.jpg",
      alt: "A tray of burgers with fries and dipping sauces (representative photo)",
      width: 1400,
      height: 935,
      focus: "50% 50%",
    },
    price: null,
    priceStatus: "demo",
    nameSource: "demo",
    sortOrder: 5,
  },
];
