"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, Card, EmptyState, LinkButton, orderStatusTone, PageHeader, StatCard, Tabs } from "@/components/admin/ui";
import { Order, OrderStatus, useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

type Range = "7" | "30" | "90";
const DAY = 24 * 60 * 60 * 1000;
const statuses: OrderStatus[] = ["New", "Processing", "Shipped", "Delivered", "Cancelled"];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const counts = (order: Order) => order.status !== "Cancelled";

/** "+12%" against the previous period of the same length, or null when there is nothing to compare. */
function change(current: number, previous: number) {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs previous period`;
}

export default function Dashboard() {
  const { orders, products } = useStore();
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);

  const data = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getTime() - (days - 1) * DAY);
    const prevStart = new Date(start.getTime() - days * DAY);
    const inRange = orders.filter((order) => order.date >= isoDay(start));
    const inPrev = orders.filter((order) => order.date >= isoDay(prevStart) && order.date < isoDay(start));

    const revenue = inRange.filter(counts).reduce((sum, order) => sum + order.total, 0);
    const prevRevenue = inPrev.filter(counts).reduce((sum, order) => sum + order.total, 0);
    const paidOrders = inRange.filter(counts).length;

    // One point per day for the chart.
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start.getTime() + index * DAY);
      const key = isoDay(date);
      const dayOrders = inRange.filter((order) => order.date === key && counts(order));
      return {
        key,
        label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      };
    });

    // Best sellers by units in the range.
    const units = new Map<number, { name: string; qty: number; revenue: number }>();
    for (const order of inRange.filter(counts)) {
      for (const item of order.items) {
        const entry = units.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
        entry.qty += item.qty;
        entry.revenue += item.qty * item.price;
        units.set(item.productId, entry);
      }
    }
    const top = [...units.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);

    return {
      revenue,
      revenueChange: change(revenue, prevRevenue),
      orderCount: inRange.length,
      orderChange: change(inRange.length, inPrev.length),
      average: paidOrders ? Math.round(revenue / paidOrders) : 0,
      customers: new Set(inRange.map((order) => order.customerEmail.toLowerCase())).size,
      series,
      byStatus: statuses.map((status) => ({ status, count: inRange.filter((order) => order.status === status).length })),
      top,
    };
  }, [orders, days]);

  const lowStock = products
    .filter((product) => product.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);
  const recent = orders.slice(0, 6);
  const maxStatus = Math.max(1, ...data.byStatus.map((row) => row.count));
  const maxTop = Math.max(1, ...data.top.map(([, row]) => row.qty));
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title={greeting}
        description="Here is how the store is doing."
        actions={
          <Tabs
            label="Date range"
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Banknote} label="Revenue" value={money(data.revenue)} hint={data.revenueChange ?? "Excludes cancelled orders"} />
        <StatCard icon={ShoppingCart} label="Orders" value={data.orderCount} hint={data.orderChange ?? `Last ${days} days`} tone="amber" />
        <StatCard icon={Receipt} label="Average order" value={money(data.average)} hint="Revenue ÷ paid orders" tone="green" />
        <StatCard icon={Users} label="Customers" value={data.customers} hint={`${products.length} products in catalogue`} tone="taupe" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Revenue" description={`Per day, last ${days} days`}>
          <div className="h-[280px]" role="img" aria-label={`Revenue per day over the last ${days} days, total ${money(data.revenue)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#781d2d" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#781d2d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1e8e5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#786565", fontSize: 12 }} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: "#786565", fontSize: 12 }}
                  tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: "#d9b6b6", strokeWidth: 1 }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-[#eadfdc] bg-white px-3.5 py-2.5 text-[13px] shadow-[0_10px_24px_rgb(33_28_29_/_12%)]">
                        <p className="m-0 text-taupe">{payload[0].payload.label}</p>
                        <p className="m-0 mt-0.5 font-semibold text-charcoal">{money(payload[0].payload.revenue)}</p>
                        <p className="m-0 text-taupe">
                          {payload[0].payload.orders} order{payload[0].payload.orders === 1 ? "" : "s"}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#781d2d"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!orders.length && <p className="m-0 mt-3 text-center text-[13px] text-taupe">No orders yet: the chart fills in as orders arrive.</p>}
        </Card>

        <Card title="Orders by status" description={`Last ${days} days`}>
          <ul className="m-0 grid list-none gap-4 p-0">
            {data.byStatus.map(({ status, count }) => (
              <li key={status} className="grid grid-cols-[110px_minmax(0,1fr)_36px] items-center gap-3">
                <Badge tone={orderStatusTone[status]}>{status}</Badge>
                <span className="h-2 overflow-hidden rounded-full bg-[#f1ecea]" aria-hidden="true">
                  <span className="block h-full rounded-full bg-burgundy/80" style={{ width: `${(count / maxStatus) * 100}%` }} />
                </span>
                <span className="text-right text-[14px] font-semibold text-charcoal [font-variant-numeric:tabular-nums]">{count}</span>
              </li>
            ))}
          </ul>
          <LinkButton href="/admin/orders" variant="ghost" size="sm" className="mt-5 w-full">
            Manage orders <ArrowRight size={15} />
          </LinkButton>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Recent orders" action={<LinkButton href="/admin/orders" size="sm">View all</LinkButton>} padded={false}>
          {recent.length ? (
            <ul className="m-0 list-none p-0">
              {recent.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#f3ebe8] px-5 py-3.5 last:border-b-0">
                  <span className="w-[110px] font-medium text-charcoal">{formatOrderId(order.id)}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-charcoal">
                    {order.customer || "Guest"}
                    <span className="ml-2 text-[13px] text-taupe">{order.date}</span>
                  </span>
                  <span className="text-[14px] font-medium text-charcoal [font-variant-numeric:tabular-nums]">{money(order.total)}</span>
                  <Badge tone={orderStatusTone[order.status]}>{order.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ShoppingCart} title="No orders yet" text="Orders placed in the shop appear here as soon as they come in." />
          )}
        </Card>

        <div className="grid content-start gap-5">
          <Card title="Best sellers" description="Units sold in this period">
            {data.top.length ? (
              <ol className="m-0 grid list-none gap-3.5 p-0">
                {data.top.map(([id, row], index) => (
                  <li key={id} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="min-w-0 truncate text-charcoal">
                        <span className="mr-2 text-taupe">{index + 1}.</span>
                        {row.name}
                      </span>
                      <span className="flex-none font-semibold text-charcoal">{row.qty}</span>
                    </div>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#f1ecea]" aria-hidden="true">
                      <span className="block h-full rounded-full bg-burgundy/70" style={{ width: `${(row.qty / maxTop) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 text-[14px] text-taupe">No sales in this period yet.</p>
            )}
          </Card>

          <Card
            title="Low stock"
            description="3 units or fewer"
            action={lowStock.length ? <Badge tone="amber">{lowStock.length}</Badge> : undefined}
          >
            {lowStock.length ? (
              <ul className="m-0 grid list-none gap-3 p-0">
                {lowStock.map((product) => (
                  <li key={product.id}>
                    <Link href={`/admin/products?edit=${product.id}`} className="flex items-center gap-3 rounded-xl transition-colors hover:text-burgundy">
                      <img src={product.image} alt="" className="h-11 w-9 flex-none rounded-md object-cover" />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{product.name}</span>
                      <span className={"flex-none text-[13px] font-semibold " + (product.stock ? "text-[#8a5a0b]" : "text-taupe")}>
                        {product.stock ? `${product.stock} left` : "Sold out"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 flex items-center gap-2 text-[14px] text-taupe">
                <Package size={16} aria-hidden="true" /> Everything is well stocked.
              </p>
            )}
            {lowStock.length > 0 && (
              <p className="m-0 mt-4 flex items-center gap-2 text-[12px] text-taupe">
                <AlertTriangle size={14} aria-hidden="true" /> Click a product to restock it.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
