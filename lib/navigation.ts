import { colorFamilies, dirndlLengths, occasions } from "./data";

export type NavLink = { label: string; href: string; note?: string; highlight?: boolean };
export type NavColumn = { title: string; links: NavLink[] };
export type NavItem = {
  label: string;
  /** Where the top-level link goes. Items without one only open their menu. */
  href?: string;
  /** Present when the item opens a mega-menu. */
  columns?: NavColumn[];
  /** Optional picture tile shown at the end of the mega-menu. */
  feature?: { title: string; href: string; image: string };
  highlight?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
  /** Small pill after the label, e.g. "New". */
  badge?: string;
  /** Opens another website in a new tab, shown with an arrow. */
  external?: boolean;
};
export type FooterColumn = { title: string; links: FooterLink[] };

export const footerColumns: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "Women", href: "/collections/women" },
      { label: "Men", href: "/collections/men" },
      { label: "Kids", href: "/collections/kids" },
      { label: "Outfit sets", href: "/sets", badge: "New" },
      { label: "Sale", href: "/collections/sale" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/pages/contact" },
      { label: "Shipping & Delivery", href: "/pages/shipping-&-delivery" },
      { label: "Returns", href: "/pages/returns" },
      { label: "FAQ", href: "/pages/faq" },
      { label: "Size Guide", href: "/pages/size-guide" },
    ],
  },
  {
    title: "Dirndl Wear",
    links: [
      { label: "Our Story", href: "/pages/our-story" },
      { label: "Style Journal", href: "/pages/style-journal" },
      { label: "Dirndl Wear Club", href: "/club" },
      { label: "Careers", href: "/pages/careers" },
      { label: "Privacy Policy", href: "/pages/privacy-policy" },
      { label: "Legal Notice", href: "/pages/legal-notice" },
    ],
  },
  {
    title: "Social",
    // TODO: point these at the store's own profiles once they exist.
    links: [
      { label: "Instagram", href: "https://www.instagram.com/", external: true },
      { label: "Facebook", href: "https://www.facebook.com/", external: true },
      { label: "TikTok", href: "https://www.tiktok.com/", external: true },
      { label: "Pinterest", href: "https://www.pinterest.com/", external: true },
      { label: "YouTube", href: "https://www.youtube.com/", external: true },
    ],
  },
];

export const mainNav: NavItem[] = [
  {
    label: "Women",
    href: "/collections/women",
    columns: [
      {
        title: "Dirndl",
        links: [
          { label: "All dirndl", href: "/collections/dirndl" },
          ...dirndlLengths.map((length) => ({
            label: `${length.label} dirndl`,
            note: length.range,
            href: `/collections/dirndl-${length.slug}`,
          })),
        ],
      },
      {
        title: "Shop by colour",
        links: colorFamilies
          .filter((family) => family.value !== "brown")
          .map((family) => ({
            label: family.label,
            href: `/collections/women-${family.value}`,
          })),
      },
      {
        title: "Finish the look",
        links: [
          { label: "Complete sets", href: "/sets" },
          { label: "Blouses", href: "/collections/blouses" },
          { label: "Jackets", href: "/collections/women-jackets" },
          { label: "Accessories", href: "/collections/accessories" },
          { label: "All women", href: "/collections/women" },
        ],
      },
    ],
    feature: {
      title: "Complete sets",
      href: "/sets",
      image: "/images/asset-06.webp",
    },
  },
  {
    label: "Men",
    href: "/collections/men",
    columns: [
      {
        title: "Men",
        links: [
          { label: "Lederhosen", href: "/collections/lederhosen" },
          { label: "Shirts", href: "/collections/men-shirts" },
          { label: "Jackets", href: "/collections/men-jackets" },
          { label: "All men", href: "/collections/men" },
        ],
      },
      {
        title: "Together",
        links: [
          { label: "Couples' matching set", href: "/sets/couples" },
          { label: "Couples' matching outfits", href: "/collections/occasion-couples" },
          { label: "Wedding guest", href: "/collections/occasion-wedding-guest" },
        ],
      },
    ],
    feature: {
      title: "Lederhosen",
      href: "/collections/lederhosen",
      image: "/images/asset-09.webp",
    },
  },
  { label: "Kids", href: "/collections/kids" },
  {
    // Everything else, kept out of the bar so it stays short.
    label: "Others",
    columns: [
      {
        title: "Sale",
        links: [{ label: "Shop the sale", href: "/collections/sale", highlight: true }],
      },
      {
        title: "Shop by occasion",
        links: [
          ...occasions.map((occasion) => ({
            label: occasion.label,
            href: `/collections/occasion-${occasion.value}`,
          })),
          { label: "All occasions", href: "/collections/occasions" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Accessories", href: "/collections/accessories" },
          { label: "Style journal", href: "/pages/style-journal" },
        ],
      },
    ],
    feature: {
      title: "Festival looks",
      href: "/collections/occasion-festival",
      image: "/images/asset-02.jpeg",
    },
  },
];
