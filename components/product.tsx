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
    <article className="product-card">
      <div className="product-photo">
        <Link href={`/product/${p.id}`}>
          <img src={p.image} alt={p.name} />
        </Link>
        {p.oldPrice && <span className="sale-label">SALE</span>}
        {outOfStock && <span className="stock-label">OUT OF STOCK</span>}
        {!outOfStock && p.stock <= 5 && (
          <span className="stock-label">ONLY {p.stock} LEFT</span>
        )}
        <button
          aria-label="Wishlist"
          className="wish"
          onClick={() => toggleWish(p.id)}
        >
          <Heart
            size={19}
            fill={wishlist.includes(p.id) ? "#a97870" : "none"}
          />
        </button>
        <button
          className="quick-add"
          disabled={outOfStock}
          onClick={addToCart}
        >
          <ShoppingBag size={16} />{" "}
          {outOfStock ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>
      <div className="product-meta">
        <Link href={`/product/${p.id}`}>{p.name}</Link>
        <span className="muted">{p.color}</span>
        <span className={outOfStock ? "stock-error" : "stock-note"}>
          {outOfStock ? "Out of stock" : `${p.stock} in stock`}
        </span>
        {stockMessage && (
          <span className="stock-error" role="status">
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
    <div className="product-grid">
      {items.map((product) => (
        <ProductCard key={product.id} p={product} />
      ))}
    </div>
  );
}
