"use client";

import Link from "next/link";
import { ArrowUpRight, Tags } from "lucide-react";

import { Badge, EmptyState, LinkButton, PageHeader } from "@/components/admin/ui";
import { useStore } from "@/components/store";
import { categories, money } from "@/lib/data";

/** Storefront link for each category. */
const storeSlug: Record<string, string> = {
  Dirndl: "dirndl",
  "Dirndl Blouses": "blouses",
  Lederhosen: "lederhosen",
  "Traditional Shirts": "traditional-shirts",
  "Traditional Jackets": "traditional-jackets",
  Accessories: "accessories",
  Kids: "kids",
};

export default function Categories() {
  const { products } = useStore();
  const rows = categories.map((name) => {
    const items = products.filter((product) => product.category === name);
    const prices = items.map((product) => product.price);
    return {
      name,
      items,
      image: items[0]?.image,
      units: items.reduce((sum, product) => sum + product.stock, 0),
      low: items.filter((product) => product.stock > 0 && product.stock <= 3).length,
      soldOut: items.filter((product) => product.stock <= 0).length,
      onSale: items.filter((product) => product.oldPrice).length,
      range: prices.length ? `${money(Math.min(...prices))} – ${money(Math.max(...prices))}` : "No products",
    };
  });

  return (
    <>
      <PageHeader title="Categories" description="How the catalogue is split up, with stock at a glance." />
      {products.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <article key={row.name} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eadfdc] bg-white">
              <div className="relative h-36 bg-[#f6eeec]">
                {row.image ? (
                  <img src={row.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-taupe">
                    <Tags size={28} aria-hidden="true" />
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-charcoal">
                  {row.items.length} product{row.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h2 className="m-0 font-serif text-[22px] font-medium">{row.name}</h2>
                  <p className="m-0 mt-0.5 text-[13px] text-taupe">{row.range}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="green" dot={false}>{row.units} units</Badge>
                  {row.low > 0 && <Badge tone="amber" dot={false}>{row.low} low</Badge>}
                  {row.soldOut > 0 && <Badge tone="grey" dot={false}>{row.soldOut} sold out</Badge>}
                  {row.onSale > 0 && <Badge tone="burgundy" dot={false}>{row.onSale} on sale</Badge>}
                </div>
                <div className="mt-auto flex gap-2 pt-2">
                  <LinkButton href={`/admin/products?category=${encodeURIComponent(row.name)}`} size="sm" className="flex-1">
                    Manage products
                  </LinkButton>
                  <Link
                    href={`/collections/${storeSlug[row.name] ?? row.name.toLowerCase()}`}
                    target="_blank"
                    aria-label={`View ${row.name} in the shop`}
                    title="View in shop"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dcd0cd] text-charcoal transition-colors hover:border-burgundy hover:text-burgundy"
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Tags} title="No products yet" text="Categories fill up as you add products." />
      )}
    </>
  );
}
