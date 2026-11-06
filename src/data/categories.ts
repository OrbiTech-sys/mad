import type { Category } from "@/types/product";

/**
 * Candidate categories, pending an owner-confirmed menu.
 * The UI only shows categories that actually contain items, so adding a product to
 * "drinks" or "sides" makes that category appear automatically.
 */
export const CATEGORIES: Category[] = [
  {
    id: "burgers",
    name: "Burgers",
    order: 1,
    image: {
      src: "/images/classic-crispy-burger.jpg",
      alt: "A crispy burger topped with sauce on a paper-lined board",
      width: 1200,
      height: 1800,
      focus: "50% 40%",
    },
  },
  {
    id: "wraps",
    name: "Wraps",
    order: 2,
    image: {
      src: "/images/wrap-garlic-mustard.jpg",
      alt: "A wrap cut in half, showing its filling",
      width: 1200,
      height: 1500,
      focus: "50% 45%",
    },
  },
  {
    id: "loaded-fries",
    name: "Loaded Fries",
    order: 3,
    image: {
      src: "/images/loaded-fries.jpg",
      alt: "Seasoned fries served in a basket",
      width: 1200,
      height: 1800,
      focus: "50% 40%",
    },
  },
  { id: "sandwiches", name: "Sandwiches", order: 4 },
  {
    id: "pizza",
    name: "Pizza",
    order: 5,
    image: {
      src: "/images/pizza-chicken-tikka.jpg",
      alt: "A freshly baked pizza on a wooden board",
      width: 1200,
      height: 1450,
      focus: "50% 50%",
    },
  },
  { id: "sides", name: "Sides", order: 6 },
  { id: "drinks", name: "Drinks", order: 7 },
  {
    id: "deals",
    name: "Deals & Combos",
    order: 8,
    image: {
      src: "/images/deal-mad-max.jpg",
      alt: "A stacked double burger",
      width: 1200,
      height: 906,
      focus: "50% 45%",
    },
  },
];
