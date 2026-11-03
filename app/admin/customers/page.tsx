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
      <div className="admin-card [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eee] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eee] [&_th]:[color:#888] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
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