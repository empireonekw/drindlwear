"use client";

import Link from "next/link";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

export default function Cart() {
  const { items, products, quantity, remove } = useStore();
  const rows = items
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product);
  const total = rows.reduce(
    (sum, item) => sum + item.qty * (item.product?.price || 0),
    0,
  );
  const inventoryIssue = rows.some(
    ({ qty, product }) => !product || product.stock < qty,
  );

  return (
    <div className="container">
      <h1 className="page-heading">Cart</h1>
      {!rows.length ? (
        <div className="empty">
          <p>Your cart is empty.</p>
          <Link href="/collections/all" className="btn">
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {rows.map(({ id, qty, product }) => (
              <div className="cart-item" key={id}>
                <img src={product!.image} alt={product!.name} />
                <div className="info">
                  <Link href={`/product/${id}`}>
                    <strong>{product!.name}</strong>
                  </Link>
                  <p className="muted">{product!.color}</p>
                  {product!.stock <= 0 ? (
                    <p className="stock-error" role="alert">Out of stock</p>
                  ) : qty > product!.stock ? (
                    <p className="stock-error" role="alert">
                      Only {product!.stock} left. Reduce quantity to continue.
                    </p>
                  ) : product!.stock <= 5 ? (
                    <p className="stock-note">Only {product!.stock} left</p>
                  ) : null}
                  <div className="qty">
                    <button
                      aria-label={`Decrease ${product!.name} quantity`}
                      onClick={() => quantity(id, qty - 1)}
                    >
                      −
                    </button>
                    {qty}
                    <button
                      aria-label={`Increase ${product!.name} quantity`}
                      disabled={qty >= product!.stock}
                      onClick={() => quantity(id, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-xs underline mt-3"
                    onClick={() => remove(id)}
                  >
                    Remove
                  </button>
                </div>
                <strong>{money(product!.price * qty)}</strong>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>Order Summary</h3>
            <div className="row-line">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="row-line">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="row-line">
              <strong>Total</strong>
              <strong>{money(total)}</strong>
            </div>
            {inventoryIssue ? (
              <button className="btn" disabled>
                UPDATE CART STOCK TO CHECKOUT
              </button>
            ) : (
              <Link className="btn" href="/checkout">
                PROCEED TO CHECKOUT
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
