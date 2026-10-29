"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Heart, ShieldCheck, Truck } from "lucide-react";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { money } from "@/lib/data";

const sizes = ["32", "34", "36", "38", "40", "42", "44"];

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { products, add, toggleWish, wishlist } = useStore();
  const product = products.find((item) => item.id === Number(id));
  const [size, setSize] = useState("38");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return <div className="empty">Product not found.</div>;
  }

  const productId = product.id;

  function addToCart() {
    for (let index = 0; index < quantity; index++) {
      add(productId);
    }
    setAdded(true);
  }

  return (
    <div className="container">
      <div className="breadcrumb">
        Home / {product.category} / {product.name}
      </div>
      <div className="product-detail">
        <div>
          <img
            className="detail-image"
            src={product.image}
            alt={product.name}
          />
        </div>

        <div className="detail-info">
          <span className="text-xs tracking-widest text-gray-500">
            DIRNDL WEAR DIRNDL
          </span>
          <h1>{product.name}</h1>
          <p className="text-xl font-bold">
            {money(product.price)}{" "}
            {product.oldPrice && (
              <del className="text-sm text-gray-400">
                {money(product.oldPrice)}
              </del>
            )}
          </p>
          <p>Includes VAT; shipping calculated at checkout</p>
          <p>{product.description}</p>
          <p>
            <strong>Color:</strong> {product.color}
          </p>
          <p>
            <strong>Select Size</strong>
          </p>

          <div className="size-options">
            {sizes.map((option) => (
              <button
                className={size === option ? "active" : ""}
                onClick={() => setSize(option)}
                key={option}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <div className="qty">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              {quantity}
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="btn flex-1" onClick={addToCart}>
              {added ? "ADDED ✓" : "ADD TO CART"}
            </button>
            <button
              onClick={() => toggleWish(product.id)}
              aria-label="Wishlist"
            >
              <Heart
                fill={wishlist.includes(product.id) ? "#ad786e" : "none"}
              />
            </button>
          </div>

          <div className="row-line">
            <span className="flex gap-3">
              <Truck size={19} /> Shipping &amp; Delivery
            </span>
            <span>2–5 business days*</span>
          </div>
          <div className="row-line">
            <span className="flex gap-3">
              <ShieldCheck size={19} /> Secure Shopping
            </span>
          </div>
          <p className="text-xs">
            *Demo information; not a real store or shipping promise.
          </p>
        </div>
      </div>

      <h2 className="section-title">You May Also Like</h2>
      <div className="pb-20">
        <ProductGrid
          items={products.filter((item) => item.id !== product.id).slice(0, 4)}
        />
      </div>
    </div>
  );
}
