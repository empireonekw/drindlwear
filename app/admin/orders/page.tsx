"use client";

import { useState } from "react";
import { Ban, Check, CreditCard, MapPin, ShoppingCart, User } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  orderStatusTone,
  PageHeader,
  SearchInput,
  Tabs,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from "@/components/admin/ui";
import { Order, OrderStatus, useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

const flow: OrderStatus[] = ["New", "Processing", "Shipped", "Delivered"];
const nextLabel: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  New: { to: "Processing", label: "Start processing" },
  Processing: { to: "Shipped", label: "Mark as shipped" },
  Shipped: { to: "Delivered", label: "Mark as delivered" },
};
type Filter = OrderStatus | "All";

export default function Orders() {
  const { orders, updateOrderStatus } = useStore();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const open = orders.find((order) => order.id === openId);

  function changeStatus(order: Order, status: OrderStatus) {
    try {
      updateOrderStatus(order.id, status);
      toast(`${formatOrderId(order.id)} is now ${status.toLowerCase()}.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update the order.", "error");
    }
  }

  const term = query.trim().toLowerCase();
  const searched = orders.filter((order) =>
    `${formatOrderId(order.id)} ${order.customer} ${order.customerEmail} ${order.customerPhone}`.toLowerCase().includes(term),
  );
  const visible = searched.filter((order) => filter === "All" || order.status === filter);
  const count = (status: Filter) => searched.filter((order) => status === "All" || order.status === status).length;

  return (
    <>
      <PageHeader title="Orders" description={`${orders.length} orders · ${count("New")} waiting to be processed.`} />

      <Card padded={false}>
        <div className="grid gap-3 border-b border-[#f1e8e5] p-4">
          <SearchInput label="Search orders" placeholder="Search by order number, name, email or phone" value={query} onChange={setQuery} />
          <Tabs
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={(["All", "New", "Processing", "Shipped", "Delivered", "Cancelled"] as Filter[]).map((status) => ({
              value: status,
              label: status,
              count: count(status),
            }))}
          />
        </div>

        {visible.length ? (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Order</th>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Items</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Payment</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id} onClick={() => setOpenId(order.id)} className="cursor-pointer transition-colors hover:bg-[#fdfaf8]">
                    <td className={tdClass}>
                      <button type="button" className="font-medium text-charcoal hover:text-burgundy" onClick={() => setOpenId(order.id)}>
                        {formatOrderId(order.id)}
                      </button>
                      <span className="block text-[12px] text-taupe">{order.date}</span>
                    </td>
                    <td className={tdClass}>
                      <span className="block">{order.customer || "Guest"}</span>
                      <span className="block text-[12px] text-taupe">{order.customerEmail}</span>
                    </td>
                    <td className={tdClass + " text-taupe"}>{order.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                    <td className={tdClass + " font-medium [font-variant-numeric:tabular-nums]"}>{money(order.total)}</td>
                    <td className={tdClass}>
                      <span className="block text-[13px]">{order.paymentMethod ?? "—"}</span>
                      <span className="block text-[12px] text-taupe">{order.paymentStatus}</span>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={orderStatusTone[order.status]}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title={orders.length ? "No orders match" : "No orders yet"}
            text={orders.length ? "Try another status or search." : "When customers check out, their orders appear here."}
          />
        )}
      </Card>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open ? formatOrderId(open.id) : "Order"}
        subtitle={
          open && (
            <span className="inline-flex flex-wrap items-center gap-2">
              Placed {open.date} <Badge tone={orderStatusTone[open.status]}>{open.status}</Badge>
            </span>
          )
        }
        footer={
          open && open.status !== "Cancelled" && open.status !== "Delivered" ? (
            <>
              <Button variant="danger" className="mr-auto" onClick={() => setConfirmCancel(true)}>
                <Ban size={15} /> Cancel order
              </Button>
              {nextLabel[open.status] && (
                <Button variant="primary" onClick={() => changeStatus(open, nextLabel[open.status]!.to)}>
                  <Check size={16} /> {nextLabel[open.status]!.label}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {open && (
          <div className="grid gap-5">
            {/* Progress */}
            {open.status === "Cancelled" ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[#e3dcdb] bg-white p-4 text-[14px] text-taupe">
                <Ban size={18} aria-hidden="true" /> This order was cancelled and its stock was returned.
              </div>
            ) : (
              <ol className="m-0 grid list-none grid-cols-4 gap-2 rounded-2xl border border-[#eadfdc] bg-white p-4" aria-label="Order progress">
                {flow.map((step, index) => {
                  const reached = flow.indexOf(open.status) >= index;
                  return (
                    <li key={step} className="flex flex-col items-center gap-2 text-center">
                      <span
                        className={
                          "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold " +
                          (reached ? "bg-burgundy text-white" : "border border-[#dcd0cd] bg-white text-taupe")
                        }
                        aria-hidden="true"
                      >
                        {reached ? <Check size={15} /> : index + 1}
                      </span>
                      <span className={"text-[12px] " + (reached ? "font-medium text-charcoal" : "text-taupe")}>
                        {step}
                        <span className="sr-only">{reached ? " (done)" : " (not yet)"}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoBlock icon={User} title="Customer">
                <strong className="block">{open.customer || "Guest"}</strong>
                <span className="block break-all">{open.customerEmail || "No email"}</span>
                <span className="block">{open.customerPhone || "No phone"}</span>
              </InfoBlock>
              <InfoBlock icon={MapPin} title="Delivery address">
                <span className="block">{open.shippingAddress.street}</span>
                <span className="block">
                  {open.shippingAddress.city} {open.shippingAddress.zip}
                </span>
              </InfoBlock>
              <InfoBlock icon={CreditCard} title="Payment">
                <strong className="block">{open.paymentMethod ?? "Not recorded"}</strong>
                <span className="block">{open.paymentStatus}</span>
              </InfoBlock>
            </div>

            <Card title="Items" padded={false}>
              <ul className="m-0 list-none p-0">
                {open.items.map((item) => (
                  <li key={`${item.productId}-${item.size ?? ""}-${item.setName ?? ""}`} className="flex items-start justify-between gap-4 border-b border-[#f3ebe8] px-5 py-3.5 last:border-b-0">
                    <span className="min-w-0">
                      <span className="block font-medium text-charcoal">{item.name}</span>
                      <span className="block text-[13px] text-taupe">
                        {item.size ? `Size ${item.size} · ` : ""}
                        {item.qty} × {money(item.price)}
                      </span>
                      {item.setName && <span className="mt-1 inline-block"><Badge tone="neutral" dot={false}>Part of {item.setName}</Badge></span>}
                    </span>
                    <span className="flex-none font-medium [font-variant-numeric:tabular-nums]">{money(item.qty * item.price)}</span>
                  </li>
                ))}
              </ul>
              <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-1.5 border-t border-[#eadfdc] bg-[#fdfaf8] px-5 py-4 text-[14px]">
                {open.subtotal !== undefined && (
                  <>
                    <dt className="text-taupe">Subtotal</dt>
                    <dd className="m-0 text-right">{money(open.subtotal)}</dd>
                  </>
                )}
                {open.discount ? (
                  <>
                    <dt className="text-[#1f6b44]">Set savings</dt>
                    <dd className="m-0 text-right text-[#1f6b44]">−{money(open.discount)}</dd>
                  </>
                ) : null}
                {open.deliveryFee !== undefined && (
                  <>
                    <dt className="text-taupe">Delivery</dt>
                    <dd className="m-0 text-right">{open.deliveryFee === 0 ? "Free" : money(open.deliveryFee)}</dd>
                  </>
                )}
                <dt className="pt-1.5 text-[15px] font-semibold">Total</dt>
                <dd className="m-0 pt-1.5 text-right text-[15px] font-semibold">{money(open.total)}</dd>
              </dl>
            </Card>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmCancel && Boolean(open)}
        title={`Cancel ${open ? formatOrderId(open.id) : "order"}?`}
        text="The items go back into stock. A cancelled order can't be reopened."
        confirmLabel="Cancel order"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          if (open) changeStatus(open, "Cancelled");
          setConfirmCancel(false);
        }}
      />
    </>
  );
}

function InfoBlock({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eadfdc] bg-white p-4 text-[13px] leading-relaxed text-taupe">
      <p className="m-0 mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.8px] text-charcoal">
        <Icon size={14} aria-hidden="true" /> {title}
      </p>
      <div className="[&_strong]:font-medium [&_strong]:text-charcoal">{children}</div>
    </div>
  );
}
