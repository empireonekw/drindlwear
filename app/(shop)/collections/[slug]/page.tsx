"use client";

import { Suspense, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { CollectionFilters } from "@/components/collection-filters";
import { useI18n } from "@/components/i18n";
import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { getCollection } from "@/lib/collections";
import { colorFamilies, dirndlLengths, occasions } from "@/lib/data";
import {
  activeFilterCount,
  applyFilters,
  emptyFilters,
  facetOptions,
  Filters,
  filtersToParams,
  optionCount,
  parseFilters,
  sortOptions,
  SortValue,
} from "@/lib/filters";

export default function CollectionPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <Collection />
    </Suspense>
  );
}

function Collection() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { products } = useStore();
  const { t, money } = useI18n();
  const drawer = useRef<HTMLDialogElement>(null);

  const collection = getCollection(slug);
  const title = t(collection?.title ?? decodeURIComponent(slug).replace(/-/g, " "));
  const productCount = (n: number) => (n === 1 ? t("1 product") : t("{count} products", { count: n }));

  // Filters live in the URL so filtered pages can be shared and the back button works.
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const setFilters = (next: Filters) => {
    const query = filtersToParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const inCollection = useMemo(
    () => (collection ? products.filter(collection.matches) : []),
    [products, collection],
  );
  const options = useMemo(() => facetOptions(inCollection), [inCollection]);
  const results = useMemo(() => applyFilters(inCollection, filters), [inCollection, filters]);
  const count = (facet: Parameters<typeof optionCount>[2], value: string) =>
    optionCount(inCollection, filters, facet, value);
  const activeCount = activeFilterCount(filters);

  // Removable chips for every active filter.
  const chips: { label: string; next: Filters }[] = [
    ...filters.categories.map((value) => ({
      label: t(value),
      next: { ...filters, categories: filters.categories.filter((entry) => entry !== value) },
    })),
    ...filters.sizes.map((value) => ({
      label: t("Size {size}", { size: value }),
      next: { ...filters, sizes: filters.sizes.filter((entry) => entry !== value) },
    })),
    ...filters.colours.map((value) => ({
      label: t(colorFamilies.find((family) => family.value === value)?.label ?? value),
      next: { ...filters, colours: filters.colours.filter((entry) => entry !== value) },
    })),
    ...filters.lengths.map((value) => ({
      label: t("{length} length", { length: t(dirndlLengths.find((length) => length.slug === value)?.label ?? value) }),
      next: { ...filters, lengths: filters.lengths.filter((entry) => entry !== value) },
    })),
    ...filters.occasions.map((value) => ({
      label: t(occasions.find((occasion) => occasion.value === value)?.label ?? value),
      next: { ...filters, occasions: filters.occasions.filter((entry) => entry !== value) },
    })),
    ...(filters.minPrice !== undefined
      ? [{ label: t("From {amount}", { amount: money(filters.minPrice) }), next: { ...filters, minPrice: undefined } }]
      : []),
    ...(filters.maxPrice !== undefined
      ? [{ label: t("Up to {amount}", { amount: money(filters.maxPrice) }), next: { ...filters, maxPrice: undefined } }]
      : []),
    ...(filters.inStock ? [{ label: t("In stock"), next: { ...filters, inStock: false } }] : []),
    ...(filters.onSale ? [{ label: t("On sale"), next: { ...filters, onSale: false } }] : []),
  ];
  const clearAll = () => setFilters(emptyFilters(filters.sort));

  const panel = (
    <CollectionFilters options={options} filters={filters} count={count} onChange={setFilters} />
  );

  return (
    <div className="mx-auto max-w-[1360px] px-8 pb-20 max-[520px]:px-4">
      <nav aria-label={t("Breadcrumb")} className="py-6 text-[12px] text-[#786565]">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li><Link href="/" className="hover:text-[#781d2d]">{t("Home")}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[#211c1d]">{title}</li>
        </ol>
      </nav>
      <h1 className="m-0 mt-4 text-center font-serif text-[42px] font-normal text-[#781d2d] max-[520px]:text-[34px]">
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </h1>
      <p className="mb-10 mt-3 text-center text-[13px] uppercase tracking-[1px] text-[#786565]">
        {t(collection?.subtitle ?? "FIND YOUR NEXT FAVORITE LOOK")}
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#eadfdc] py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => drawer.current?.showModal()}
            className="hidden h-11 items-center gap-2 border border-[#cfc3bf] bg-white px-4 text-sm max-[850px]:inline-flex"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            {t("Filters")}{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
          <p className="m-0 text-sm text-[#786565]" aria-live="polite">
            {productCount(results.length)}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[#786565] max-[420px]:sr-only">{t("Sort by")}</span>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value as SortValue })}
            className="h-11 border border-[#cfc3bf] bg-white px-3"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <ul className="m-0 mt-4 flex list-none flex-wrap items-center gap-2 p-0" aria-label={t("Active filters")}>
          {chips.map((chip) => (
            <li key={chip.label}>
              <button
                type="button"
                onClick={() => setFilters(chip.next)}
                aria-label={t("Remove filter: {name}", { name: chip.label })}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[#f3e6e3] px-4 text-[13px] hover:bg-[#ead6d2]"
              >
                {chip.label}
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={clearAll} className="h-9 px-2 text-[13px] underline underline-offset-4">
              {t("Clear all")}
            </button>
          </li>
        </ul>
      )}

      <div className="mt-6 grid grid-cols-[240px_minmax(0,1fr)] gap-10 max-[850px]:grid-cols-1">
        <aside aria-label={t("Filters")} className="max-[850px]:hidden">
          {panel}
        </aside>

        <div>
          {results.length ? (
            <ProductGrid items={results} columns={3} />
          ) : (
            <div className="py-24 text-center">
              <p className="m-0 text-[#786565]">
                {inCollection.length ? t("No products match these filters.") : t("No products found.")}
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 border border-[#211c1d] px-6 py-3 text-[12px] uppercase tracking-[1.4px] hover:bg-[#211c1d] hover:text-white"
                >
                  {t("Clear filters")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <dialog
        ref={drawer}
        aria-label={t("Filters")}
        onClick={(event) => {
          if (event.target === drawer.current) drawer.current?.close();
        }}
        className="m-0 ml-auto h-dvh max-h-none w-[min(420px,100vw)] max-w-none p-0 text-[#211c1d] backdrop:bg-[rgb(25_20_21/55%)]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#eadfdc] px-5 py-3">
            <h2 className="m-0 font-serif text-[24px] font-normal">{t("Filters")}</h2>
            <button
              type="button"
              onClick={() => drawer.current?.close()}
              aria-label={t("Close filters")}
              className="grid h-11 w-11 place-items-center"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">{panel}</div>
          <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-[#eadfdc] p-4">
            <button
              type="button"
              onClick={clearAll}
              disabled={activeCount === 0}
              className="h-12 px-4 text-sm underline underline-offset-4 disabled:text-[#b5a9a9] disabled:no-underline"
            >
              {t("Clear all")}
            </button>
            <button
              type="button"
              onClick={() => drawer.current?.close()}
              className="h-12 bg-[#781d2d] text-[12px] font-medium uppercase tracking-[1.5px] text-white hover:bg-[#5e1622]"
            >
              {t("Show {products}", { products: productCount(results.length) })}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
