export interface NavLink {
  label: string;
  href: string;
  /** Route prefix that marks this link active. Hash links are never "active". */
  match?: string;
  exact?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/", match: "/", exact: true },
  { label: "Menu", href: "/menu", match: "/menu" },
  { label: "Deals", href: "/#deals" },
  { label: "Our Story", href: "/#story" },
  { label: "Locations", href: "/locations", match: "/locations" },
  { label: "Contact", href: "/locations#contact" },
];

export function isActive(link: NavLink, pathname: string): boolean {
  if (!link.match) return false;
  return link.exact ? pathname === link.match : pathname.startsWith(link.match);
}
