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
  const [stockMessage, setStockMessage] = useState("");

  if (!product) {
    return <div className="empty [text-align:center] [padding:100px_0] [color:#777]">Product not found.</div>;
  }

  const productId = product.id;

  function addToCart() {
    if (!add(productId, quantity)) {
      setStockMessage("Requested quantity exceeds available stock.");
      return;
    }
    setStockMessage("");
    setAdded(true);
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <div className="breadcrumb [font-size:11px] [color:#888] [padding:24px_0]">
        Home / {product.category} / {product.name}
      </div>
      <div className="product-detail [display:grid] [grid-template-columns:minmax(0,_1.15fr)_minmax(0,_0.85fr)] [gap:7%] [padding:35px_0_80px] max-[850px]:[grid-template-columns:minmax(0,_1fr)] [&_>_*]:[min-width:0] max-[850px]:[&_>_*]:[min-width:0]">
        <div>
          <img
            className="detail-image [width:100%] [height:700px] [object-fit:cover] [background:#eee] max-[850px]:[height:auto] [max-width:100%] max-[850px]:[aspect-ratio:3_/_4] max-[850px]:[object-fit:cover] motion-safe:[transition:transform_650ms_cubic-bezier(0.2,_0.7,_0.2,_1)] motion-safe:[&:hover]:[transform:scale(1.045)]"
            src={product.image}
            alt={product.name}
          />
        </div>

        <div className="detail-info [padding-top:35px] [&_h1]:[font:42px_Georgia,serif] [&_p]:[line-height:1.9] [&_p]:[color:#666] [&_h1]:[color:#781d2d] max-[1100px]:[&_.size-options]:[flex-wrap:wrap] max-[1100px]:[&_.size-options]:[gap:7px] max-[1100px]:[&_.size-options_button]:[padding:10px_12px] max-[1100px]:[&_.row-line]:[flex-wrap:wrap] max-[1100px]:[&_.row-line]:[row-gap:8px] max-[1100px]:[&_.row-line_>_:last-child]:[margin-left:auto]">
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
          {outOfStock ? (
            <p className="stock-error [color:#a32232] [font-size:13px]" role="status">Out of stock</p>
          ) : product.stock <= 5 ? (
            <p className="stock-note [color:#786565] [font-size:13px]" role="status">Only {product.stock} left in stock</p>
          ) : (
            <p className="stock-note [color:#786565] [font-size:13px]" role="status">{product.stock} in stock</p>
          )}
          <p>
            <strong>Color:</strong> {product.color}
          </p>
          <p>
            <strong>Select Size</strong>
          </p>

          <div className="size-options [display:flex] [gap:10px] [margin:12px_0_25px] [&_button]:[border:1px_solid_#ccc] [&_button]:[padding:12px_16px] [&_button.active]:[background:#781d2d] [&_button.active]:[color:white] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:7px] max-[520px]:[&_button]:[padding:10px_12px]">
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
            <div className="qty [display:flex] [gap:12px] [align-items:center] [&_button]:[border:1px_solid_#ddd] [&_button]:[padding:6px_12px]">
              <button
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              {quantity}
              <button
                disabled={quantity >= Math.min(product.stock, 50)}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className="btn flex-1 [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]"
              onClick={addToCart}
              disabled={outOfStock}
            >
              {outOfStock ? "OUT OF STOCK" : added ? "ADDED ✓" : "ADD TO CART"}
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
          {stockMessage && <p className="stock-error [color:#a32232] [font-size:13px]" role="alert">{stockMessage}</p>}

          <div className="row-line [display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [padding:20px_0] [border-bottom:1px_solid_#eee] max-[520px]:[flex-wrap:wrap] max-[520px]:[row-gap:8px] max-[520px]:[&_>_:last-child]:[margin-left:auto]">
            <span className="flex gap-3">
              <Truck size={19} /> Shipping &amp; Delivery
            </span>
            <span>2–5 business days*</span>
          </div>
          <div className="row-line [display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [padding:20px_0] [border-bottom:1px_solid_#eee] max-[520px]:[flex-wrap:wrap] max-[520px]:[row-gap:8px] max-[520px]:[&_>_:last-child]:[margin-left:auto]">
            <span className="flex gap-3">
              <ShieldCheck size={19} /> Secure Shopping
            </span>
          </div>
          <p className="text-xs">
            *Demo information; not a real store or shipping promise.
          </p>
        </div>
      </div>

      <h2 className="section-title [text-align:center] [font:normal_34px_Georgia,serif] [letter-spacing:1px] [margin:0_0_14px] max-[520px]:[font-size:29px] [color:#781d2d]">You May Also Like</h2>
      <div className="pb-20">
        <ProductGrid
          items={products.filter((item) => item.id !== product.id).slice(0, 4)}
        />
      </div>
    </div>
  );
}
