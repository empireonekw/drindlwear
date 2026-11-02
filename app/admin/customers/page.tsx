"use client";

import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/data";
import { useAutoRefresh } from "@/lib/use-auto-refresh";

type Customer = {
  email: string;
  name: string;
  orders: number;
  totalRevenue: number;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not load customers.";
        throw new Error(message);
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("customers" in payload) ||
        !Array.isArray(payload.customers)
      ) {
        throw new Error("Customer response was invalid.");
      }
      setCustomers(payload.customers as Customer[]);
      setError("");
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load customers.",
      );
    }
  }, []);

  useAutoRefresh(loadCustomers);
  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  return (
    <>
      <h1 className="text-3xl font-serif">Customers</h1>
      {error && <p role="alert">{error}</p>}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Orders</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.email}>
                <td>{customer.name}</td>
                <td>{customer.orders}</td>
                <td>{money(customer.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}