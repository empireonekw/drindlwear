"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { ToastProvider } from "./admin/ui";
import { useStore } from "./store";

type NavLink = { name: string; url: string; icon: LucideIcon; count?: number };

/** Admin chrome: burgundy sidebar, top bar and toasts. Access is checked in app/admin/layout.tsx. */
export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, orders, products } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const newOrders = orders.filter((order) => order.status === "New").length;
  const lowStock = products.filter((product) => product.stock <= 3).length;

  const groups: { title?: string; links: NavLink[] }[] = [
    { links: [{ name: "Overview", url: "/admin", icon: LayoutDashboard }] },
    {
      title: "Catalogue",
      links: [
        { name: "Products", url: "/admin/products", icon: Package, count: lowStock || undefined },
        { name: "Categories", url: "/admin/categories", icon: Tags },
      ],
    },
    {
      title: "Sales",
      links: [
        { name: "Orders", url: "/admin/orders", icon: ShoppingCart, count: newOrders || undefined },
        { name: "Customers", url: "/admin/customers", icon: Users },
      ],
    },
    {
      title: "Store",
      links: [
        { name: "Homepage", url: "/admin/content", icon: ImageIcon },
        { name: "Settings", url: "/admin/settings", icon: Settings },
        { name: "System", url: "/admin/system", icon: Activity },
      ],
    },
  ];
  const allLinks = groups.flatMap((group) => group.links);
  const isActive = (url: string) => (url === "/admin" ? pathname === url : pathname === url || pathname.startsWith(`${url}/`));
  const current = allLinks.find((link) => isActive(link.url))?.name ?? "Admin";

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    await signOut();
    router.replace("/account/login");
    router.refresh();
  }

  const initials = adminName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <Link href="/admin" aria-label="Dirndl Wear admin home">
          {/* Reversed (white) logo on solid burgundy, as the brand guide allows. */}
          <img src="/brand/dirndl-wear-wordmark-white.png" alt="Dirndl Wear" width={190} height={35} className="h-auto w-[190px]" />
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>
      <p className="m-0 px-6 pb-4 text-[11px] font-semibold uppercase tracking-[2px] text-[#d9b6b6]">Admin</p>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, index) => (
          <div key={group.title ?? index} className="mb-4">
            {group.title && (
              <p className="m-0 px-3 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-[1.4px] text-white/55">{group.title}</p>
            )}
            {group.links.map(({ name, url, icon: Icon, count }) => {
              const active = isActive(url);
              return (
                <Link
                  key={url}
                  href={url}
                  aria-current={active ? "page" : undefined}
                  className={
                    "group relative mb-0.5 flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors " +
                    (active ? "bg-white text-burgundy shadow-[0_6px_16px_rgb(0_0_0_/_12%)]" : "text-white/85 hover:bg-white/10 hover:text-white")
                  }
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span className="flex-1">{name}</span>
                  {count !== undefined && (
                    <span
                      className={
                        "min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-[20px] " +
                        (active ? "bg-burgundy text-white" : "bg-white/20 text-white")
                      }
                      aria-label={`${count} need attention`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/15 px-4 py-4">
        <Link
          href="/"
          className="mb-3 flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={17} strokeWidth={1.8} aria-hidden="true" />
          View store
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-[13px] font-semibold text-burgundy" aria-hidden="true">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[13px] font-medium text-white">{adminName}</p>
            <p className="m-0 text-[11px] text-white/60">Administrator</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={handleSignOut}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#fbf5f2] lg:pl-[264px]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] bg-burgundy lg:block">{sidebar}</aside>

        {/* Mobile sidebar */}
        <div className={"fixed inset-0 z-[70] lg:hidden " + (menuOpen ? "visible" : "invisible [transition:visibility_0s_300ms]")}>
          <div
            onClick={() => setMenuOpen(false)}
            className={"absolute inset-0 bg-[rgb(33_28_29_/_45%)] transition-opacity duration-300 " + (menuOpen ? "opacity-100" : "opacity-0")}
          />
          <aside
            className={
              "absolute inset-y-0 left-0 w-[min(86vw,300px)] bg-burgundy shadow-[20px_0_50px_rgb(33_28_29_/_25%)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
              (menuOpen ? "translate-x-0" : "-translate-x-full")
            }
          >
            {sidebar}
          </aside>
        </div>

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#eadfdc] bg-[#fbf5f2]/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-charcoal hover:bg-[#f1ecea] lg:hidden"
          >
            <Menu size={21} />
          </button>
          <p className="m-0 min-w-0 flex-1 truncate text-[14px] text-taupe">
            Admin <span className="mx-1.5 text-[#cdbdb9]">/</span>
            <span className="font-medium text-charcoal">{current}</span>
          </p>
          <span
            title="Products, orders and settings are preview data kept in this browser. Uploaded photos are saved in MongoDB."
            className="hidden items-center gap-2 rounded-full border border-[#e8d2d0] bg-white px-3 py-1.5 text-[12px] text-taupe sm:inline-flex"
          >
            <span className="h-2 w-2 rounded-full bg-[#d39b4a]" aria-hidden="true" />
            Preview data
          </span>
          <Link
            href="/"
            className="hidden h-10 items-center gap-2 rounded-xl border border-[#dcd0cd] bg-white px-3.5 text-[13px] font-medium text-charcoal transition-colors hover:border-burgundy hover:text-burgundy md:inline-flex"
          >
            <ExternalLink size={15} aria-hidden="true" />
            View store
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
