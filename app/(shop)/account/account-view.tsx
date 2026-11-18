"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Heart,
  LayoutGrid,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "@/components/i18n";
import { AuthUser, Order, OrderStatus, useStore } from "@/components/store";
import { roundMoney, type Product } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { formatOrderId } from "@/lib/order";
import { promiseText } from "@/lib/store-policy";

type Tab = "overview" | "orders" | "profile";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "My orders", icon: Package },
  { id: "profile", label: "Personal details", icon: UserRound },
];

const statusStyle: Record<OrderStatus, string> = {
  New: "bg-[#f6eeec] text-burgundy ring-[#ecd6d3]",
  Processing: "bg-[#fdf3e2] text-[#8a5a12] ring-[#f1dfbd]",
  Shipped: "bg-[#eaf0fb] text-[#2f4f8a] ring-[#d3dff3]",
  Delivered: "bg-[#e8f4ec] text-[#1f6b44] ring-[#cde6d6]",
  Cancelled: "bg-[#f1eeee] text-taupe ring-[#e3dddd]",
};

/** The steps an order moves through, for the progress line. */
const steps: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
  { status: "New", label: "Order placed", icon: ShoppingBag },
  { status: "Processing", label: "Being prepared", icon: Package },
  { status: "Shipped", label: "On its way", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: Check },
];

