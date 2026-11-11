"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";

import {
  availableStock,
  colorSwatches,
  money,
  Product,
  productSizes,
  requiresSize,
} from "@/lib/data";
import { useStore } from "./store";

export function ProductCard({ p }: { p: Product }) {
  const { add, toggleWish, wishlist } = useStore();
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const outOfStock = p.stock <= 0;
  const needsSize = requiresSize(p.category);
  const wished = wishlist.includes(p.id);
  const hoverImage = p.images?.[0];
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const sizesLeft = needsSize && p.sizeStock
    ? productSizes.filter((size) => availableStock(p, size) > 0)
    : [];
  const badge = outOfStock
    ? { text: "Sold out", className: "bg-[#211c1d] text-white" }
    : discount > 0
      ? { text: `−${discount}%`, className: "bg-[#781d2d] text-white" }
      : p.stock <= 3
        ? { text: `Only ${p.stock} left`, className: "bg-white text-[#781d2d]" }
        : null;

  function quickAdd(size?: string) {
    if (!add(p.id, 1, size)) {
      setFeedback({
        text: size ? `No more stock in size ${size}` : "No more stock available",
        ok: false,
      });
      return;
    }
    setFeedback({ text: size ? `Added size ${size} to cart` : "Added to cart", ok: true });
  }

  return (
    <article className="group relative bg-white motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[0_12px_28px_rgb(33_28_29/8%)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#fbf5f2]">
        <Link href={`/product/${p.id}`} className="absolute inset-0 block">
          <img
            src={p.image}
            alt={p.name}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
          />
          {hoverImage && (
            // Second photo fades in on hover (mouse devices only).
            <img
              src={hoverImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
        </Link>

        {badge && (
          <span className={`absolute left-3 top-3 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[1px] ${badge.className}`}>
            {badge.text}
          </span>
        )}

        <button
          type="button"
          aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          aria-pressed={wished}
          onClick={() => toggleWish(p.id)}
          className="absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full bg-white text-[#781d2d] shadow-sm"
        >
          <Heart size={18} fill={wished ? "currentColor" : "none"} aria-hidden="true" />
        </button>

        {!outOfStock && (
          <>
            {/* Mouse devices: quick add slides up on hover or keyboard focus */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 p-3 transition-transform duration-200 group-focus-within:translate-y-0 group-hover:translate-y-0 [@media(hover:none)]:hidden">
              {needsSize ? (
                <>
                  <p className="m-0 mb-2 text-[10px] uppercase tracking-[1.4px] text-[#786565]">Quick add · size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sizesLeft.map((size) => (
                      <button
                        key={size}
                        type="button"
                        aria-label={`Add ${p.name} in size ${size} to cart`}
                        onClick={() => quickAdd(size)}
                        className="h-9 min-w-10 border border-[#cfc3bf] bg-white px-2 text-[13px] hover:border-[#781d2d] hover:bg-[#781d2d] hover:text-white"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => quickAdd()}
                  className="flex h-10 w-full items-center justify-center gap-2 bg-[#781d2d] text-[11px] uppercase tracking-[1.4px] text-white hover:bg-[#5e1622]"
                >
                  <ShoppingBag size={15} aria-hidden="true" /> Add to cart
                </button>
              )}
            </div>

            {/* Touch devices: no hover, so a simple bar */}
            <div className="absolute inset-x-0 bottom-0 hidden [@media(hover:none)]:block">
              {needsSize ? (
                <Link
                  href={`/product/${p.id}`}
                  className="flex h-10 items-center justify-center gap-2 bg-white/95 text-[10px] uppercase tracking-[1.2px]"
                >
                  <ShoppingBag size={14} aria-hidden="true" /> Choose size
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => quickAdd()}
                  className="flex h-10 w-full items-center justify-center gap-2 bg-white/95 text-[10px] uppercase tracking-[1.2px]"
                >
                  <ShoppingBag size={14} aria-hidden="true" /> Add to cart
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3 text-[13px] max-[520px]:p-2.5 max-[520px]:text-[12px]">
        <Link href={`/product/${p.id}`} className="font-medium leading-snug hover:text-[#781d2d]">
          {p.name}
        </Link>
        <span className="flex items-center gap-1.5 text-[#786565]">
          {p.colorFamily && (
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-full border border-[#d8c9c4]"
              style={{ background: colorSwatches[p.colorFamily] }}
            />
          )}
          {p.color}
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <strong className={discount ? "text-[#781d2d]" : ""}>{money(p.price)}</strong>
          {p.oldPrice && <del className="text-[#786565]">{money(p.oldPrice)}</del>}
        </div>
        {outOfStock ? (
          <span className="text-[12px] text-[#781d2d]">Sold out</span>
        ) : (
          sizesLeft.length > 0 && (
            <span className="text-[12px] text-[#786565]">
              <span className="sr-only">Sizes available: </span>
              {sizesLeft.join(" · ")}
            </span>
          )
        )}
        {feedback && (
          <span role="status" className={`text-[12px] ${feedback.ok ? "text-[#1f6b44]" : "text-[#781d2d]"}`}>
            {feedback.text}
            {feedback.ok && (
              <>
                {" · "}
                <Link href="/cart" className="underline underline-offset-2">View cart</Link>
              </>
            )}
          </span>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ items, columns = 4 }: { items: Product[]; columns?: 3 | 4 }) {
  return (
    <div
      className={
        "product-grid grid gap-x-[18px] gap-y-[25px] max-[850px]:grid-cols-2 max-[520px]:gap-2.5 " +
        (columns === 3 ? "grid-cols-3 max-[1100px]:grid-cols-2" : "grid-cols-4") +
        " motion-safe:[&_>_:nth-child(-n_+_8)]:[animation:page-enter_520ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:60ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:120ms] motion-safe:[&_>_:nth-child(4)]:[animation-delay:180ms] motion-safe:[&_>_:nth-child(n_+_5)]:[animation-delay:220ms]"
      }
    >
      {items.map((product) => (
        <ProductCard key={product.id} p={product} />
      ))}
    </div>
  );
}
