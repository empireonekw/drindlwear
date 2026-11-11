"use client";

import { useMemo, useState } from "react";
import { Repeat, Users, Wallet } from "lucide-react";

import {
  Badge,
  Card,
  Drawer,
  EmptyState,
  orderStatusTone,
  PageHeader,
  SearchInput,
  StatCard,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import { Order, useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

type Customer = {
  email: string;
  name: string;
  phone: string;
  city: string;
  orders: Order[];
  spent: number;
  lastOrder: string;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export default function Customers() {
  const { orders } = useStore();
  const [query, setQuery] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  // Customers are built from orders for now (orders are saved in this browser).
  const customers = useMemo(() => {
    const byEmail = new Map<string, Customer>();
    for (const order of orders) {
      const key = order.customerEmail.trim().toLowerCase() || order.customer;
      const customer = byEmail.get(key) ?? {
        email: order.customerEmail,
        name: order.customer || "Guest",
        phone: order.customerPhone,
        city: order.shippingAddress.city,
        orders: [],
        spent: 0,
        lastOrder: order.date,
      };
      customer.orders.push(order);
      if (order.status !== "Cancelled") customer.spent += order.total;
      if (order.date > customer.lastOrder) customer.lastOrder = order.date;
      byEmail.set(key, customer);
    }
    return [...byEmail.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const term = query.trim().toLowerCase();
  const visible = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.phone} ${customer.city}`.toLowerCase().includes(term));
  const repeat = customers.filter((customer) => customer.orders.length > 1).length;
  const totalSpent = customers.reduce((sum, customer) => sum + customer.spent, 0);
  const open = customers.find((customer) => customer.email === openEmail);

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has placed an order, ranked by what they've spent." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Customers" value={customers.length} />
        <StatCard icon={Repeat} label="Repeat customers" value={repeat} hint={customers.length ? `${Math.round((repeat / customers.length) * 100)}% ordered more than once` : undefined} tone="green" />
        <StatCard icon={Wallet} label="Average spend" value={money(customers.length ? Math.round(totalSpent / customers.length) : 0)} tone="amber" />
      </div>

      <Card padded={false}>
        <div className="border-b border-[#f1e8e5] p-4">
          <SearchInput label="Search customers" placeholder="Search by name, email, phone or city" value={query} onChange={setQuery} />
        </div>
        {visible.length ? (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Phone</th>
                  <th className={thClass}>City</th>
                  <th className={thClass}>Orders</th>
                  <th className={thClass}>Spent</th>
                  <th className={thClass}>Last order</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.email} onClick={() => setOpenEmail(customer.email)} className="cursor-pointer transition-colors hover:bg-[#fdfaf8]">
                    <td className={tdClass}>
                      <button type="button" onClick={() => setOpenEmail(customer.email)} className="flex items-center gap-3 text-left">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f6eeec] text-[12px] font-semibold text-burgundy" aria-hidden="true">
                          {initials(customer.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium hover:text-burgundy">{customer.name}</span>
                          <span className="block text-[12px] text-taupe">{customer.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className={tdClass + " text-taupe"}>{customer.phone || "—"}</td>
                    <td className={tdClass + " text-taupe"}>{customer.city || "—"}</td>
                    <td className={tdClass}>
                      {customer.orders.length}
                      {customer.orders.length > 1 && <span className="ml-2"><Badge tone="green" dot={false}>Repeat</Badge></span>}
                    </td>
                    <td className={tdClass + " font-medium [font-variant-numeric:tabular-nums]"}>{money(customer.spent)}</td>
                    <td className={tdClass + " text-taupe"}>{customer.lastOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={customers.length ? "No customers match" : "No customers yet"}
            text={customers.length ? "Try another search." : "Customers appear here after their first order."}
          />
        )}
      </Card>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenEmail(null)}
        title={open?.name ?? "Customer"}
        subtitle={open && `${open.email}${open.phone ? ` · ${open.phone}` : ""}`}
      >
        {open && (
          <div className="grid gap-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Orders", String(open.orders.length)],
                ["Spent", money(open.spent)],
                ["Last order", open.lastOrder],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#eadfdc] bg-white p-4">
                  <p className="m-0 text-[12px] text-taupe">{label}</p>
                  <p className="m-0 mt-1 truncate text-[16px] font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <Card title="Order history" padded={false}>
              <ul className="m-0 list-none p-0">
                {open.orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3ebe8] px-5 py-3.5 last:border-b-0">
                    <span>
                      <span className="block font-medium">{formatOrderId(order.id)}</span>
                      <span className="block text-[12px] text-taupe">
                        {order.date} · {order.items.reduce((sum, item) => sum + item.qty, 0)} items
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-medium [font-variant-numeric:tabular-nums]">{money(order.total)}</span>
                      <Badge tone={orderStatusTone[order.status]}>{order.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
}
