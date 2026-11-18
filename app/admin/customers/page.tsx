"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, ShieldCheck, Users } from "lucide-react";

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
  StatCard,
  tableClass,
  tdClass,
  thClass,
  useToast,
} from "@/components/admin/ui";
import { Order, useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";
import type { AdminAccount } from "@/app/api/admin/customers/route";

/**
 * Customers: every account registered in the store (MongoDB), most recently
 * signed-in first, plus guests who ordered without an account. Orders are
 * still kept in this browser, so order counts only cover orders placed here.
 */

type Customer = {
  key: string;
  /** Missing for guests who ordered without an account. */
  account?: AdminAccount;
  name: string;
  email: string;
  phone: string;
  orders: Order[];
  spent: number;
};

type RoleChange = { account: AdminAccount; action: "make-admin" | "remove-admin" };

/** The list refreshes on its own this often, and whenever the tab is shown again. */
const REFRESH_MS = 30_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** "Just now", "12 min ago", "3 h ago", "Yesterday, 14:05", or a date. */
function whenAgo(iso: string | null) {
  if (!iso) return "Never";
  const at = new Date(iso);
  const minutes = Math.floor((Date.now() - at.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  if (minutes < 48 * 60) return `Yesterday, ${timeFormat.format(at)}`;
  return dateFormat.format(at);
}

async function changeRole(id: string, action: RoleChange["action"]) {
  let response: Response;
  try {
    response = await fetch(`/api/admin/customers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (response.status === 403) throw new Error("Your admin session has ended. Sign in again.");
  if (!response.ok) throw new Error(data.error ?? "The role could not be changed.");
}

export default function Customers() {
  const { orders } = useStore();
  const toast = useToast();
  const [accounts, setAccounts] = useState<AdminAccount[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  // ?q= (e.g. from the Messages inbox) fills in the search.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pending, setPending] = useState<RoleChange | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { accounts?: AdminAccount[]; error?: string };
      if (!response.ok || !data.accounts) throw new Error(data.error ?? "Could not load customers.");
      setAccounts(data.accounts);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load customers.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load now, every 30 seconds, and when the admin comes back to this tab,
  // so new sign-ups and sign-ins show up without reloading the page.
  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const customers = useMemo(() => {
    const byEmail = new Map<string, Customer>();
    for (const account of accounts ?? []) {
      byEmail.set(account.email, {
        key: account.id,
        account,
        name: account.name,
        email: account.email,
        phone: account.phone ?? "",
        orders: [],
        spent: 0,
      });
    }
    for (const order of orders) {
      const email = order.customerEmail.trim().toLowerCase();
      const key = email || order.customer;
      const customer = byEmail.get(key) ?? {
        key: `guest:${key}`,
        name: order.customer || "Guest",
        email: order.customerEmail,
        phone: order.customerPhone,
        orders: [],
        spent: 0,
      };
      customer.orders.push(order);
      if (order.status !== "Cancelled") customer.spent += order.total;
      byEmail.set(key, customer);
    }
    // Accounts in sign-in order (as the server sent them), then guests.
    return [...byEmail.values()];
  }, [accounts, orders]);

  const term = query.trim().toLowerCase();
  const visible = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(term),
  );
  const open = customers.find((customer) => customer.key === openKey);

  const accountList = accounts ?? [];
  const admins = accountList.filter((account) => account.role === "admin").length;
  const activeThisWeek = accountList.filter(
    (account) => account.lastLoginAt && Date.now() - new Date(account.lastLoginAt).getTime() < WEEK_MS,
  ).length;

  async function confirmRoleChange() {
    if (!pending || busy) return;
    const { account, action } = pending;
    setBusy(true);
    try {
      await changeRole(account.id, action);
      const role = action === "make-admin" ? "admin" : "customer";
      setAccounts((current) => current?.map((entry) => (entry.id === account.id ? { ...entry, role } : entry)) ?? current);
      toast(action === "make-admin" ? `${account.name} is now an admin.` : `${account.name} is now a customer.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "The role could not be changed.", "error");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  /** The Make admin / Remove admin button for one account. */
  function roleButton(account: AdminAccount, size: "sm" | "md" = "sm") {
    if (account.isYou) return <span className="text-[12px] text-taupe">That&apos;s you</span>;
    const makeAdmin = account.role !== "admin";
    return (
      <Button
        size={size}
        variant={makeAdmin ? "secondary" : "ghost"}
        onClick={(event) => {
          event.stopPropagation();
          setPending({ account, action: makeAdmin ? "make-admin" : "remove-admin" });
        }}
      >
        {makeAdmin ? "Make admin" : "Remove admin"}
      </Button>
    );
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone with an account, most recent sign-in first. New sign-ups and sign-ins appear here on their own."
        actions={
          <Button onClick={load} disabled={refreshing}>
            <RefreshCw size={15} aria-hidden="true" className={refreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Accounts" value={accounts ? accountList.length : "…"} />
        <StatCard
          icon={Activity}
          label="Signed in this week"
          value={accounts ? activeThisWeek : "…"}
          hint={accountList.length ? `${Math.round((activeThisWeek / accountList.length) * 100)}% of accounts` : undefined}
          tone="green"
        />
        <StatCard icon={ShieldCheck} label="Admins" value={accounts ? admins : "…"} tone="amber" />
      </div>

      {loadError && (
        <p role="alert" className="mb-4 rounded-xl border border-[#f1c9c9] bg-[#fdf3f3] px-4 py-3 text-[14px] text-[#9b2c2c]">
          {loadError}
        </p>
      )}

      <Card padded={false}>
        <div className="border-b border-[#f1e8e5] p-4">
          <SearchInput label="Search customers" placeholder="Search by name, email or phone" value={query} onChange={setQuery} />
        </div>
        {visible.length ? (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Role</th>
                  <th className={thClass}>Last sign-in</th>
                  <th className={thClass}>Joined</th>
                  <th className={thClass}>Orders</th>
                  <th className={thClass}>Spent</th>
                  <th className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.key} onClick={() => setOpenKey(customer.key)} className="cursor-pointer transition-colors hover:bg-[#fdfaf8]">
                    <td className={tdClass}>
                      <button type="button" onClick={() => setOpenKey(customer.key)} className="flex items-center gap-3 text-left">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f6eeec] text-[12px] font-semibold text-burgundy" aria-hidden="true">
                          {initials(customer.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium hover:text-burgundy">{customer.name}</span>
                          <span className="block text-[12px] text-taupe">{customer.email || "No email"}</span>
                        </span>
                      </button>
                    </td>
                    <td className={tdClass}>
                      {!customer.account ? (
                        <Badge tone="grey">Guest</Badge>
                      ) : customer.account.role === "admin" ? (
                        <Badge tone="burgundy">Admin</Badge>
                      ) : (
                        <Badge tone="neutral">Customer</Badge>
                      )}
                    </td>
                    <td className={tdClass + " whitespace-nowrap text-taupe"}>
                      {customer.account ? whenAgo(customer.account.lastLoginAt) : "—"}
                    </td>
                    <td className={tdClass + " whitespace-nowrap text-taupe"}>
                      {customer.account ? dateFormat.format(new Date(customer.account.createdAt)) : "—"}
                    </td>
                    <td className={tdClass}>{customer.orders.length}</td>
                    <td className={tdClass + " font-medium [font-variant-numeric:tabular-nums]"}>{money(customer.spent)}</td>
                    <td className={tdClass + " text-right"}>{customer.account && roleButton(customer.account)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={!accounts && !loadError ? "Loading customers…" : customers.length ? "No customers match" : "No customers yet"}
            text={customers.length ? "Try another search." : "Accounts appear here as soon as someone signs up."}
          />
        )}
      </Card>

      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenKey(null)}
        title={open?.name ?? "Customer"}
        subtitle={open && `${open.email}${open.phone ? ` · ${open.phone}` : ""}`}
      >
        {open && (
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Role", open.account ? (open.account.role === "admin" ? "Admin" : "Customer") : "Guest"],
                ["Last sign-in", open.account ? whenAgo(open.account.lastLoginAt) : "—"],
                ["Orders", String(open.orders.length)],
                ["Spent", money(open.spent)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#eadfdc] bg-white p-4">
                  <p className="m-0 text-[12px] text-taupe">{label}</p>
                  <p className="m-0 mt-1 truncate text-[16px] font-semibold">{value}</p>
                </div>
              ))}
            </div>

            {open.account && (
              <Card title="Access">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="m-0 max-w-[340px] text-[14px] text-taupe">
                    {open.account.role === "admin"
                      ? "Can open this dashboard, edit products and orders, and change other people's roles."
                      : "Can shop and see their own account. Make them an admin to give them this dashboard."}
                  </p>
                  {roleButton(open.account, "md")}
                </div>
              </Card>
            )}

            <Card title="Order history" padded={false}>
              {open.orders.length ? (
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
              ) : (
                <p className="m-0 px-5 py-4 text-[14px] text-taupe">No orders placed in this browser yet.</p>
              )}
            </Card>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === "make-admin" ? `Make ${pending.account.name} an admin?` : `Remove ${pending?.account.name ?? ""} as admin?`}
        text={
          pending?.action === "make-admin"
            ? `${pending.account.email} will be able to open this dashboard, change products and orders, see every customer, and make or remove other admins.`
            : `${pending?.account.email ?? ""} will become a regular customer and lose access to this dashboard on their next page load.`
        }
        confirmLabel={busy ? "Saving…" : pending?.action === "make-admin" ? "Make admin" : "Remove admin"}
        onConfirm={confirmRoleChange}
        onCancel={() => !busy && setPending(null)}
      />
    </>
  );
}
