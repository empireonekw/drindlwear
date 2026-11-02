"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { money } from "@/lib/data";
import { useAutoRefresh } from "@/lib/use-auto-refresh";

type DashboardData = {
  summary: {
    orderValue: number;
    orderCount: number;
    customerCount: number;
    productCount: number;
  };
  monthlyOrders: { label: string; orders: number }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not load dashboard.";
        throw new Error(message);
      }
      setData(payload as DashboardData);
      setError("");
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load dashboard.",
      );
    }
  }, []);

  useAutoRefresh(loadDashboard);
  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxOrders = Math.max(
    1,
    ...(data?.monthlyOrders.map((month) => month.orders) ?? []),
  );
  const metrics = data
    ? [
        ["Order value", money(data.summary.orderValue)],
        ["Orders", data.summary.orderCount],
        ["Products", data.summary.productCount],
        ["Customers", data.summary.customerCount],
      ]
    : [];

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard Overview</h1>
        <Link className="btn" href="/admin/products">
          MANAGE PRODUCTS
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="stat-grid">
        {metrics.map(([label, value]) => (
          <div className="stat" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
            <span className="text-xs text-gray-500">Live data</span>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <h2 className="text-xl font-serif">Orders by month</h2>
        {data && (
          <div className="dashboard-bars">
            {data.monthlyOrders.map((month, index) => (
              <div
                key={`${index}-${month.label}`}
                style={{
                  height: `${Math.max(4, (month.orders / maxOrders) * 100)}%`,
                }}
              >
                <span>{month.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
