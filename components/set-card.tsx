"use client";

import Link from "next/link";

import { money } from "@/lib/data";
import { OutfitSet, SetPricing } from "@/lib/sets";

/** Card for an outfit set: a collage of its pieces, the set price and the saving. */
export function SetCard({ set, pricing }: { set: OutfitSet; pricing: SetPricing }) {
  const [first, ...rest] = pricing.pieces;
  return (
    <Link
      href={`/sets/${set.id}`}
      className="group block bg-white text-[#211c1d] motion-safe:transition motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[0_12px_28px_rgb(33_28_29/8%)]"
    >
      <div className="relative grid aspect-[4/3] grid-cols-[2fr_1fr] gap-1 overflow-hidden bg-[#fbf5f2]">
        <img src={first.image} alt="" className="h-full w-full object-cover" />
        <div className="grid gap-1" style={{ gridTemplateRows: `repeat(${Math.max(rest.length, 1)}, minmax(0, 1fr))` }}>
          {rest.map((piece) => (
            <img key={piece.id} src={piece.image} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
        <span className="absolute left-3 top-3 bg-[#1f6b44] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
          Save {set.discountPercent}%
        </span>
        {!pricing.available && (
          <span className="absolute right-3 top-3 bg-[#211c1d] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
            Unavailable
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="m-0 font-serif text-[22px] font-normal text-[#781d2d] group-hover:underline">{set.name}</h3>
        <p className="m-0 mt-1 text-[13px] text-[#786565]">
          {pricing.pieces.length} pieces · {pricing.pieces.map((piece) => piece.category).join(", ")}
        </p>
        <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-2 text-sm">
          <strong className="text-base">{money(pricing.price)}</strong>
          <del className="text-[#786565]">{money(pricing.full)}</del>
          <span className="text-[#1f6b44]">You save {money(pricing.saving)}</span>
        </p>
      </div>
    </Link>
  );
}
