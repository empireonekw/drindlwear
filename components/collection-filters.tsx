"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { colorSwatches, ColorFamily, money } from "@/lib/data";
import { facetOptions, Filters, ListFacet } from "@/lib/filters";

type Options = ReturnType<typeof facetOptions>;
type Count = (facet: ListFacet, value: string) => number;

const groupClass = "group border-b border-[#eadfdc] py-4";
const summaryClass =
  "flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold uppercase tracking-[1.4px] [&::-webkit-details-marker]:hidden";
const optionRow =
  "flex min-h-9 cursor-pointer items-center gap-3 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:text-[#b5a9a9]";
const checkbox = "h-[18px] w-[18px] shrink-0 accent-[#781d2d]";

function Group({ title, active, children }: { title: string; active: number; children: React.ReactNode }) {
  return (
    <details open className={groupClass}>
      <summary className={summaryClass}>
        <span>
          {title}
          {active > 0 && <span className="ml-2 text-[#781d2d]">({active})</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" className="text-[#786565] transition group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/** Filter controls for a collection; the same panel serves the sidebar and the mobile drawer. */
export function CollectionFilters({
  options,
  filters,
  count,
  onChange,
}: {
  options: Options;
  filters: Filters;
  count: Count;
  onChange: (next: Filters) => void;
}) {
  const toggle = (facet: ListFacet, value: string) => {
    const current = filters[facet] as string[];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    onChange({ ...filters, [facet]: next });
  };

  const checkList = (facet: ListFacet, items: { value: string; label: string }[], swatch = false) => (
    <ul className="m-0 list-none p-0">
      {items.map((item) => {
        const selected = (filters[facet] as string[]).includes(item.value);
        const n = count(facet, item.value);
        return (
          <li key={item.value}>
            <label className={optionRow}>
              <input
                type="checkbox"
                className={checkbox}
                checked={selected}
                disabled={!selected && n === 0}
                onChange={() => toggle(facet, item.value)}
              />
              {swatch && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-full border border-[#d8c9c4]"
                  style={{ background: colorSwatches[item.value as ColorFamily] }}
                />
              )}
              <span className="flex-1">{item.label}</span>
              <span className="text-[12px] text-[#786565]">{n}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {options.categories.length > 1 && (
        <Group title="Category" active={filters.categories.length}>
          {checkList("categories", options.categories)}
        </Group>
      )}

      {options.sizes.length > 0 && (
        <Group title="Size (EU)" active={filters.sizes.length}>
          <div className="grid grid-cols-4 gap-2">
            {options.sizes.map(({ value }) => {
              const selected = filters.sizes.includes(value);
              const n = count("sizes", value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Size ${value}, ${n} products`}
                  disabled={!selected && n === 0}
                  onClick={() => toggle("sizes", value)}
                  className={
                    "h-11 border text-sm transition " +
                    (selected
                      ? "border-[#781d2d] bg-[#781d2d] text-white"
                      : "border-[#cfc3bf] bg-white hover:border-[#211c1d] disabled:cursor-not-allowed disabled:border-dashed disabled:text-[#b5a9a9] disabled:hover:border-[#cfc3bf]")
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {options.colours.length > 0 && (
        <Group title="Colour" active={filters.colours.length}>
          {checkList("colours", options.colours, true)}
        </Group>
      )}

      {options.lengths.length > 0 && (
        <Group title="Dress length" active={filters.lengths.length}>
          {checkList("lengths", options.lengths)}
        </Group>
      )}

      {options.occasions.length > 0 && (
        <Group title="Occasion" active={filters.occasions.length}>
          {checkList("occasions", options.occasions)}
        </Group>
      )}

      {options.priceRange && (
        <Group
          title="Price"
          active={(filters.minPrice !== undefined ? 1 : 0) + (filters.maxPrice !== undefined ? 1 : 0)}
        >
          <PriceRange
            range={options.priceRange}
            min={filters.minPrice}
            max={filters.maxPrice}
            onApply={(minPrice, maxPrice) => onChange({ ...filters, minPrice, maxPrice })}
          />
        </Group>
      )}

      <Group title="Availability" active={(filters.inStock ? 1 : 0) + (filters.onSale ? 1 : 0)}>
        <label className={optionRow}>
          <input
            type="checkbox"
            className={checkbox}
            checked={filters.inStock}
            onChange={() => onChange({ ...filters, inStock: !filters.inStock })}
          />
          In stock only
        </label>
        {options.hasSale && (
          <label className={optionRow}>
            <input
              type="checkbox"
              className={checkbox}
              checked={filters.onSale}
              onChange={() => onChange({ ...filters, onSale: !filters.onSale })}
            />
            On sale
          </label>
        )}
      </Group>
    </div>
  );
}

function PriceRange({
  range,
  min,
  max,
  onApply,
}: {
  range: { min: number; max: number };
  min?: number;
  max?: number;
  onApply: (min?: number, max?: number) => void;
}) {
  const [from, setFrom] = useState(min === undefined ? "" : String(min));
  const [to, setTo] = useState(max === undefined ? "" : String(max));

  // Keep the inputs in step when filters change elsewhere (e.g. "Clear all").
  useEffect(() => setFrom(min === undefined ? "" : String(min)), [min]);
  useEffect(() => setTo(max === undefined ? "" : String(max)), [max]);

  const parse = (value: string) => (value.trim() === "" ? undefined : Math.max(0, Number(value)));

  return (
    <form
      className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        let low = parse(from);
        let high = parse(to);
        if (low !== undefined && high !== undefined && low > high) [low, high] = [high, low];
        onApply(low, high);
      }}
    >
      <label className="grid gap-1 text-[12px] text-[#786565]">
        From (€)
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={from}
          placeholder={String(range.min)}
          onChange={(event) => setFrom(event.target.value)}
          className="h-11 w-full min-w-0 border border-[#cfc3bf] px-2 text-sm text-[#211c1d]"
        />
      </label>
      <label className="grid gap-1 text-[12px] text-[#786565]">
        To (€)
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={to}
          placeholder={String(range.max)}
          onChange={(event) => setTo(event.target.value)}
          className="h-11 w-full min-w-0 border border-[#cfc3bf] px-2 text-sm text-[#211c1d]"
        />
      </label>
      <button type="submit" className="h-11 border border-[#211c1d] px-3 text-[12px] uppercase tracking-[1px] hover:bg-[#211c1d] hover:text-white">
        Go
      </button>
      <p className="col-span-3 m-0 text-[12px] text-[#786565]">
        Prices here: {money(range.min)} – {money(range.max)}
      </p>
    </form>
  );
}
