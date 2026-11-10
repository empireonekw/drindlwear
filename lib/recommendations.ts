import type { Product } from "./data";

/** Categories that complete an outfit for each category. */
const completesOutfit: Record<string, string[]> = {
  Dirndl: ["Dirndl Blouses", "Traditional Jackets", "Accessories"],
  "Dirndl Blouses": ["Dirndl", "Traditional Jackets", "Accessories"],
  "Traditional Jackets": ["Dirndl", "Dirndl Blouses", "Lederhosen", "Traditional Shirts", "Accessories"],
  Lederhosen: ["Traditional Shirts", "Traditional Jackets", "Accessories"],
  "Traditional Shirts": ["Lederhosen", "Traditional Jackets", "Accessories"],
  Accessories: ["Dirndl", "Dirndl Blouses", "Lederhosen", "Traditional Shirts"],
  Kids: ["Accessories"],
};

const sameWearer = (a: Product, b: Product) =>
  a.audience === b.audience || a.audience === "unisex" || b.audience === "unisex";

const sharedOccasions = (a: Product, b: Product) =>
  (a.occasions ?? []).filter((occasion) => b.occasions?.includes(occasion)).length;

/**
 * Pieces that go with `product`: other categories that complete the outfit,
 * for the same wearer, in stock, ranked by shared occasions. One per
 * category first so the look is varied.
 */
export function completeTheLook(product: Product, all: Product[], limit = 4): Product[] {
  const wanted = completesOutfit[product.category] ?? [];
  const candidates = all
    .filter(
      (other) =>
        other.id !== product.id &&
        other.stock > 0 &&
        wanted.includes(other.category) &&
        sameWearer(product, other),
    )
    .sort((a, b) => sharedOccasions(product, b) - sharedOccasions(product, a) || a.id - b.id);

  const picked: Product[] = [];
  const seenCategories = new Set<string>();
  for (const candidate of candidates) {
    if (!seenCategories.has(candidate.category)) {
      picked.push(candidate);
      seenCategories.add(candidate.category);
    }
  }
  for (const candidate of candidates) {
    if (!picked.includes(candidate)) picked.push(candidate);
  }
  return picked.slice(0, limit);
}

/** Alternatives to `product`: same category first, then same wearer. */
export function similarProducts(
  product: Product,
  all: Product[],
  exclude: Product[] = [],
  limit = 4,
): Product[] {
  const skip = new Set([product.id, ...exclude.map((item) => item.id)]);
  const pool = all.filter((other) => !skip.has(other.id));
  const sameCategory = pool.filter((other) => other.category === product.category);
  const sameAudience = pool.filter(
    (other) => other.category !== product.category && sameWearer(product, other),
  );
  return [...sameCategory, ...sameAudience].slice(0, limit);
}
