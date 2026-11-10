import {
  availableStock,
  ColorFamily,
  colorFamilies,
  dirndlLengths,
  Occasion,
  occasions,
  Product,
  productSizes,
} from "./data";

export type LengthSlug = (typeof dirndlLengths)[number]["slug"];

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;
export type SortValue = (typeof sortOptions)[number]["value"];

export type Filters = {
  categories: string[];
  sizes: string[];
  colours: ColorFamily[];
  lengths: LengthSlug[];
  occasions: Occasion[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  onSale: boolean;
  sort: SortValue;
};

/** The multi-select facets, in the order the filter panel shows them. */
export type ListFacet = "categories" | "sizes" | "colours" | "lengths" | "occasions";

const listParam: Record<ListFacet, string> = {
  categories: "category",
  sizes: "size",
  colours: "colour",
  lengths: "length",
  occasions: "occasion",
};

const allowed: Record<ListFacet, (value: string) => boolean> = {
  categories: () => true,
  sizes: (value) => productSizes.includes(value),
  colours: (value) => colorFamilies.some((family) => family.value === value),
  lengths: (value) => dirndlLengths.some((length) => length.slug === value),
  occasions: (value) => occasions.some((occasion) => occasion.value === value),
};

const listFacets = Object.keys(listParam) as ListFacet[];

const toNumber = (value: string | null) => {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

/** Reads filters from the URL; unknown values are ignored. */
export function parseFilters(params: URLSearchParams): Filters {
  const list = (facet: ListFacet) =>
    [...new Set(params.getAll(listParam[facet]))].filter(allowed[facet]);
  const sort = params.get("sort");
  return {
    categories: list("categories"),
    sizes: list("sizes"),
    colours: list("colours") as ColorFamily[],
    lengths: list("lengths") as LengthSlug[],
    occasions: list("occasions") as Occasion[],
    minPrice: toNumber(params.get("min")),
    maxPrice: toNumber(params.get("max")),
    inStock: params.get("instock") === "1",
    onSale: params.get("sale") === "1",
    sort: sortOptions.some((option) => option.value === sort) ? (sort as SortValue) : "featured",
  };
}

/** Writes filters back to URL parameters, leaving out defaults. */
export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const facet of listFacets) {
    for (const value of filters[facet]) params.append(listParam[facet], value);
  }
  if (filters.minPrice !== undefined) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max", String(filters.maxPrice));
  if (filters.inStock) params.set("instock", "1");
  if (filters.onSale) params.set("sale", "1");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params;
}

export const emptyFilters = (sort: SortValue = "featured"): Filters => ({
  categories: [],
  sizes: [],
  colours: [],
  lengths: [],
  occasions: [],
  inStock: false,
  onSale: false,
  sort,
});

function matchesValue(product: Product, facet: ListFacet, value: string): boolean {
  switch (facet) {
    case "categories":
      return product.category === value;
    case "sizes":
      return Boolean(product.sizeStock) && availableStock(product, value) > 0;
    case "colours":
      return product.colorFamily === value;
    case "lengths": {
      const length = dirndlLengths.find((entry) => entry.slug === value);
      return (
        length !== undefined &&
        product.lengthCm !== undefined &&
        product.lengthCm >= length.min &&
        product.lengthCm <= length.max
      );
    }
    case "occasions":
      return product.occasions?.includes(value as Occasion) ?? false;
  }
}

/** True if the product passes every filter, optionally ignoring one facet. */
function matches(product: Product, filters: Filters, ignore?: ListFacet): boolean {
  for (const facet of listFacets) {
    if (facet === ignore || filters[facet].length === 0) continue;
    // Within a facet, any selected value may match (OR); facets combine with AND.
    if (!filters[facet].some((value) => matchesValue(product, facet, value))) return false;
  }
  if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
  if (filters.inStock && product.stock <= 0) return false;
  if (filters.onSale && product.oldPrice === undefined) return false;
  return true;
}

export function applyFilters(products: Product[], filters: Filters): Product[] {
  const result = products.filter((product) => matches(product, filters));
  return result.sort((a, b) => {
    switch (filters.sort) {
      case "newest":
        return b.id - a.id;
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return a.id - b.id;
    }
  });
}

/**
 * How many products would show for one option, given every other active
 * filter. Used for the counts beside each option.
 */
export function optionCount(
  products: Product[],
  filters: Filters,
  facet: ListFacet,
  value: string,
): number {
  return products.filter(
    (product) => matches(product, filters, facet) && matchesValue(product, facet, value),
  ).length;
}

/** Options worth offering for this set of products (anything that matches at least one). */
export function facetOptions(products: Product[]) {
  const has = (facet: ListFacet, value: string) =>
    products.some((product) => matchesValue(product, facet, value));
  return {
    categories: [...new Set(products.map((product) => product.category))].map((value) => ({
      value,
      label: value,
    })),
    sizes: productSizes.filter((size) => products.some((product) => product.sizeStock)).map((value) => ({
      value,
      label: value,
    })),
    colours: colorFamilies.filter((family) => has("colours", family.value)),
    lengths: dirndlLengths
      .filter((length) => has("lengths", length.slug))
      .map((length) => ({ value: length.slug, label: `${length.label} · ${length.range}` })),
    occasions: occasions.filter((occasion) => has("occasions", occasion.value)),
    hasSale: products.some((product) => product.oldPrice !== undefined),
    priceRange: products.length
      ? {
          min: Math.min(...products.map((product) => product.price)),
          max: Math.max(...products.map((product) => product.price)),
        }
      : null,
  };
}

/** Number of active filters (not counting sort). */
export function activeFilterCount(filters: Filters): number {
  return (
    listFacets.reduce((total, facet) => total + filters[facet].length, 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0)
  );
}
