"use client";

import "./admin-layout.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, Tags, Image, Settings, Store, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useStore } from "@/components/store";

const links = [
  { name: "Overview", url: "/admin", icon: LayoutDashboard },
  { name: "Products", url: "/admin/products", icon: Package },
  { name: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", url: "/admin/customers", icon: Users },
  { name: "Categories", url: "/admin/categories", icon: Tags },
  { name: "Content", url: "/admin/content", icon: Image },
  { name: "Settings", url: "/admin/settings", icon: Settings },
  { name: "View Store", url: "/", icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { refreshOrders } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [access, setAccess] = useState<"checking" | "allowed" | "denied" | "error">("checking");
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/account");
            if (active) setAccess("denied");
            return;
          }
          throw new Error(
            typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : "Could not verify admin access.",
          );
        }

        const role =
          typeof payload === "object" &&
          payload !== null &&
          "user" in payload &&
          typeof payload.user === "object" &&
          payload.user !== null &&
          "role" in payload.user
            ? payload.user.role
            : null;
        if (role !== "admin") {
          router.replace("/");
          if (active) setAccess("denied");
          return;
        }

        if (active) setAccess("allowed");
        void refreshOrders().catch((error: unknown) => {
          console.error("Could not preload admin orders:", error);
        });
      } catch (error) {
        if (active) {
          setAccessError(
            error instanceof Error ? error.message : "Could not verify admin access.",
          );
          setAccess("error");
        }
      }
    }

    void verifyAdmin();
    return () => {
      active = false;
    };
  }, [refreshOrders, router]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  async function signOut() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setAccessError("Could not sign out. Please try again.");
        return;
      }
      window.dispatchEvent(new Event("dw-auth-changed"));
      router.replace("/account");
    } catch (error) {
      setAccessError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  }

  if (access === "checking" || access === "denied") {
    return null;
  }
  if (access === "error") {
    return (
      <div className="container py-12" role="alert">
        Admin access could not be verified: {accessError}
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-sidebar menu-open" : "admin-sidebar"}>
        <Link href="/" className="admin-brand">
          <img src="/brand/dirndl-wear-logo1.png" alt="Dirndl Wear" />
        </Link>
        <div className="admin-sidebar-label">ADMIN</div>
        <button
          className="admin-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="admin-navigation" className={menuOpen ? "admin-nav open" : "admin-nav"} aria-label="Admin navigation">
          <div className="admin-nav-header">
            <span>ADMIN MENU</span>
            <button type="button" aria-label="Close admin menu" onClick={() => setMenuOpen(false)}>
              <X size={22} />
            </button>
          </div>
          {links.map(({ name, url, icon: Icon }) => {
            const active = url === "/admin"
              ? pathname === url
              : url === "/"
                ? pathname === url
                : pathname === url || pathname.startsWith(`${url}/`);
            return (
                <Link key={url} href={url} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                <Icon size={18} />
                {name}
              </Link>
            );
          })}
        </nav>
        {menuOpen && <button className="admin-nav-backdrop" type="button" aria-label="Close admin menu" onClick={() => setMenuOpen(false)} />}
      </aside>
      <main className="admin-main">
        <div className="notice">
          Admin session is active.
          <button type="button" className="ml-3 underline" onClick={signOut}>
            Sign out
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}