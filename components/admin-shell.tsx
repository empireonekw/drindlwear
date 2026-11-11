"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Users, Tags, Image, Settings, Store, Menu, X, LogOut } from "lucide-react";

import { useStore } from "./store";

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

/** Admin chrome (sidebar, mobile menu). Access is checked in app/admin/layout.tsx. */
export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useStore();

  async function handleSignOut() {
    await signOut();
    router.replace("/account/login");
    router.refresh();
  }
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="admin-shell [display:grid] [grid-template-columns:minmax(0,_245px)_minmax(0,_1fr)] [min-height:100vh] [background:#fbf5f2] max-[850px]:[grid-template-columns:minmax(0,_1fr)] [align-items:start]">
      <aside className={menuOpen ? "admin-sidebar menu-open [background:#781d2d] [color:white] [padding:30px_18px] [&_h2]:[font:500_25px_var(--font-serif)] [&_h2]:[margin:0_0_40px] [&_a]:[display:flex] [&_a]:[align-items:center] [&_a]:[gap:12px] [&_a]:[padding:14px] [&_a]:[border-radius:5px] [&_a]:[color:#dcd0cd] [&_a]:[font-size:13px] [&_a:hover]:[background:#ffffff20] max-[850px]:[display:flex] max-[850px]:[overflow-x:auto] max-[850px]:[gap:12px] max-[850px]:[padding:10px_16px] max-[850px]:[&_h2]:[display:none] max-[850px]:[&_a]:[white-space:nowrap] [&_h2]:[font-size:20px] motion-safe:[&_a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&_a:hover]:[transform:translateX(3px)] [position:sticky] [top:0] [height:100vh] [overflow-y:auto] [scrollbar-width:none] [min-width:0] [&::-webkit-scrollbar]:[display:none] max-[850px]:[position:static] max-[850px]:[height:auto] max-[850px]:[overflow:visible] max-[850px]:[align-items:center] max-[850px]:[justify-content:space-between]" : "admin-sidebar [background:#781d2d] [color:white] [padding:30px_18px] [&_h2]:[font:500_25px_var(--font-serif)] [&_h2]:[margin:0_0_40px] [&_a]:[display:flex] [&_a]:[align-items:center] [&_a]:[gap:12px] [&_a]:[padding:14px] [&_a]:[border-radius:5px] [&_a]:[color:#dcd0cd] [&_a]:[font-size:13px] [&_a:hover]:[background:#ffffff20] max-[850px]:[display:flex] max-[850px]:[overflow-x:auto] max-[850px]:[gap:12px] max-[850px]:[padding:10px_16px] max-[850px]:[&_h2]:[display:none] max-[850px]:[&_a]:[white-space:nowrap] [&_h2]:[font-size:20px] motion-safe:[&_a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&_a:hover]:[transform:translateX(3px)] [position:sticky] [top:0] [height:100vh] [overflow-y:auto] [scrollbar-width:none] [min-width:0] [&::-webkit-scrollbar]:[display:none] max-[850px]:[position:static] max-[850px]:[height:auto] max-[850px]:[overflow:visible] max-[850px]:[align-items:center] max-[850px]:[justify-content:space-between]"}>
        <Link href="/" className="admin-brand [display:flex] [align-items:center] [justify-content:center] [margin:0_auto_12px] [padding:8px_0] max-[850px]:[width:max-content] max-[850px]:[max-width:100%] max-[850px]:[margin:0] max-[850px]:[padding:0]">
          {/* Reversed (white) logo on solid burgundy, as the brand guide allows. */}
          <img
            src="/brand/dirndl-wear-wordmark-white.png"
            alt="Dirndl Wear"
            width={200}
            height={37}
            className="h-auto w-[200px] max-[850px]:hidden"
          />
          <img
            src="/brand/dirndl-wear-monogram-white.png"
            alt="Dirndl Wear"
            width={66}
            height={40}
            className="hidden h-auto w-[66px] max-[850px]:block"
          />
        </Link>
        <div className="admin-sidebar-label [margin:0_0_22px] [color:#d9b6b6] [font-size:10px] [letter-spacing:2px] [text-align:center] max-[850px]:[margin:0_0_0_auto]">ADMIN</div>
        <button
          className="admin-menu-toggle [display:none] max-[850px]:[display:flex] max-[850px]:[width:42px] max-[850px]:[height:42px] max-[850px]:[flex:0_0_42px] max-[850px]:[align-items:center] max-[850px]:[justify-content:center] max-[850px]:[border:1px_solid_rgb(255_255_255_/_22%)] max-[850px]:[border-radius:50%] max-[850px]:[color:#fff] max-[850px]:[&:not(:disabled):hover]:[transform:none]"
          type="button"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="admin-navigation" className={menuOpen ? "admin-nav open [display:contents] max-[850px]:[position:fixed] max-[850px]:[z-index:1001] max-[850px]:[top:0] max-[850px]:[bottom:0] max-[850px]:[left:0] max-[850px]:[display:flex] max-[850px]:[width:min(90vw,_360px)] max-[850px]:[height:100dvh] max-[850px]:[flex-direction:column] max-[850px]:[gap:4px] max-[850px]:[padding:0_16px_max(16px,_env(safe-area-inset-bottom))] max-[850px]:[overflow-y:auto] max-[850px]:[overscroll-behavior:contain] max-[850px]:[background:#fbf5f2] max-[850px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[850px]:[transform:translateX(-105%)] max-[850px]:[transition:transform_260ms_cubic-bezier(0.22,_1,_0.36,_1)] max-[850px]:[visibility:hidden] max-[850px]:[pointer-events:none] max-[850px]:[&.open]:[transform:translateX(0)] max-[850px]:[&.open]:[visibility:visible] max-[850px]:[&.open]:[pointer-events:auto] max-[850px]:[&_a]:[display:flex] max-[850px]:[&_a]:[min-height:54px] max-[850px]:[&_a]:[flex:0_0_auto] max-[850px]:[&_a]:[align-items:center] max-[850px]:[&_a]:[gap:12px] max-[850px]:[&_a]:[padding:12px_14px] max-[850px]:[&_a]:[border:1px_solid_transparent] max-[850px]:[&_a]:[border-radius:6px] max-[850px]:[&_a]:[color:#211c1d] max-[850px]:[&_a]:[font-size:14px] max-[850px]:[&_a]:[white-space:nowrap] max-[850px]:[&_a[aria-current='page']]:[border-color:#ead9d5] max-[850px]:[&_a[aria-current='page']]:[background:#f5ebe8] max-[850px]:[&_a[aria-current='page']]:[color:#781d2d] max-[850px]:[&_a_svg]:[flex:0_0_auto]" : "admin-nav [display:contents] max-[850px]:[position:fixed] max-[850px]:[z-index:1001] max-[850px]:[top:0] max-[850px]:[bottom:0] max-[850px]:[left:0] max-[850px]:[display:flex] max-[850px]:[width:min(90vw,_360px)] max-[850px]:[height:100dvh] max-[850px]:[flex-direction:column] max-[850px]:[gap:4px] max-[850px]:[padding:0_16px_max(16px,_env(safe-area-inset-bottom))] max-[850px]:[overflow-y:auto] max-[850px]:[overscroll-behavior:contain] max-[850px]:[background:#fbf5f2] max-[850px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[850px]:[transform:translateX(-105%)] max-[850px]:[transition:transform_260ms_cubic-bezier(0.22,_1,_0.36,_1)] max-[850px]:[visibility:hidden] max-[850px]:[pointer-events:none] max-[850px]:[&.open]:[transform:translateX(0)] max-[850px]:[&.open]:[visibility:visible] max-[850px]:[&.open]:[pointer-events:auto] max-[850px]:[&_a]:[display:flex] max-[850px]:[&_a]:[min-height:54px] max-[850px]:[&_a]:[flex:0_0_auto] max-[850px]:[&_a]:[align-items:center] max-[850px]:[&_a]:[gap:12px] max-[850px]:[&_a]:[padding:12px_14px] max-[850px]:[&_a]:[border:1px_solid_transparent] max-[850px]:[&_a]:[border-radius:6px] max-[850px]:[&_a]:[color:#211c1d] max-[850px]:[&_a]:[font-size:14px] max-[850px]:[&_a]:[white-space:nowrap] max-[850px]:[&_a[aria-current='page']]:[border-color:#ead9d5] max-[850px]:[&_a[aria-current='page']]:[background:#f5ebe8] max-[850px]:[&_a[aria-current='page']]:[color:#781d2d] max-[850px]:[&_a_svg]:[flex:0_0_auto]"} aria-label="Admin navigation">
          <div className="admin-nav-header [display:none] max-[850px]:[&_button:not(:disabled):hover]:[transform:none] max-[850px]:[position:sticky] max-[850px]:[top:0] max-[850px]:[z-index:1] max-[850px]:[display:flex] max-[850px]:[min-height:76px] max-[850px]:[align-items:center] max-[850px]:[justify-content:space-between] max-[850px]:[margin:0_-16px_8px] max-[850px]:[padding:0_24px] max-[850px]:[border-bottom:1px_solid_#eee8e5] max-[850px]:[background:#fbf5f2] max-[850px]:[color:#781d2d] max-[850px]:[font-size:11px] max-[850px]:[font-weight:600] max-[850px]:[letter-spacing:2px] max-[850px]:[&_button]:[display:flex] max-[850px]:[&_button]:[width:40px] max-[850px]:[&_button]:[height:40px] max-[850px]:[&_button]:[align-items:center] max-[850px]:[&_button]:[justify-content:center] max-[850px]:[&_button]:[color:#211c1d]">
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
        {menuOpen && <button className="admin-nav-backdrop [display:none] max-[850px]:[position:fixed] max-[850px]:[z-index:1000] max-[850px]:[inset:0] max-[850px]:[display:block] max-[850px]:[width:100%] max-[850px]:[height:100%] max-[850px]:[background:rgb(25_20_21_/_54%)]" type="button" aria-label="Close admin menu" onClick={() => setMenuOpen(false)} />}
      </aside>
      <main className="admin-main [padding:35px] [min-width:0] max-[520px]:[padding:18px] motion-safe:[&>*]:animate-page-enter motion-safe:[&>:nth-child(2)]:[animation-delay:70ms] motion-safe:[&>:nth-child(3)]:[animation-delay:120ms]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#eadfdc] pb-4 text-sm text-[#786565]">
          <span>
            Signed in as <strong className="text-[#211c1d]">{adminName}</strong>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 border border-[#781d2d] px-4 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#781d2d] transition-colors hover:bg-[#781d2d] hover:text-white"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        </div>
        <div className="notice [background:#f6eeec] [border:1px_solid_#e8d2d0] [padding:13px_18px] [font-size:12px] [margin-bottom:20px]">
          Products, orders and settings are still preview data: changes only last in
          this browser (products reset on reload).
        </div>
        {children}
      </main>
    </div>
  );
}