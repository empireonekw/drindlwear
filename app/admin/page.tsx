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
      <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:32px_Georgia,serif] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
        <h1>Dashboard Overview</h1>
        <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/admin/products">
          MANAGE PRODUCTS
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="stat-grid [display:grid] [grid-template-columns:repeat(4,1fr)] [gap:18px] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[gap:8px] motion-safe:[&_>_*]:[animation:page-enter_520ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:60ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:120ms] motion-safe:[&_>_:nth-child(4)]:[animation-delay:180ms]">
        {metrics.map(([label, value]) => (
          <div className="stat [background:white] [padding:25px] [border:1px_solid_#eee] [border-radius:8px] [&_strong]:[display:block] [&_strong]:[font-size:29px] [&_strong]:[margin:14px_0] max-[520px]:[padding:13px] max-[520px]:[&_strong]:[font-size:22px] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]" key={label}>
            <span className="muted [color:#999]">{label}</span>
            <strong>{value}</strong>
            <span className="text-xs text-gray-500">Live data</span>
          </div>
        ))}
      </div>
      <div className="admin-card [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <h2 className="text-xl font-serif">Orders by month</h2>
        {data && (
          <div className="dashboard-bars [height:240px] [display:flex] [align-items:end] [gap:14px] [padding:25px_0] [&>div]:[flex:1] [&>div]:[background:#781d2d] [&>div]:[border-radius:5px_5px_0_0] [&>div]:[position:relative] [&_span]:[position:absolute] [&_span]:[bottom:-24px] [&_span]:[left:50%] [&_span]:[transform:translateX(-50%)] [&_span]:[font-size:10px]">
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
