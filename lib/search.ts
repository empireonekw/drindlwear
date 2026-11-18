import { audiences, colorFamilies, occasions, Product } from "./data";
import { translate } from "./i18n";

/**
 * Everything a shopper might type to find a product, lower-cased, in English
 * and German (so "Bluse" finds blouses and "grün" finds green dirndls).
 */
function haystack(product: Product) {
  const words = [
    product.name,
    product.category,
    product.color,
    colorFamilies.find((family) => family.value === product.colorFamily)?.label,
    audiences.find((audience) => audience.value === product.audience)?.label,
    ...(product.occasions ?? []).map((value) => occasions.find((o) => o.value === value)?.label),
    product.material,
  ].filter((word): word is string => Boolean(word));
  return [...words, ...words.map((word) => translate("de", word))].join(" ").toLowerCase();
}

/**
 * Products matching every word of `query` (in any field above), best first:
 * name starts with the query, then name contains it, then other matches;
 * in-stock before sold out.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const phrase = terms.join(" ");
  const score = (product: Product) => {
    const name = product.name.toLowerCase();
    return (name.startsWith(phrase) ? 0 : name.includes(phrase) ? 1 : 2) + (product.stock > 0 ? 0 : 3);
  };
  return products
    .filter((product) => {
      const text = haystack(product);
      return terms.every((term) => text.includes(term));
    })
    .sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}
