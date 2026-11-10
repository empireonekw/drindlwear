/** Who a product is for; drives the Women / Men / Kids menus. */
export type Audience = "women" | "men" | "kids" | "unisex";

/** Broad colour groups used by the "Shop by colour" menu. */
export type ColorFamily = "rose" | "green" | "blue" | "dark" | "light" | "brown";

export type Occasion = "festival" | "wedding-guest" | "themed-party" | "couples";

export type Product = {
  id: number;
  name: string;
  category: string;
  audience: Audience;
  price: number;
  oldPrice?: number;
  /** Main image, used on cards. */
  image: string;
  /** Extra gallery images shown on the product page after `image`. */
  images?: string[];
  /** Colour name shown to shoppers, e.g. "Rose". */
  color: string;
  colorFamily?: ColorFamily;
  /**
   * Total units in stock. For sized products this always equals the sum of
   * `sizeStock`.
   */
  stock: number;
  /** Units per size (keys from `productSizes`) for products sold in sizes. */
  sizeStock?: Record<string, number>;
  /** Dress length in cm (dirndls). */
  lengthCm?: number;
  /** Fit advice, e.g. "Fits true to size". */
  fit?: string;
  material?: string;
  /** What arrives in the parcel, e.g. "Dress and apron. Blouse sold separately." */
  includes?: string;
  occasions?: Occasion[];
  description: string;
};

export const categories = [
  "Dirndl",
  "Dirndl Blouses",
  "Lederhosen",
  "Traditional Shirts",
  "Traditional Jackets",
  "Accessories",
  "Kids",
];

export const audiences: { value: Audience; label: string }[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "kids", label: "Kids" },
  { value: "unisex", label: "Unisex" },
];

export const colorFamilies: { value: ColorFamily; label: string }[] = [
  { value: "rose", label: "Rose & red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "dark", label: "Black & dark" },
  { value: "light", label: "Cream & white" },
  { value: "brown", label: "Brown" },
];

/** Dot colour shown for each colour group. */
export const colorSwatches: Record<ColorFamily, string> = {
  rose: "#c98d93",
  green: "#8fa48b",
  blue: "#6b84a8",
  dark: "#2b2a33",
  light: "#efe8dc",
  brown: "#7a5536",
};

export const occasions: { value: Occasion; label: string; description: string }[] = [
  {
    value: "festival",
    label: "Festivals & Oktoberfest",
    description: "Bright, playful looks for festival nights and themed events.",
  },
  {
    value: "wedding-guest",
    label: "Wedding guest",
    description: "Elegant fabrics and deeper tones for weddings and receptions.",
  },
  {
    value: "themed-party",
    label: "Themed parties & shoots",
    description: "Complete looks that photograph beautifully.",
  },
  {
    value: "couples",
    label: "Couples' matching outfits",
    description: "Dirndl and lederhosen that belong together.",
  },
];

/** Dirndl length groups, as shoppers choose them. */
export const dirndlLengths = [
  { slug: "short", label: "Short", range: "50–55 cm", min: 0, max: 57 },
  { slug: "midi", label: "Midi", range: "60–65 cm", min: 58, max: 67 },
  { slug: "long", label: "Long", range: "70+ cm", min: 68, max: Infinity },
] as const;

export const productSizes = ["32", "34", "36", "38", "40", "42", "44"];

/** Categories sold in one size; everything else needs a size before it goes in the cart. */
const oneSizeCategories = ["Accessories"];

export function requiresSize(category: string) {
  return !oneSizeCategories.includes(category);
}

/** Units available for one size, or for the whole product when no size applies. */
export function availableStock(product: Product, size?: string) {
  if (size && product.sizeStock) return product.sizeStock[size] ?? 0;
  return product.stock;
}

export function sumSizeStock(sizeStock: Record<string, number>) {
  return Object.values(sizeStock).reduce((total, qty) => total + qty, 0);
}

export type CartItem = { id: number; qty: number; size?: string };

export const sameCartLine = (
  item: { id: number; size?: string },
  id: number,
  size?: string,
) => item.id === id && (item.size ?? "") === (size ?? "");

// Formats as "Rs 14,990". The "en-PK" currency format differs between Node
// and browsers ("Rs 14,990.00" vs "Rs 14,990"), which broke hydration, so the
// number is formatted with en-US grouping and the prefix is added by hand.
const rupees = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const money = (amount: number) => `Rs ${rupees.format(amount)}`;
