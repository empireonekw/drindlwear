"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Facebook,
  Heart,
  Instagram,
  Menu,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  X,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import { useStore } from "./store";
export function Header() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const { items, wishlist } = useStore();
  const cartCount = items.reduce((total, item) => total + item.qty, 0);

  useEffect(() => {
    if (!menu) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);

  return (
    <>
      <div
        className={menu ? "announcement menu-active [text-align:center] [background:#781d2d] [color:#fff] [font-size:10px] [letter-spacing:2px] [padding:11px] max-[850px]:[overflow:hidden] max-[850px]:[padding:9px_10px] max-[850px]:[font-size:8px] max-[850px]:[letter-spacing:1px] max-[850px]:[line-height:18px] max-[850px]:[white-space:nowrap] max-[850px]:[&.menu-active]:[display:none]" : "announcement [text-align:center] [background:#781d2d] [color:#fff] [font-size:10px] [letter-spacing:2px] [padding:11px] max-[850px]:[overflow:hidden] max-[850px]:[padding:9px_10px] max-[850px]:[font-size:8px] max-[850px]:[letter-spacing:1px] max-[850px]:[line-height:18px] max-[850px]:[white-space:nowrap] max-[850px]:[&.menu-active]:[display:none]"}
        aria-hidden={menu}
      >
        FREE SHIPPING ON ORDERS OVER PKR 2,000 &nbsp; • &nbsp; EXPLORE NEW ARRIVALS
      </div>
      <header className={menu ? "header menu-open [background:#fffaf8] [position:sticky] [top:0] [z-index:40] [border-bottom:1px_solid_#eee] max-[850px]:[&.menu-open]:[z-index:60]" : "header [background:#fffaf8] [position:sticky] [top:0] [z-index:40] [border-bottom:1px_solid_#eee] max-[850px]:[&.menu-open]:[z-index:60]"}>
        <div className="header-top [height:76px] [max-width:none] [margin:auto] [display:flex] [align-items:center] [justify-content:space-between] [padding:0_5%] max-[850px]:[height:75px] max-[850px]:[display:grid] max-[850px]:[grid-template-columns:minmax(36px,_1fr)_auto_minmax(0,_1fr)] max-[850px]:[gap:8px] max-[850px]:[padding:0_16px] max-[850px]:[&_>_.mobile]:[display:flex] max-[850px]:[&_>_.mobile]:[align-items:center] max-[850px]:[&_>_.mobile]:[justify-content:center] max-[850px]:[&_>_.mobile]:[width:36px] max-[850px]:[&_>_.mobile]:[height:40px] max-[850px]:[&_>_.mobile]:[justify-self:start] max-[850px]:[&_>_.logo]:[justify-self:center] max-[430px]:[grid-template-columns:minmax(32px,_1fr)_auto_minmax(0,_1fr)] max-[430px]:[gap:4px] max-[430px]:[padding:0_10px]">
          <button
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="primary-navigation"
            onClick={() => setMenu(!menu)}
            className="mobile [display:none] max-[850px]:[display:block]"
          >
            {menu ? <X /> : <Menu />}
          </button>
          <Link className="logo [font-family:Georgia,serif] [font-size:35px] [letter-spacing:4px] [font-weight:bold] [line-height:normal] [&_span]:[display:block] [&_span]:[text-align:center] [&_span]:[font:10px_Arial] [&_span]:[letter-spacing:8px] [&_span]:[margin-top:10px] max-[850px]:[font-size:24px] max-[850px]:[&_span]:[font-size:8px] max-[850px]:[&_span]:[letter-spacing:5px] [display:flex] [align-items:center]" href="/">
            <img
              src="/brand/dirndl-wear-logo1.png"
              alt="Dirndl Wear — Traditional Dresses"
              className="brand-logo [width:150px] [height:58px] [object-fit:contain] [object-position:left_center] max-[850px]:[width:120px] max-[850px]:[height:55px] max-[430px]:[width:105px]"
            />
          </Link>
          <div className="header-actions [display:flex] [gap:21px] [align-items:center] [&_a]:[position:relative] [&_small]:[position:absolute] [&_small]:[top:-8px] [&_small]:[right:-8px] [&_small]:[background:#eee] [&_small]:[border-radius:50%] [&_small]:[font-size:10px] [&_small]:[padding:2px_5px] max-[850px]:[gap:clamp(8px,_2vw,_14px)] max-[850px]:[&_svg]:[width:19px] max-[520px]:[&_a[aria-label='Konto']]:[display:none] max-[850px]:[justify-self:end] max-[850px]:[&_a]:[display:flex] max-[850px]:[&_a]:[flex:0_0_24px] max-[850px]:[&_a]:[align-items:center] max-[850px]:[&_a]:[justify-content:center] max-[850px]:[&_a]:[height:40px] max-[850px]:[&_button]:[display:flex] max-[850px]:[&_button]:[flex:0_0_24px] max-[850px]:[&_button]:[align-items:center] max-[850px]:[&_button]:[justify-content:center] max-[850px]:[&_button]:[height:40px] max-[430px]:[gap:5px] max-[430px]:[&_svg]:[width:18px] motion-safe:[&_a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&_a:hover]:[transform:scale(1.08)] motion-safe:[&_button:hover]:[transform:scale(1.08)]">
            <button aria-label="Search" onClick={() => setSearch(!search)}>
              <Search />
            </button>
            <Link aria-label="Account" href="/account">
              <UserRound />
            </Link>
            <Link aria-label="Wishlist" href="/wishlist">
              <Heart />
              <small>{wishlist.length}</small>
            </Link>
            <Link aria-label="Cart" href="/cart">
              <ShoppingBag />
              <small>{cartCount}</small>
            </Link>
          </div>
        </div>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={menu ? "nav open [display:flex] [justify-content:center] [gap:32px] [height:44px] [align-items:center] max-[850px]:[display:none] max-[850px]:[position:fixed] max-[850px]:[top:0] max-[850px]:[left:0] max-[850px]:[right:auto] max-[850px]:[height:100dvh] max-[850px]:[background:#fff] max-[850px]:[padding:0_0_max(16px,_env(safe-area-inset-bottom))] max-[850px]:[flex-direction:column] max-[850px]:[align-items:stretch] max-[850px]:[gap:0] max-[850px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[850px]:[&.open]:[display:flex] max-[850px]:[z-index:62] max-[850px]:[bottom:0] max-[850px]:[width:min(90vw,_560px)] max-[850px]:[max-height:none] max-[850px]:[overflow-y:auto] max-[850px]:[overscroll-behavior:contain] max-[850px]:[justify-content:flex-start] max-[850px]:[&_.dropdown]:[display:none]" : "nav [display:flex] [justify-content:center] [gap:32px] [height:44px] [align-items:center] max-[850px]:[display:none] max-[850px]:[position:fixed] max-[850px]:[top:0] max-[850px]:[left:0] max-[850px]:[right:auto] max-[850px]:[height:100dvh] max-[850px]:[background:#fff] max-[850px]:[padding:0_0_max(16px,_env(safe-area-inset-bottom))] max-[850px]:[flex-direction:column] max-[850px]:[align-items:stretch] max-[850px]:[gap:0] max-[850px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[850px]:[&.open]:[display:flex] max-[850px]:[z-index:62] max-[850px]:[bottom:0] max-[850px]:[width:min(90vw,_560px)] max-[850px]:[max-height:none] max-[850px]:[overflow-y:auto] max-[850px]:[overscroll-behavior:contain] max-[850px]:[justify-content:flex-start] max-[850px]:[&_.dropdown]:[display:none]"}
        >
          <div className="mobile-menu-header [display:none] max-[850px]:[position:sticky] max-[850px]:[top:0] max-[850px]:[z-index:1] max-[850px]:[isolation:isolate] max-[850px]:[display:grid] max-[850px]:[flex:0_0_76px] max-[850px]:[grid-template-columns:36px_minmax(0,_1fr)] max-[850px]:[align-items:center] max-[850px]:[gap:8px] max-[850px]:[padding:0_18px] max-[850px]:[border-bottom:1px_solid_#eee8e5] max-[850px]:[background:#fff] max-[850px]:[&_>_button]:[position:relative] max-[850px]:[&_>_button]:[display:flex] max-[850px]:[&_>_button]:[width:36px] max-[850px]:[&_>_button]:[height:40px] max-[850px]:[&_>_button]:[align-items:center] max-[850px]:[&_>_button]:[justify-content:center] max-[850px]:[&_>_button]:[color:#302729] max-[850px]:[&_svg]:[width:21px] max-[850px]:[&_svg]:[height:21px] max-[850px]:[&_svg]:[stroke-width:1.7] max-[430px]:[grid-template-columns:32px_minmax(0,_1fr)] max-[430px]:[gap:4px] max-[430px]:[padding:0_12px] max-[430px]:[&_>_button]:[width:32px]">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
            <Link
              className="mobile-menu-logo max-[850px]:[position:absolute] max-[850px]:[top:50%] max-[850px]:[left:50%] max-[850px]:[display:flex] max-[850px]:[width:clamp(76px,_24vw,_118px)] max-[850px]:[justify-content:center] max-[850px]:[transform:translate(-50%,_-50%)] max-[850px]:[&_img]:[width:100%] max-[850px]:[&_img]:[height:55px] max-[850px]:[&_img]:[object-fit:contain]"
              href="/"
              onClick={() => setMenu(false)}
            >
              <img src="/brand/dirndl-wear-logo1.png" alt="Dirndl Wear" />
            </Link>
          </div>
          <div className="mobile-menu-links [display:contents] max-[850px]:[display:block] max-[850px]:[flex:0_0_auto]">
            {[
              "Women",
              "Men",
              "Kids",
              "Collections",
              "Sale",
              "Style Journal",
            ].map((label, index) => (
              <div className="nav-item [position:relative] [height:100%] [display:flex] [align-items:center] [&>a]:[font-size:12px] [&>a]:[letter-spacing:1.6px] [&>a]:[text-transform:uppercase] [&:hover_.dropdown]:[display:flex] [&>a:hover]:[color:#b76474] max-[850px]:[display:block] max-[850px]:[width:auto] max-[850px]:[height:auto] max-[850px]:[&_>_a]:[display:flex] max-[850px]:[&_>_a]:[width:100%] max-[850px]:[&_>_a]:[min-height:64px] max-[850px]:[&_>_a]:[align-items:center] max-[850px]:[&_>_a]:[justify-content:space-between] max-[850px]:[&_>_a]:[gap:16px] max-[850px]:[&_>_a]:[padding:16px_27px] max-[850px]:[&_>_a]:[border-bottom:1px_solid_#eee9e6] max-[850px]:[&_>_a]:[color:#302729] max-[850px]:[&_>_a]:[font-size:15px] max-[850px]:[&_>_a]:[font-weight:400] max-[850px]:[&_>_a]:[letter-spacing:1.5px] max-[850px]:[&_>_a]:[line-height:1.3] max-[850px]:[&_>_a]:[text-transform:uppercase] max-[850px]:[&_>_a]:[transition:background-color_180ms_ease,_color_180ms_ease] max-[850px]:[&_>_a:hover]:[padding-left:27px] max-[850px]:[&_>_a:hover]:[background:#fbf7f5] max-[850px]:[&_>_a:hover]:[color:#781d2d] max-[850px]:[&_>_a:focus-visible]:[padding-left:27px] max-[850px]:[&_>_a:focus-visible]:[background:#fbf7f5] max-[850px]:[&_>_a:focus-visible]:[color:#781d2d]" key={label}>
                <Link
                  href={
                    index === 5
                      ? "/club"
                      : `/collections/${label.toLowerCase()}`
                  }
                  onClick={() => setMenu(false)}
                >
                  <span>{label}</span>
                  {index < 4 && (
                    <ChevronRight
                      className="mobile-menu-arrow [display:none] max-[850px]:[display:block] max-[850px]:[flex:0_0_auto] max-[850px]:[color:#786565]"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </Link>
                {index < 4 && (
                  <div className="dropdown [display:none] [position:absolute] [top:100%] [left:-30px] [background:white] [min-width:220px] [box-shadow:0_12px_24px_#0002] [padding:20px] [flex-direction:column] [gap:16px] [&_a]:[font-size:12px] max-[850px]:[display:none]">
                    {[
                      "Explore All",
                      "Dirndl",
                      "Dirndl Blouses",
                      "Lederhosen",
                      "Traditional Jackets",
                      "Accessories",
                    ].map((item) => (
                      <Link
                        key={item}
                        href={`/collections/${encodeURIComponent(
                          item.toLowerCase(),
                        )}`}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mobile-menu-benefits [display:none] max-[850px]:[display:grid] max-[850px]:[gap:16px] max-[850px]:[margin-top:auto] max-[850px]:[padding:22px_27px_max(22px,_env(safe-area-inset-bottom))] max-[850px]:[background:#f5f2f0] max-[850px]:[color:#443a3a] max-[850px]:[&_>_div]:[display:flex] max-[850px]:[&_>_div]:[align-items:center] max-[850px]:[&_>_div]:[gap:14px] max-[850px]:[&_>_div]:[font-size:13px] max-[850px]:[&_>_div]:[letter-spacing:0.2px] max-[850px]:[&_svg]:[flex:0_0_auto] max-[850px]:[&_svg]:[color:#781d2d] max-[850px]:[&_svg]:[stroke-width:1.6]" aria-label="Shopping benefits">
            <div>
              <Truck size={20} aria-hidden="true" />
              <span>Free shipping over PKR 2,000</span>
            </div>
            <div>
              <RotateCcw size={20} aria-hidden="true" />
              <span>Easy returns</span>
            </div>
          </div>
        </nav>
        {menu && (
          <button
            className="nav-backdrop [display:none] max-[850px]:[position:fixed] max-[850px]:[z-index:61] max-[850px]:[inset:0] max-[850px]:[display:block] max-[850px]:[width:100%] max-[850px]:[height:100%] max-[850px]:[background:rgb(25_20_21_/_54%)] max-[850px]:[animation:menu-backdrop-in_220ms_ease_both]"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenu(false)}
          />
        )}
        {search && (
          <form
            className="searchbar [padding:14px_6%] [display:flex] [gap:12px] [border-top:1px_solid_#eee] [&_input]:[flex:1] [&_input]:[padding:12px] [&_input]:[border:1px_solid_#ddd] [&_button]:[padding:10px]"
            onSubmit={(event) => {
              event.preventDefault();
              location.href = `/search?q=${encodeURIComponent(q)}`;
            }}
          >
            <input
              autoFocus
              placeholder="What are you looking for?"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <button>Search</button>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setSearch(false)}
            >
              <X />
            </button>
          </form>
        )}
      </header>
    </>
  );
}
export function Footer() {
  const [newsletterMessage, setNewsletterMessage] = useState("");

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not subscribe.",
        );
      }
      setNewsletterMessage("Thank you for subscribing.");
      form.reset();
    } catch (error) {
      setNewsletterMessage(
        error instanceof Error ? error.message : "Could not subscribe.",
      );
    }
  }

  return (
    <footer className="footer [background:#4a1420] [color:#fff8f6] [padding:65px_6%_20px] [&_h3]:[font:28px_Georgia,serif] [&_h4]:[font-size:12px] [&_h4]:[letter-spacing:2px] [&_h4]:[margin-bottom:25px] [&_p]:[font-size:13px] [&_p]:[color:#b7aaa4] [&_p]:[line-height:1.9] [&_a]:[display:block] [&_a]:[color:#b7aaa4] [&_a]:[font-size:12px] [&_a]:[margin:12px_0] [&_input]:[background:transparent] [&_input]:[border:1px_solid_#8e817b] [&_input]:[padding:14px] [&_input]:[color:white] [&_input]:[width:100%] [&_input]:[margin:12px_0] [&_a:hover]:[color:#b76474] motion-safe:[&_a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&_a:hover]:[color:#fff] motion-safe:[&_a:hover]:[transform:translateX(3px)]">
      <div className="footer-grid [display:grid] [grid-template-columns:2fr_1fr_1fr_2fr] [gap:45px] [max-width:1400px] [margin:auto] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[grid-template-columns:1fr]">
        <div>
          <h3>DIRNDL WEAR</h3>
          <p>Tradition meets modern elegance. Discover your signature look.</p>
          <div className="flex gap-4">
            <Instagram />
            <Facebook />
          </div>
        </div>
        <div>
          <h4>SERVICE</h4>
          {["Contact", "Shipping & Delivery", "Returns", "FAQ", "Size Guide"].map(
            (item) => (
              <Link
                key={item}
                href={`/pages/${item.toLowerCase().replaceAll(" ", "-")}`}
              >
                {item}
              </Link>
            ),
          )}
        </div>
        <div>
          <h4>ABOUT US</h4>
          {[
            "Our Story",
            "Style Journal",
            "Careers",
            "Privacy Policy",
            "Legal Notice",
          ].map((item) => (
            <Link
              key={item}
              href={`/pages/${item.toLowerCase().replaceAll(" ", "-")}`}
            >
              {item}
            </Link>
          ))}
        </div>
        <div>
          <h4>NEWSLETTER</h4>
          <p>New collections, offers and inspiration delivered to your inbox.</p>
          <form
            onSubmit={subscribe}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Your email address"
            />
            <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">SUBSCRIBE</button>
          </form>
          {newsletterMessage && <p role="status">{newsletterMessage}</p>}
        </div>
      </div>
      <div className="footer-bottom [border-top:1px_solid_#544b47] [margin-top:50px] [padding-top:20px] [font-size:11px] [color:#b7aaa4] [display:flex] [justify-content:space-between] [&_a]:[margin:0]">
        © 2026 Dirndl Wear demo storefront · Unofficial educational frontend
        <Link href="/admin">Admin Dashboard</Link>
      </div>
    </footer>
  );
}
