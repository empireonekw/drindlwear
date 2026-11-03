"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { money, Product } from "@/lib/data";
import { useStore } from "./store";

export function ProductCard({ p }: { p: Product }) {
  const { add, toggleWish, wishlist } = useStore();
  const outOfStock = p.stock <= 0;
  const [stockMessage, setStockMessage] = useState("");

  function addToCart() {
    if (!add(p.id)) {
      setStockMessage("No more stock available.");
      return;
    }
    setStockMessage("");
  }

  return (
    <article className="product-card [&:hover_.quick-add]:[transform:translateY(0)] [background:#fff] motion-safe:[&:hover_.product-photo_img]:[transform:scale(1.045)] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
      <div className="product-photo [position:relative] [overflow:hidden] [background:#f3f0ec] [aspect-ratio:4/5] [&_a]:[position:absolute] [&_a]:[inset:0] [&_a]:[display:block] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:cover] motion-safe:[&_img]:[transition:transform_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)]">
        <Link href={`/product/${p.id}`}>
          <img className="block" src={p.image} alt={p.name} />
        </Link>
        {p.oldPrice && <span className="sale-label [position:absolute] [top:12px] [left:12px] [background:#fff] [padding:7px_12px] [font-size:10px] [letter-spacing:1px]">SALE</span>}
        {outOfStock && <span className="stock-label [position:absolute] [top:12px] [right:12px] [background:#781d2d] [color:#fff] [padding:7px_10px] [font-size:10px] [letter-spacing:1px]">OUT OF STOCK</span>}
        {!outOfStock && p.stock <= 5 && (
          <span className="stock-label [position:absolute] [top:12px] [right:12px] [background:#781d2d] [color:#fff] [padding:7px_10px] [font-size:10px] [letter-spacing:1px]">ONLY {p.stock} LEFT</span>
        )}
        <button
          aria-label="Wishlist"
          className="wish [position:absolute] [top:10px] [right:10px] [background:white] [border-radius:50%] [padding:10px]"
          onClick={() => toggleWish(p.id)}
        >
          <Heart
            size={19}
            fill={wishlist.includes(p.id) ? "#a97870" : "none"}
          />
        </button>
        <button
          className="quick-add [position:absolute] [bottom:0] [left:0] [right:0] [display:flex] [align-items:center] [justify-content:center] [gap:10px] [padding:15px] [background:#fffe] [font-size:10px] [letter-spacing:1px] [transform:translateY(100%)] [transition:.2s] [&:disabled]:[cursor:not-allowed] [&:disabled]:[color:#fff] [&:disabled]:[background:#786565] [&:disabled]:[transform:translateY(0)] max-[520px]:[transform:none] max-[520px]:[font-size:8px]"
          disabled={outOfStock}
          onClick={addToCart}
        >
          <ShoppingBag size={16} />{" "}
          {outOfStock ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>
      <div className="product-meta [padding:12px] [display:flex] [flex-direction:column] [gap:6px] [font-size:13px] [&_del]:[color:#999] [&_del]:[margin-left:10px] max-[520px]:[font-size:11px]">
        <Link href={`/product/${p.id}`}>{p.name}</Link>
        <span className="muted [color:#999]">{p.color}</span>
        <span className={outOfStock ? "stock-error [color:#a32232] [font-size:13px]" : "stock-note [color:#786565] [font-size:13px]"}>
          {outOfStock ? "Out of stock" : `${p.stock} in stock`}
        </span>
        {stockMessage && (
          <span className="stock-error [color:#a32232] [font-size:13px]" role="status">
            {stockMessage}
          </span>
        )}
        <div>
          <strong>{money(p.price)}</strong>{" "}
          {p.oldPrice && <del>{money(p.oldPrice)}</del>}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="product-grid [display:grid] [grid-template-columns:repeat(4,minmax(0,1fr))] [gap:25px_18px] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[gap:10px] motion-safe:[&_>_:nth-child(-n_+_8)]:[animation:page-enter_520ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:60ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:120ms] motion-safe:[&_>_:nth-child(4)]:[animation-delay:180ms] motion-safe:[&_>_:nth-child(n_+_5)]:[animation-delay:220ms]">
      {items.map((product) => (
        <ProductCard key={product.id} p={product} />
      ))}
    </div>
  );
}
