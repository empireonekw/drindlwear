import { colorFamilies, dirndlLengths, occasions } from "./data";

export type NavLink = { label: string; href: string; note?: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavItem = {
  label: string;
  href: string;
  /** Present when the item opens a mega-menu. */
  columns?: NavColumn[];
  /** Optional picture tile shown at the end of the mega-menu. */
  feature?: { title: string; href: string; image: string };
  highlight?: boolean;
};

export const mainNav: NavItem[] = [
  { label: "Sale", href: "/collections/sale", highlight: true },
  {
    label: "Occasions",
    href: "/collections/occasions",
    columns: [
      {
        title: "Shop by occasion",
        links: occasions.map((occasion) => ({
          label: occasion.label,
          href: `/collections/occasion-${occasion.value}`,
        })),
      },
    ],
    feature: {
      title: "Festival looks",
      href: "/collections/occasion-festival",
      image: "/images/asset-02.jpeg",
    },
  },
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
  { label: "Accessories", href: "/collections/accessories" },
  { label: "Journal", href: "/pages/style-journal" },
];
