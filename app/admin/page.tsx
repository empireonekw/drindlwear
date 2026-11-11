"use client";

import Link from "next/link";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

export default function Dashboard() {
  const { orders, products } = useStore();

  const now = new Date();
  const monthlyOrders = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: date.toLocaleString("en", { month: "short" }),
      orders: orders.filter((order) => order.date.startsWith(key)).length,
    };
  });
  const data = {
    summary: {
      orderValue: orders
        .filter((order) => order.status !== "Cancelled")
        .reduce((sum, order) => sum + order.total, 0),
      orderCount: orders.length,
      customerCount: new Set(orders.map((order) => order.customerEmail)).size,
      productCount: products.length,
    },
    monthlyOrders,
  };

  const maxOrders = Math.max(
    1,
    ...(data.monthlyOrders.map((month) => month.orders) ?? []),
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
      <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:500_32px_var(--font-serif)] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
        <h1>Dashboard Overview</h1>
        <Link className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" href="/admin/products">
          MANAGE PRODUCTS
        </Link>
      </div>
      <div className="stat-grid [display:grid] [grid-template-columns:repeat(4,1fr)] [gap:18px] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[gap:8px] motion-safe:[&_>_*]:[animation:page-enter_520ms_cubic-bezier(0.2,_0.7,_0.2,_1)_both] motion-safe:[&_>_:nth-child(2)]:[animation-delay:60ms] motion-safe:[&_>_:nth-child(3)]:[animation-delay:120ms] motion-safe:[&_>_:nth-child(4)]:[animation-delay:180ms]">
        {metrics.map(([label, value]) => (
          <div className="stat [background:white] [padding:25px] [border:1px_solid_#eadfdc] [border-radius:8px] [&_strong]:[display:block] [&_strong]:[font-size:29px] [&_strong]:[margin:14px_0] max-[520px]:[padding:13px] max-[520px]:[&_strong]:[font-size:22px] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]" key={label}>
            <span className="muted [color:#786565]">{label}</span>
            <strong>{value}</strong>
            <span className="text-xs text-gray-500">This browser only</span>
          </div>
        ))}
      </div>
      <div className="admin-card [background:white] [border:1px_solid_#eadfdc] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
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
