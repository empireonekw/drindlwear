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

/**
 * One cart line: a product in one size. Lines added as part of an outfit set
 * carry that set's id, so the set discount can be worked out.
 */
export type CartItem = { id: number; qty: number; size?: string; setId?: string };

export const sameCartLine = (
  item: { id: number; size?: string; setId?: string },
  id: number,
  size?: string,
  setId?: string,
) =>
  item.id === id &&
  (item.size ?? "") === (size ?? "") &&
  (item.setId ?? "") === (setId ?? "");

const sumQty = (lines: CartItem[]) => lines.reduce((total, line) => total + line.qty, 0);

/**
 * The most units one cart line may hold: what is left of its size (and of
 * the product overall) after the cart's other lines for the same product,
 * capped at 50 per product.
 */
export function lineLimit(
  cart: CartItem[],
  product: Product,
  line: { size?: string; setId?: string },
) {
  const others = cart.filter(
    (item) => item.id === product.id && !sameCartLine(item, product.id, line.size, line.setId),
  );
  const otherSameSize = sumQty(others.filter((item) => (item.size ?? "") === (line.size ?? "")));
  const otherAll = sumQty(others);
  return Math.max(
    0,
    Math.min(
      availableStock(product, line.size) - otherSameSize,
      product.stock - otherAll,
      50 - otherAll,
    ),
  );
}

/** Prices are in euros with cents, e.g. 149.9. */
const euros = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
/** Formats as "€149.90". */
export const money = (amount: number) => euros.format(amount);

/** Rounds to whole cents, so sums like 0.1 + 0.2 don't carry float noise. */
export const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
