import { Product, sumSizeStock } from "./data";
import type { OutfitSet } from "./sets";

/**
 * UI-ONLY PLACEHOLDERS — not a seed and not connected to any database.
 *
 * These exist only so every page has something to render while the UI is
 * being designed. Delete this file (and its import in components/store.tsx)
 * once real product data is wired up.
 */

/** Builds a sized product whose total stock is the sum of its sizes. */
function sized(
  product: Omit<Product, "stock" | "sizeStock">,
  sizeStock: Record<string, number>,
): Product {
  return { ...product, sizeStock, stock: sumSizeStock(sizeStock) };
}

const placeholderNote = "Placeholder description for UI layout.";

export const placeholderProducts: Product[] = [
  sized(
    {
      id: 1,
      name: "Placeholder Dirndl A",
      category: "Dirndl",
      audience: "women",
      price: 149.9,
      image: "/images/asset-03.webp",
      images: ["/images/asset-04.webp", "/images/asset-05.webp"],
      color: "Rose",
      colorFamily: "rose",
      lengthCm: 65,
      fit: "Fits true to size",
      material: "Cotton blend, satin apron",
      includes: "Dress and apron. Blouse sold separately.",
      occasions: ["festival", "couples"],
      description: placeholderNote,
    },
    { "32": 1, "34": 2, "36": 4, "38": 3, "40": 0, "42": 2, "44": 0 },
  ),
  sized(
    {
      id: 2,
      name: "Placeholder Dirndl B",
      category: "Dirndl",
      audience: "women",
      price: 179.9,
      oldPrice: 219.9,
      image: "/images/asset-04.webp",
      images: ["/images/asset-03.webp"],
      color: "Sage",
      colorFamily: "green",
      lengthCm: 72,
      fit: "Fitted bodice; choose your usual size",
      material: "Linen look, cotton apron",
      includes: "Dress and apron. Blouse sold separately.",
      occasions: ["wedding-guest"],
      description: placeholderNote,
    },
    { "32": 0, "34": 1, "36": 1, "38": 1, "40": 0, "42": 0, "44": 0 },
  ),
  sized(
    {
      id: 3,
      name: "Placeholder Dirndl C",
      category: "Dirndl",
      audience: "women",
      price: 129.9,
      image: "/images/asset-05.webp",
      color: "Midnight",
      colorFamily: "dark",
      lengthCm: 55,
      fit: "Runs small; consider one size up",
      material: "Cotton",
      includes: "Dress and apron. Blouse sold separately.",
      occasions: ["festival", "themed-party"],
      description: placeholderNote,
    },
    { "32": 0, "34": 0, "36": 0, "38": 0, "40": 0, "42": 0, "44": 0 },
  ),
  sized(
    {
      id: 4,
      name: "Placeholder Blouse",
      category: "Dirndl Blouses",
      audience: "women",
      price: 49.9,
      image: "/images/asset-06.webp",
      color: "White",
      colorFamily: "light",
      fit: "Fits true to size",
      material: "Cotton with lace trim",
      includes: "Blouse only.",
      occasions: ["festival", "wedding-guest", "themed-party"],
      description: placeholderNote,
    },
    { "32": 2, "34": 3, "36": 4, "38": 4, "40": 3, "42": 2, "44": 2 },
  ),
  sized(
    {
      id: 5,
      name: "Placeholder Lederhosen",
      category: "Lederhosen",
      audience: "men",
      price: 119.9,
      image: "/images/asset-07.webp",
      color: "Brown",
      colorFamily: "brown",
      fit: "Fits true to size",
      material: "Suede leather",
      includes: "Lederhosen with braces.",
      occasions: ["festival", "couples"],
      description: placeholderNote,
    },
    { "32": 0, "34": 1, "36": 2, "38": 2, "40": 2, "42": 1, "44": 0 },
  ),
  sized(
    {
      id: 6,
      name: "Placeholder Shirt",
      category: "Traditional Shirts",
      audience: "men",
      price: 69.9,
      oldPrice: 89.9,
      image: "/images/asset-09.webp",
      color: "Blue check",
      colorFamily: "blue",
      fit: "Regular fit",
      material: "Cotton",
      includes: "Shirt only.",
      occasions: ["festival", "couples"],
      description: placeholderNote,
    },
    { "32": 0, "34": 2, "36": 3, "38": 4, "40": 3, "42": 2, "44": 1 },
  ),
  sized(
    {
      id: 7,
      name: "Placeholder Jacket",
      category: "Traditional Jackets",
      audience: "women",
      price: 139.9,
      image: "/images/asset-10.webp",
      color: "Grey",
      colorFamily: "dark",
      fit: "Fitted; size up to wear over a blouse",
      material: "Boiled wool",
      includes: "Jacket only.",
      occasions: ["wedding-guest"],
      description: placeholderNote,
    },
    { "32": 0, "34": 1, "36": 1, "38": 2, "40": 1, "42": 1, "44": 0 },
  ),
  {
    id: 8,
    name: "Placeholder Handbag",
    category: "Accessories",
    audience: "women",
    price: 39.9,
    image: "/images/asset-08.webp",
    color: "Cream",
    colorFamily: "light",
    stock: 25,
    material: "Felt with leather strap",
    includes: "Bag only.",
    occasions: ["festival", "wedding-guest", "themed-party"],
    description: placeholderNote,
  },
  sized(
    {
      id: 9,
      name: "Placeholder Kids Dirndl",
      category: "Kids",
      audience: "kids",
      price: 69.9,
      image: "/images/asset-11.webp",
      color: "Rose",
      colorFamily: "rose",
      lengthCm: 50,
      fit: "Fits true to size",
      material: "Cotton",
      includes: "Dress, blouse and apron.",
      occasions: ["festival", "themed-party"],
      description: placeholderNote,
    },
    { "32": 3, "34": 3, "36": 2, "38": 0, "40": 0, "42": 0, "44": 0 },
  ),
  sized(
    {
      id: 10,
      name: "Placeholder Men's Jacket",
      category: "Traditional Jackets",
      audience: "men",
      price: 159.9,
      image: "/images/asset-10.webp",
      color: "Forest green",
      colorFamily: "green",
      fit: "Regular fit",
      material: "Wool blend",
      includes: "Jacket only.",
      occasions: ["wedding-guest"],
      description: placeholderNote,
    },
    { "32": 0, "34": 0, "36": 1, "38": 2, "40": 2, "42": 1, "44": 1 },
  ),
];

/** UI-only placeholder outfit sets, built from the products above. */
export const placeholderSets: OutfitSet[] = [
  {
    id: "festival-rose",
    name: "Festival Rose Set",
    description: "Dirndl, lace blouse and felt handbag: everything for a festival night.",
    productIds: [1, 4, 8],
    discountPercent: 10,
    occasions: ["festival"],
  },
  {
    id: "wedding-guest",
    name: "Wedding Guest Set",
    description: "A long sage dirndl with a blouse and a fitted wool jacket for cooler evenings.",
    productIds: [2, 4, 7],
    discountPercent: 10,
    occasions: ["wedding-guest"],
  },
  {
    id: "couples",
    name: "Couples' Matching Set",
    description: "Her dirndl and his lederhosen and shirt, chosen to belong together.",
    productIds: [1, 5, 6],
    discountPercent: 8,
    occasions: ["couples", "festival"],
  },
];
