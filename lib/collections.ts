import {
  categories,
  colorFamilies,
  dirndlLengths,
  occasions,
  Product,
} from "./data";

export type Collection = {
  title: string;
  subtitle: string;
  matches: (product: Product) => boolean;
};

const isWomen = (product: Product) =>
  product.audience === "women" || product.audience === "unisex";
const isMen = (product: Product) =>
  product.audience === "men" || product.audience === "unisex";
const isDirndl = (product: Product) => product.category === "Dirndl";

const collections: Record<string, Collection> = {
  all: {
    title: "All products",
    subtitle: "FIND YOUR NEXT FAVORITE LOOK",
    matches: () => true,
  },
  sale: {
    title: "Sale",
    subtitle: "REDUCED FAVOURITES",
    matches: (product) => product.oldPrice !== undefined,
  },
  women: {
    title: "Women",
    subtitle: "DIRNDLS, BLOUSES & ACCESSORIES",
    matches: isWomen,
  },
  men: {
    title: "Men",
    subtitle: "LEDERHOSEN, SHIRTS & JACKETS",
    matches: isMen,
  },
  kids: {
    title: "Kids",
    subtitle: "TRADITIONAL LOOKS FOR LITTLE ONES",
    matches: (product) => product.audience === "kids",
  },
  dirndl: {
    title: "Dirndl",
    subtitle: "EVERY LENGTH, EVERY OCCASION",
    matches: isDirndl,
  },
  blouses: {
    title: "Dirndl blouses",
    subtitle: "THE FINISHING LAYER",
    matches: (product) => product.category === "Dirndl Blouses",
  },
  "women-jackets": {
    title: "Women's jackets",
    subtitle: "FINISH THE LOOK",
    matches: (product) => isWomen(product) && product.category === "Traditional Jackets",
  },
  accessories: {
    title: "Accessories",
    subtitle: "BAGS, JEWELLERY & DETAILS",
    matches: (product) => product.category === "Accessories",
  },
  lederhosen: {
    title: "Lederhosen",
    subtitle: "CLASSIC LEATHER",
    matches: (product) => product.category === "Lederhosen",
  },
  "men-shirts": {
    title: "Men's shirts",
    subtitle: "CHECKS & CLASSICS",
    matches: (product) => isMen(product) && product.category === "Traditional Shirts",
  },
  "men-jackets": {
    title: "Men's jackets",
    subtitle: "FINISH THE LOOK",
    matches: (product) => isMen(product) && product.category === "Traditional Jackets",
  },
  occasions: {
    title: "Shop by occasion",
    subtitle: "WHAT ARE YOU DRESSING FOR?",
    matches: (product) => Boolean(product.occasions?.length),
  },
};

// Dirndl by length: /collections/dirndl-short, -midi, -long
for (const length of dirndlLengths) {
  collections[`dirndl-${length.slug}`] = {
    title: `${length.label} dirndl`,
    subtitle: length.range.toUpperCase(),
    matches: (product) =>
      isDirndl(product) &&
      product.lengthCm !== undefined &&
      product.lengthCm >= length.min &&
      product.lengthCm <= length.max,
  };
}

// Women by colour: /collections/women-rose, -green, …
for (const family of colorFamilies) {
  collections[`women-${family.value}`] = {
    title: `${family.label}`,
    subtitle: "WOMEN · SHOP BY COLOUR",
    matches: (product) => isWomen(product) && product.colorFamily === family.value,
  };
}

// Occasions: /collections/occasion-festival, …
for (const occasion of occasions) {
  collections[`occasion-${occasion.value}`] = {
    title: occasion.label,
    subtitle: occasion.description.toUpperCase(),
    matches: (product) => product.occasions?.includes(occasion.value) ?? false,
  };
}

// Older links that still exist around the site.
collections.collections = collections.all;
collections["new arrivals"] = collections.all;

/**
 * Finds the collection for a URL slug. Unknown slugs fall back to a
 * category with the same name (e.g. "traditional jackets").
 */
export function getCollection(slug: string): Collection | undefined {
  const key = decodeURIComponent(slug).toLowerCase();
  if (collections[key]) return collections[key];

  const category = categories.find((name) => name.toLowerCase() === key.replace(/-/g, " "));
  if (!category) return undefined;
  return {
    title: category,
    subtitle: "FIND YOUR NEXT FAVORITE LOOK",
    matches: (product) => product.category === category,
  };
}