// Fixed formats and time zone so the server and browser render the same text.
const intlLocale: Record<Locale, string> = { de: "de-DE", en: "en-GB" };
const monthYear = (locale: Locale, value: string) =>
  new Intl.DateTimeFormat(intlLocale[locale], { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
const shortMonthYear = (locale: Locale, value: string) =>
  new Intl.DateTimeFormat(intlLocale[locale], { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));

const cardClass = "rounded-2xl border border-[#eee3e0] bg-white shadow-[0_10px_30px_rgb(74_20_32_/_5%)]";
const eyebrowClass = "m-0 text-[11px] font-semibold uppercase tracking-[2px] text-taupe";

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset ${statusStyle[status]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}

function itemCount(order: Order) {
  return order.items.reduce((total, item) => total + item.qty, 0);
}

/** Progress line: placed → prepared → shipped → delivered. */
function OrderProgress({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  if (status === "Cancelled") {
    return (
      <p className="m-0 rounded-xl bg-[#f6f3f3] px-4 py-3 text-[13px] text-taupe">
        {t("This order was cancelled. If you were charged, the amount is refunded to your original payment method.")}
      </p>
    );
  }
  const current = steps.findIndex((step) => step.status === status);
  return (
    <ol className="m-0 grid list-none grid-cols-4 p-0" aria-label={t("Order status: {status}", { status: t(status) })}>
      {steps.map((step, index) => {
        const reached = index <= current;
        const Icon = step.icon;
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-[17px] h-[2px] w-full ${index <= current ? "bg-burgundy" : "bg-[#eadfdc]"}`}
              />
            )}
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white ${
                reached ? "bg-burgundy text-white" : "bg-[#f3ebe9] text-[#b9a7a7]"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className={`mt-2 text-[12px] leading-tight ${reached ? "font-semibold text-charcoal" : "text-taupe"}`}>
              {t(step.label)}
            </span>
            {index === current && <span className="sr-only">{t("(current step)")}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order, products, defaultOpen }: { order: Order; products: Product[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { t, money, date } = useI18n();
  const subtotal = order.subtotal ?? roundMoney(order.items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const thumbs = order.items
    .map((item) => products.find((product) => product.id === item.productId)?.image)
    .filter((image): image is string => Boolean(image))
    .slice(0, 3);
  const detailsId = `order-${order.id}`;

  return (
    <article className={cardClass + " overflow-hidden"}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="flex w-full flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 text-left transition-colors hover:bg-[#fdfaf9] sm:px-6"
      >
        <span className="flex -space-x-3" aria-hidden="true">
          {thumbs.length ? (
            thumbs.map((image, index) => (
              <img key={index} src={image} alt="" className="h-14 w-11 rounded-lg object-cover ring-2 ring-white" />
            ))
          ) : (
            <span className="flex h-14 w-11 items-center justify-center rounded-lg bg-[#f6eeec] text-burgundy">
              <Package size={18} />
            </span>
          )}
        </span>
        <span className="min-w-[140px] flex-1">
          <span className="block font-serif text-[20px] leading-tight text-charcoal">{t("Order {number}", { number: formatOrderId(order.id) })}</span>
          <span className="mt-0.5 block text-[13px] text-taupe">
            {t("Placed {date}", { date: date(order.date) })} · {itemCount(order) === 1 ? t("1 item") : t("{count} items", { count: itemCount(order) })}
          </span>
        </span>
        <StatusBadge status={order.status} />
        <span className="text-right">
          <span className="block text-[11px] uppercase tracking-[1.2px] text-taupe">{t("Total")}</span>
          <span className="block text-[16px] font-semibold text-charcoal [font-variant-numeric:tabular-nums]">{money(order.total)}</span>
        </span>
        <ChevronDown size={20} aria-hidden="true" className={`text-taupe transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={detailsId} className="border-t border-[#f0e6e3] px-5 pb-6 pt-6 sm:px-6">
          <OrderProgress status={order.status} />

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div>
              <h3 className={eyebrowClass}>{t("Items")}</h3>
              <ul className="m-0 mt-3 list-none divide-y divide-[#f0e6e3] p-0">
                {order.items.map((item) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  return (
                    <li key={`${item.productId}-${item.size ?? ""}-${item.setName ?? ""}`} className="flex gap-4 py-4 first:pt-0">
                      {product ? (
                        <Link href={`/product/${product.id}`} className="flex-none">
                          <img src={product.image} alt="" className="h-[84px] w-[66px] rounded-lg object-cover" />
                        </Link>
                      ) : (
                        <span className="flex h-[84px] w-[66px] flex-none items-center justify-center rounded-lg bg-[#f6eeec] text-burgundy">
                          <Package size={18} aria-hidden="true" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        {product ? (
                          <Link href={`/product/${product.id}`} className="font-medium text-charcoal hover:text-burgundy">
                            {item.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-charcoal">{item.name}</span>
                        )}
                        <p className="m-0 mt-1 text-[13px] text-taupe">
                          {[product?.color && t(product.color), item.size && t("Size {size}", { size: item.size }), t("Qty {qty}", { qty: item.qty })].filter(Boolean).join(" · ")}
                        </p>
                        {item.setName && <p className="m-0 mt-1 text-[12px] text-[#1f6b44]">{t("Part of {set}", { set: t(item.setName) })}</p>}
                      </div>
                      <div className="text-right">
                        <p className="m-0 font-medium text-charcoal [font-variant-numeric:tabular-nums]">{money(item.price * item.qty)}</p>
                        {item.qty > 1 && <p className="m-0 mt-1 text-[12px] text-taupe">{t("{amount} each", { amount: money(item.price) })}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid content-start gap-4">
              <section className="rounded-xl bg-[#fbf7f6] p-4">
                <h3 className={eyebrowClass + " flex items-center gap-2"}>
                  <MapPin size={14} aria-hidden="true" /> {t("Shipping to")}
                </h3>
                <p className="m-0 mt-2 text-[14px] leading-relaxed text-charcoal">
                  {order.customer}
                  <br />
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.zip} {order.shippingAddress.city}
                </p>
                {order.customerPhone && <p className="m-0 mt-1 text-[13px] text-taupe">{order.customerPhone}</p>}
              </section>

              <section className="rounded-xl bg-[#fbf7f6] p-4">
                <h3 className={eyebrowClass + " flex items-center gap-2"}>
                  <CreditCard size={14} aria-hidden="true" /> {t("Payment")}
                </h3>
                <p className="m-0 mt-2 text-[14px] text-charcoal">{order.paymentMethod ? t(order.paymentMethod) : "—"}</p>
                <p className="m-0 mt-0.5 text-[13px] text-taupe">{t(order.paymentStatus)}</p>
                <dl className="m-0 mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 border-t border-[#efe4e1] pt-3 text-[14px]">
                  <dt className="text-taupe">{t("Subtotal")}</dt>
                  <dd className="m-0 text-right [font-variant-numeric:tabular-nums]">{money(subtotal)}</dd>
                  {order.discount ? (
                    <>
                      <dt className="text-[#1f6b44]">{t("Set savings")}</dt>
                      <dd className="m-0 text-right text-[#1f6b44] [font-variant-numeric:tabular-nums]">−{money(order.discount)}</dd>
                    </>
                  ) : null}
                  <dt className="text-taupe">{t("Shipping")}</dt>
                  <dd className="m-0 text-right [font-variant-numeric:tabular-nums]">
                    {order.deliveryFee === undefined ? t("To be confirmed") : money(order.deliveryFee)}
                  </dd>
                  <dt className="pt-1.5 font-semibold text-charcoal">{t("Total")}</dt>
                  <dd className="m-0 pt-1.5 text-right font-semibold [font-variant-numeric:tabular-nums]">{money(order.total)}</dd>
                </dl>
              </section>

              <Link
                href="/pages/contact"
                className="flex items-center justify-between rounded-xl border border-[#eadfdc] px-4 py-3 text-[14px] text-charcoal transition-colors hover:border-burgundy hover:text-burgundy"
              >
                <span className="flex items-center gap-2">
                  <LifeBuoy size={16} aria-hidden="true" /> {t("Need help with this order?")}
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function EmptyOrders({ email }: { email: string }) {
  const { t } = useI18n();
  return (
    <div className={cardClass + " flex flex-col items-center px-6 py-14 text-center"}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eeec] text-burgundy">
        <ShoppingBag size={24} aria-hidden="true" />
      </span>
      <h3 className="m-0 mt-5 font-serif text-[26px] font-normal text-charcoal">{t("No orders yet")}</h3>
      <p className="m-0 mt-2 max-w-[360px] text-[14px] leading-relaxed text-taupe">
        {t("When you place an order with {email}, you'll be able to follow it here, from checkout to your door.", { email })}
      </p>
      <Link
        href="/collections/all"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-burgundy px-6 py-3 text-[12px] font-semibold uppercase tracking-[1.5px] text-white transition-colors hover:bg-burgundy-dark"
      >
        {t("Start shopping")} <ChevronRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className={cardClass + " p-5"}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6eeec] text-burgundy">
        <Icon size={19} aria-hidden="true" />
      </span>
      <p className="m-0 mt-4 text-[13px] text-taupe">{label}</p>
      <p className="m-0 mt-1 text-[22px] font-semibold text-charcoal [font-variant-numeric:tabular-nums]">{value}</p>
      {hint && <p className="m-0 mt-1 text-[12px] text-taupe">{hint}</p>}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f6eeec] text-burgundy">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[12px] uppercase tracking-[1.2px] text-taupe">{label}</dt>
        <dd className="m-0 mt-1 break-words text-[15px] text-charcoal">{value}</dd>
      </div>
    </div>
  );
}

/**
 * The account page itself. page.tsx has already checked the session on the
 * server and passes the user in, so there is nothing to wait for here.
 */
export function AccountView({ initialUser }: { initialUser: AuthUser }) {
  const router = useRouter();
  const { user: storeUser, authReady, orders, products, wishlist, signOut } = useStore();
  const [signingOut, setSigningOut] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const i18n = useI18n();
  const { t, money, locale } = i18n;
  const promises = promiseText(i18n);
  // Until the store's own session check finishes, use the user the server found.
  const user = authReady ? storeUser : (storeUser ?? initialUser);

  // The session ended while the page was open (signed out in another tab).
  useEffect(() => {
    if (authReady && !storeUser && !signingOut) router.replace("/account/register");
  }, [authReady, storeUser, signingOut, router]);

  // Open the tab named in the address (#orders, #profile), and keep it there.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (tabs.some((entry) => entry.id === hash)) setTab(hash as Tab);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  if (!user) return null;

  function openTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", next === "overview" ? window.location.pathname : `#${next}`);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  }

  // Orders are still kept in this browser; show the ones placed with this email.
  const myOrders = orders.filter((order) => order.customerEmail.trim().toLowerCase() === user.email);
  const activeOrders = myOrders.filter((order) => order.status !== "Delivered" && order.status !== "Cancelled");
  const spent = roundMoney(
    myOrders.filter((order) => order.status !== "Cancelled").reduce((total, order) => total + order.total, 0),
  );
  const lastAddress = myOrders[0]?.shippingAddress;
  const firstName = user.name.split(" ")[0] || user.name;
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const memberSince = monthYear(locale, user.createdAt);

  return (
    <div className="bg-[#fbf5f2]">
      <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-8 sm:px-8">
        <nav aria-label={t("Breadcrumb")} className="text-[13px] text-taupe">
          <Link href="/" className="hover:text-burgundy">{t("Home")}</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span className="text-charcoal">{t("My account")}</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={eyebrowClass}>{t("My account")}</p>
            <h1 className="m-0 mt-1 font-serif text-[clamp(34px,4vw,48px)] font-normal leading-tight text-charcoal">
              {t("Hello, {name}", { name: firstName })}
            </h1>
            <p className="m-0 mt-1 text-[14px] text-taupe">{t("Manage your orders and personal details in one place.")}</p>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start">
          {/* Sidebar: who's signed in, and the sections */}
          <aside className={cardClass + " min-w-0 p-3 lg:sticky lg:top-28"}>
            <div className="flex items-center gap-3 border-b border-[#f0e6e3] px-3 pb-4 pt-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-burgundy font-serif text-[18px] tracking-wider text-white"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate font-medium text-charcoal">{user.name}</p>
                <p className="m-0 truncate text-[13px] text-taupe">{user.email}</p>
              </div>
            </div>
            <nav aria-label={t("Account sections")} className="mt-2 flex gap-1 overflow-x-auto lg:flex-col">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openTab(id)}
                  aria-current={tab === id ? "page" : undefined}
                  className={`flex flex-none items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
                    tab === id ? "bg-[#f6eeec] font-semibold text-burgundy" : "text-charcoal hover:bg-[#fbf7f6]"
                  }`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="flex-1">{t(label)}</span>
                  {id === "orders" && myOrders.length > 0 && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-burgundy ring-1 ring-[#ecd6d3]">
                      {myOrders.length}
                    </span>
                  )}
                </button>
              ))}
              <Link href="/wishlist" className="flex flex-none items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-[14px] text-charcoal transition-colors hover:bg-[#fbf7f6]">
                <Heart size={17} aria-hidden="true" />
                <span className="flex-1">{t("Wishlist")}</span>
                {wishlist.length > 0 && <span className="text-[12px] text-taupe">{wishlist.length}</span>}
              </Link>
              <Link href="/pages/contact" className="flex flex-none items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-[14px] text-charcoal transition-colors hover:bg-[#fbf7f6]">
                <LifeBuoy size={17} aria-hidden="true" />
                <span className="flex-1">{t("Help & contact")}</span>
              </Link>
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-[#f0e6e3] px-3 pb-2 pt-4 text-left text-[14px] text-taupe transition-colors hover:text-burgundy disabled:opacity-60"
            >
              {signingOut ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <LogOut size={17} aria-hidden="true" />}
              {signingOut ? t("Signing out…") : t("Sign out")}
            </button>
          </aside>

          <div className="min-w-0">
            {tab === "overview" && (
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <StatCard icon={Package} label={t("Orders")} value={String(myOrders.length)} hint={activeOrders.length ? t("{count} in progress", { count: activeOrders.length }) : t("None in progress")} />
                  <StatCard icon={Wallet} label={t("Total spent")} value={money(spent)} hint={t("Excludes cancelled orders")} />
                  <StatCard icon={Heart} label={t("Wishlist")} value={String(wishlist.length)} hint={wishlist.length === 1 ? t("Saved item") : t("Saved items")} />
                  <StatCard icon={CalendarDays} label={t("Member since")} value={shortMonthYear(locale, user.createdAt)} hint={t("Thank you for being with us")} />
                </div>

                <section>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="m-0 font-serif text-[26px] font-normal text-charcoal">{t("Recent order")}</h2>
                    {myOrders.length > 1 && (
                      <button type="button" onClick={() => openTab("orders")} className="text-[13px] font-medium text-burgundy hover:underline">
                        {t("View all {count} orders", { count: myOrders.length })}
                      </button>
                    )}
                  </div>
                  {myOrders[0] ? (
                    <OrderCard order={myOrders[0]} products={products} defaultOpen />
                  ) : (
                    <EmptyOrders email={user.email} />
                  )}
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <section className={cardClass + " p-5"}>
                    <div className="flex items-center justify-between">
                      <h2 className="m-0 font-serif text-[22px] font-normal text-charcoal">{t("Personal details")}</h2>
                      <button type="button" onClick={() => openTab("profile")} className="text-[13px] font-medium text-burgundy hover:underline">
                        {t("View")}
                      </button>
                    </div>
                    <p className="m-0 mt-3 text-[14px] text-charcoal">{user.name}</p>
                    <p className="m-0 mt-1 text-[14px] text-taupe">{user.email}</p>
                    {user.phone && <p className="m-0 mt-1 text-[14px] text-taupe">{user.phone}</p>}
                  </section>
                  <section className={cardClass + " p-5"}>
                    <h2 className="m-0 font-serif text-[22px] font-normal text-charcoal">{t("Shopping with us")}</h2>
                    <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[14px] text-charcoal">
                      <li className="flex items-center gap-2"><Truck size={16} className="text-burgundy" aria-hidden="true" /> {promises.deliveryTime}</li>
                      <li className="flex items-center gap-2"><Package size={16} className="text-burgundy" aria-hidden="true" /> {promises.exchange}</li>
                      <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-burgundy" aria-hidden="true" /> {t("Secure, private account")}</li>
                    </ul>
                  </section>
                </div>
              </div>
            )}

            {tab === "orders" && (
              <section>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="m-0 font-serif text-[30px] font-normal text-charcoal">{t("My orders")}</h2>
                  {myOrders.length > 0 && (
                    <p className="m-0 text-[13px] text-taupe">
                      {myOrders.length === 1 ? t("1 order") : t("{count} orders", { count: myOrders.length })} · {t("{count} in progress", { count: activeOrders.length })}
                    </p>
                  )}
                </div>
                {myOrders.length === 0 ? (
                  <EmptyOrders email={user.email} />
                ) : (
                  <div className="grid gap-4">
                    {myOrders.map((order, index) => (
                      <OrderCard key={order.id} order={order} products={products} defaultOpen={index === 0} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === "profile" && (
              <div className="grid gap-6">
                <section className={cardClass + " p-6"}>
                  <h2 className="m-0 font-serif text-[30px] font-normal text-charcoal">{t("Personal details")}</h2>
                  <p className="m-0 mt-1 text-[14px] text-taupe">{t("The details we use for your orders and messages.")}</p>
                  <dl className="m-0 mt-4 grid divide-y divide-[#f0e6e3] sm:grid-cols-2 sm:divide-y-0 sm:[&>div]:border-b sm:[&>div]:border-[#f0e6e3]">
                    <DetailRow icon={UserRound} label={t("Full name")} value={user.name} />
                    <DetailRow icon={Mail} label={t("Email address")} value={user.email} />
                    <DetailRow icon={Phone} label={t("Phone number")} value={user.phone ?? <span className="text-taupe">{t("Not added")}</span>} />
                    <DetailRow icon={CalendarDays} label={t("Member since")} value={memberSince} />
                  </dl>
                  <p className="m-0 mt-5 text-[13px] text-taupe">
                    {t("Need to change your name, email or phone number?")}{" "}
                    <Link href="/pages/contact" className="font-medium text-burgundy hover:underline">{t("Contact us")}</Link> {t("and we'll update it for you.")}
                  </p>
                </section>

                <section className={cardClass + " p-6"}>
                  <h2 className="m-0 font-serif text-[24px] font-normal text-charcoal">{t("Shipping address")}</h2>
                  {lastAddress ? (
                    <div className="mt-4 flex items-start gap-4 rounded-xl bg-[#fbf7f6] p-4">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-burgundy">
                        <MapPin size={16} aria-hidden="true" />
                      </span>
                      <p className="m-0 text-[15px] leading-relaxed text-charcoal">
                        {lastAddress.street}
                        <br />
                        {lastAddress.zip} {lastAddress.city}
                        <span className="mt-1 block text-[12px] text-taupe">{t("Used on your most recent order")}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="m-0 mt-3 text-[14px] text-taupe">
                      {t("No address yet. The address from your first order will appear here.")}
                    </p>
                  )}
                </section>

                <section className={cardClass + " flex flex-wrap items-center justify-between gap-4 p-6"}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f6eeec] text-burgundy">
                      <ShieldCheck size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="m-0 text-[15px] font-semibold text-charcoal">{t("Sign-in & security")}</h2>
                      <p className="m-0 mt-1 text-[13px] text-taupe">{t("Your password is stored encrypted. Sign out on shared devices.")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="inline-flex items-center gap-2 rounded-full border border-burgundy px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-burgundy transition-colors hover:bg-burgundy hover:text-white disabled:opacity-60"
                  >
                    {signingOut ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <LogOut size={15} aria-hidden="true" />}
                    {signingOut ? t("Signing out…") : t("Sign out")}
                  </button>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
