"use client";

import { useState } from "react";
import Link from "next/link";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

const addressFields = [
  ["first", "First Name"],
  ["last", "Last Name"],
  ["email", "E-Mail"],
  ["phone", "Phone Number"],
  ["street", "Street und Hausnummer"],
  ["zip", "Postal Code"],
  ["city", "City"],
];

export default function Checkout() {
  const { items, products, clear, checkout } = useStore();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = items.reduce(
    (sum, item) =>
      sum + (products.find((product) => product.id === item.id)?.price || 0) * item.qty,
    0,
  );
  const inventoryIssues = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) {
      return [{ id: item.id, message: "This product is no longer available." }];
    }
    if (product.stock >= item.qty) return [];
    return [{
      id: item.id,
      message: product.stock === 0
        ? `${product.name} is out of stock.`
        : `Only ${product.stock} ${product.name} left; your cart has ${item.qty}.`,
    }];
  });

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setSubmitting(true);
    try {
      await checkout({
        first: String(formData.get("first")),
        last: String(formData.get("last")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone")),
        street: String(formData.get("street")),
        zip: String(formData.get("zip")),
        city: String(formData.get("city")),
      });
      clear();
      setDone(true);
    } catch (orderError) {
      setError(
        orderError instanceof Error ? orderError.message : "Could not place order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-heading">Checkout</h1>
      {done ? (
        <div className="empty">
          <h2>Thank you!</h2>
          <p>
            Your order has been recorded. Payment has not been processed.
          </p>
          <Link className="btn" href="/">
            BACK TO HOME
          </Link>
        </div>
      ) : (
        <form className="form-panel" onSubmit={placeOrder}>
          <div className="notice">
            Checkout saves your order and checks stock. No payment is processed.
          </div>
          {error && <p role="alert">{error}</p>}
          {inventoryIssues.length > 0 && (
            <div className="stock-error" role="alert">
              <p>Please update your cart before ordering:</p>
              <ul>
                {inventoryIssues.map((issue) => (
                  <li key={issue.id}>{issue.message}</li>
                ))}
              </ul>
              <Link className="underline" href="/cart">Return to cart</Link>
            </div>
          )}
          <h2 className="text-2xl font-serif">Shipping Address</h2>
          {addressFields.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`checkout-${key}`}>{label}</label>
              <input
                id={`checkout-${key}`}
                name={key}
                required
                type={
                  key === "email" ? "email" : key === "phone" ? "tel" : "text"
                }
                autoComplete={
                  key === "phone"
                    ? "tel"
                    : key === "street"
                      ? "street-address"
                      : undefined
                }
                placeholder={key === "phone" ? "+92 300 1234567" : undefined}
              />
            </div>
          ))}
          <label htmlFor="payment-method">Payment Method (PKR)</label>
          <select id="payment-method" className="field w-full">
            <option>Demo / No real payment (PKR)</option>
          </select>
          <p className="mt-5 font-bold">Total: {money(total)}</p>
          <button
            disabled={!items.length || submitting || inventoryIssues.length > 0}
            className="btn"
          >
            {submitting ? "PLACING ORDER..." : "PLACE ORDER"}
          </button>
        </form>
      )}
    </div>
  );
}
