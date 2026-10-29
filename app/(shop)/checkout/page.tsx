"use client";

import { useState } from "react";
import Link from "next/link";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

const addressFields = [
  ["first", "First Name"],
  ["last", "Last Name"],
  ["email", "E-Mail"],
  ["street", "Street und Hausnummer"],
  ["zip", "Postal Code"],
  ["city", "City"],
];

export default function Checkout() {
  const { items, products, clear, orders, setOrders } = useStore();
  const [done, setDone] = useState(false);
  const total = items.reduce(
    (sum, item) =>
      sum + (products.find((product) => product.id === item.id)?.price || 0) * item.qty,
    0,
  );

  function placeDemoOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;

    const formData = new FormData(event.currentTarget);
    setOrders([
      {
        id: `KD-${Math.floor(Date.now() / 1000)}`,
        customer: `${String(formData.get("first"))} ${String(formData.get("last"))}`,
        date: new Date().toISOString().slice(0, 10),
        total,
        status: "New",
      },
      ...orders,
    ]);
    clear();
    setDone(true);
  }

  return (
    <div className="container">
      <h1 className="page-heading">Checkout</h1>
      {done ? (
        <div className="empty">
          <h2>Thank you!</h2>
          <p>
            Your Demo-Bestellung wurde lokal gespeichert. Es wurde keine Zahlung
            durchgeführt.
          </p>
          <Link className="btn" href="/">
            BACK TO HOME
          </Link>
        </div>
      ) : (
        <form className="form-panel" onSubmit={placeDemoOrder}>
          <div className="notice">
            Demo checkout — no real payment processing or backend.
          </div>
          <h2 className="text-2xl font-serif">Shipping Address</h2>
          {addressFields.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`checkout-${key}`}>{label}</label>
              <input
                id={`checkout-${key}`}
                name={key}
                required
                type={key === "email" ? "email" : "text"}
              />
            </div>
          ))}
          <label htmlFor="payment-method">Payment Method (PKR)</label>
          <select id="payment-method" className="field w-full">
            <option>Demo / No real payment (PKR)</option>
          </select>
          <p className="mt-5 font-bold">Total: {money(total)}</p>
          <button disabled={!items.length} className="btn">
            PLACE DEMO ORDER
          </button>
        </form>
      )}
    </div>
  );
}
