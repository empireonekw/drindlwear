"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ruler } from "lucide-react";

import { useI18n } from "@/components/i18n";
import { ProductGrid } from "@/components/product";
import { SizeGuide, SizeGuideHandle } from "@/components/size-guide";
import { useStore } from "@/components/store";
import { availableStock, Product, productSizes, requiresSize } from "@/lib/data";
import { OutfitSet, setPricing, SetPricing } from "@/lib/sets";

const primaryButton =
  "inline-flex w-full items-center justify-center bg-[#781d2d] px-7 py-4 text-[12px] font-medium uppercase tracking-[1.5px] text-white transition hover:bg-[#5e1622] disabled:cursor-not-allowed disabled:bg-[#786565]";

export default function SetPage() {
  const { slug } = useParams<{ slug: string }>();
  const { sets, products } = useStore();
  const set = sets.find((entry) => entry.id === slug);
  const pricing = set && setPricing(set, products);
  const { t } = useI18n();

  if (!set || !pricing) {
    return (
      <div className="py-24 text-center text-[#786565]">
        <p>{t("This set could not be found.")}</p>
        <Link href="/sets" className="underline">{t("See all sets")}</Link>
      </div>
    );
  }
  return <SetView key={set.id} set={set} pricing={pricing} />;
}

function SetView({ set, pricing }: { set: OutfitSet; pricing: SetPricing }) {
  const { addSet } = useStore();
  const { t, money } = useI18n();
  const [sizes, setSizes] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);

  const missing = pricing.pieces.filter((piece) => requiresSize(piece.category) && !sizes[piece.id]);

  function addToCart() {
    if (missing.length) {
      setMessage(t("Choose a size for {pieces}.", { pieces: missing.map((piece) => piece.name).join(t(" and ")) }));
      setAdded(false);
      return;
    }
    const error = addSet(set.id, sizes);
    setMessage(error ?? "");
    setAdded(!error);
  }

  return (
    <div className="mx-auto max-w-[1360px] px-8 pb-24 max-[520px]:px-4">
      <nav aria-label={t("Breadcrumb")} className="py-6 text-[12px] text-[#786565]">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li><Link href="/" className="hover:text-[#781d2d]">{t("Home")}</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/sets" className="hover:text-[#781d2d]">{t("Complete sets")}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[#211c1d]">{t(set.name)}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-[6%] pb-16 max-[850px]:grid-cols-1 max-[850px]:gap-8">
        {/* Collage of every piece */}
        <div className="grid grid-cols-2 gap-2">
          {pricing.pieces.map((piece, index) => (
            <img
              key={piece.id}
              src={piece.image}
              alt={piece.name}
              className={
                "w-full object-cover " +
                (index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[3/4]")
              }
            />
          ))}
        </div>

        <div className="min-w-0">
          <p className="m-0 text-[11px] uppercase tracking-[2px] text-[#786565]">
            {t("Complete set · {count} pieces", { count: pricing.pieces.length })}
          </p>
          <h1 className="m-0 mt-2 font-serif text-[40px] font-normal leading-tight text-[#781d2d] max-[520px]:text-[32px]">
            {t(set.name)}
          </h1>
          <p className="m-0 mt-3 text-[15px] leading-7 text-[#786565]">{t(set.description)}</p>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <strong className="text-[24px]">{money(pricing.price)}</strong>
            <del className="text-[15px] text-[#786565]">{money(pricing.full)}</del>
            <span className="bg-[#e3f1e8] px-2 py-0.5 text-[13px] font-semibold text-[#1f6b44]">
              {t("You save {amount} ({percent}%)", { amount: money(pricing.saving), percent: set.discountPercent })}
            </span>
          </div>
          <p className="m-0 mt-1 text-[12px] text-[#786565]">
            {t("Set price applies when all pieces are in your cart. Includes VAT.")}
          </p>

          <ol className="m-0 mt-6 list-none divide-y divide-[#eadfdc] border-y border-[#eadfdc] p-0">
            {pricing.pieces.map((piece, index) => (
              <PieceRow
                key={piece.id}
                piece={piece}
                index={index}
                size={sizes[piece.id]}
                onSize={(size) => {
                  setSizes((current) => ({ ...current, [piece.id]: size }));
                  setMessage("");
                  setAdded(false);
                }}
              />
            ))}
          </ol>

          <button
            type="button"
            onClick={addToCart}
            disabled={!pricing.available}
            className={`${primaryButton} mt-6`}
          >
            {!pricing.available
              ? t("Set currently unavailable")
              : missing.length
                ? missing.length === 1
                  ? t("Choose a size to continue")
                  : t("Choose {count} sizes to continue", { count: missing.length })
                : t("Add set to cart · {amount}", { amount: money(pricing.price) })}
          </button>
          {message && <p role="alert" className="m-0 mt-3 text-sm text-[#781d2d]">{message}</p>}
          {added && (
            <p role="status" className="m-0 mt-3 flex flex-wrap gap-x-3 text-sm text-[#1f6b44]">
              {t("The set is in your cart.")}
              <Link href="/cart" className="font-semibold text-[#781d2d] underline underline-offset-4">{t("View cart")}</Link>
            </p>
          )}
        </div>
      </div>

      <section aria-labelledby="pieces-title">
        <h2 id="pieces-title" className="m-0 mb-3 text-center font-serif text-[34px] font-normal text-[#781d2d] max-[520px]:text-[29px]">
          {t("Or buy pieces separately")}
        </h2>
        <p className="mb-9 text-center text-[13px] tracking-[1px] text-[#786565]">{t("EVERY PIECE IN THIS SET")}</p>
        <ProductGrid items={pricing.pieces} />
      </section>
    </div>
  );
}

function PieceRow({
  piece,
  index,
  size,
  onSize,
}: {
  piece: Product;
  index: number;
  size?: string;
  onSize: (size: string) => void;
}) {
  const guide = useRef<SizeGuideHandle>(null);
  const needsSize = requiresSize(piece.category);
  const labelId = `piece-${piece.id}-size`;
  const left = size ? availableStock(piece, size) : null;
  const { t, money } = useI18n();

  return (
    <li className="py-5">
      <div className="flex gap-4">
        <img src={piece.image} alt="" className="h-[96px] w-[72px] shrink-0 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] uppercase tracking-[1.4px] text-[#786565]">{t("Piece {number}", { number: index + 1 })}</p>
          <Link href={`/product/${piece.id}`} className="font-semibold hover:text-[#781d2d]">{piece.name}</Link>
          <p className="m-0 text-sm text-[#786565]">
            {t(piece.color)} · {money(piece.price)}
          </p>
          {piece.fit && <p className="m-0 mt-1 text-[13px] text-[#786565]">{t(piece.fit)}</p>}
        </div>
      </div>

      {needsSize ? (
        <div className="mt-3">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p id={labelId} className="m-0 text-sm">
              <strong>{t("Size:")}</strong> {size ?? t("choose a size")}
              {left !== null && left <= 3 && <span className="ml-2 text-[#781d2d]">{t("Only {count} left", { count: left })}</span>}
            </p>
            <button
              type="button"
              onClick={() => guide.current?.open()}
              className="inline-flex items-center gap-1.5 text-[13px] underline underline-offset-4 hover:text-[#781d2d]"
            >
              <Ruler size={15} aria-hidden="true" /> {t("Size guide")}
            </button>
          </div>
          <div role="group" aria-labelledby={labelId} className="grid grid-cols-7 gap-1.5 max-[420px]:grid-cols-4">
            {productSizes.map((option) => {
              const soldOut = availableStock(piece, option) <= 0;
              const selected = size === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  disabled={soldOut}
                  aria-label={soldOut ? t("{name} size {size}, sold out", { name: piece.name, size: option }) : t("{name} size {size}", { name: piece.name, size: option })}
                  onClick={() => onSize(option)}
                  className={
                    "h-10 border text-sm transition " +
                    (soldOut
                      ? "cursor-not-allowed border-dashed border-[#d8c9c4] bg-[#fbf5f2] text-[#786565] line-through"
                      : selected
                        ? "border-[#781d2d] bg-[#781d2d] text-white"
                        : "border-[#cfc3bf] bg-white hover:border-[#211c1d]")
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
          <SizeGuide ref={guide} product={piece} />
        </div>
      ) : (
        <p className="m-0 mt-3 text-sm text-[#786565]">{t("One size")}</p>
      )}
    </li>
  );
}
