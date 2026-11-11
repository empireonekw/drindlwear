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
  ChevronDown,
  RotateCcw,
  Banknote,
} from "lucide-react";

import { mainNav } from "@/lib/navigation";
import { paymentMethods, promiseText } from "@/lib/store-policy";
import { useStore } from "./store";

const navItemClass =
  "nav-item [position:static] [height:100%] [display:flex] [align-items:center] max-[850px]:[display:block] max-[850px]:[height:auto] max-[850px]:[border-bottom:1px_solid_#eee9e6]";
const topLinkClass =
  "[display:flex] [height:100%] [align-items:center] [font-size:12px] [letter-spacing:1.6px] [text-transform:uppercase] [transition:color_180ms_ease] hover:[color:#b76474] max-[850px]:[width:100%] max-[850px]:[min-height:64px] max-[850px]:[padding:16px_27px] max-[850px]:[font-size:15px] max-[850px]:[letter-spacing:1.5px] max-[850px]:[color:#302729] max-[850px]:hover:[background:#fbf7f5] max-[850px]:hover:[color:#781d2d]";
const megaLinkClass =
  "[display:block] [padding:6px_0] [font-size:14px] [color:#211c1d] [transition:color_160ms_ease] hover:[color:#781d2d]";
const columnTitleClass =
  "[font-size:11px] [letter-spacing:1.6px] [text-transform:uppercase] [color:#786565]";
export function Header() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  /** Mobile drawer: which menu section is expanded. */
  const [openSection, setOpenSection] = useState<string | null>(null);
  /**
   * Desktop: after clicking a mega-menu link the pointer is still over the
   * menu, so keep it closed until the pointer leaves that item.
   */
  const [megaSuppressed, setMegaSuppressed] = useState(false);
  const { items, wishlist, user } = useStore();

  function closeMenus() {
    setMenu(false);
    setOpenSection(null);
    setMegaSuppressed(true);
  }
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
        {promiseText.freeDelivery.toUpperCase()} &nbsp; • &nbsp; CASH ON DELIVERY &nbsp; • &nbsp;{" "}
        {promiseText.exchange.toUpperCase()}
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
            <Link
              aria-label={user ? `Account: ${user.name}` : "Sign in"}
              title={user ? user.name : "Sign in"}
              href="/account"
            >
              <UserRound />
              {user && (
                <span
                  aria-hidden="true"
                  className="[position:absolute] [right:-3px] [bottom:2px] [width:9px] [height:9px] [border-radius:50%] [background:#781d2d] [border:2px_solid_#fffaf8]"
                />
              )}
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
            {mainNav.map((item) => {
              const sectionId = `nav-section-${item.label.toLowerCase()}`;
              const expanded = openSection === item.label;
              const hoverOpen = megaSuppressed
                ? ""
                : " min-[851px]:[&:hover_.mega]:[display:block] min-[851px]:[&:focus-within_.mega]:[display:block]";
              const linkColor = item.highlight ? " [color:#a32232] max-[850px]:[color:#a32232]" : "";
              return (
                <div
                  className={navItemClass + hoverOpen}
                  key={item.label}
                  onMouseLeave={() => setMegaSuppressed(false)}
                >
                  <Link
                    href={item.href}
                    onClick={closeMenus}
                    className={
                      topLinkClass + linkColor + (item.columns ? " max-[850px]:[display:none]" : "")
                    }
                  >
                    {item.label}
                  </Link>

                  {item.columns && (
                    <>
                      {/* Mobile: expandable section inside the drawer */}
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={sectionId}
                        onClick={() => setOpenSection(expanded ? null : item.label)}
                        className="[display:none] max-[850px]:[display:flex] max-[850px]:[width:100%] max-[850px]:[min-height:64px] max-[850px]:[align-items:center] max-[850px]:[justify-content:space-between] max-[850px]:[padding:16px_27px] max-[850px]:[font-size:15px] max-[850px]:[letter-spacing:1.5px] max-[850px]:[text-transform:uppercase] max-[850px]:[color:#302729]"
                      >
                        {item.label}
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className={
                            "[color:#786565] [transition:transform_180ms_ease]" +
                            (expanded ? " [transform:rotate(180deg)]" : "")
                          }
                        />
                      </button>
                      {expanded && (
                        <div
                          id={sectionId}
                          className="[display:none] max-[850px]:[display:grid] max-[850px]:[gap:18px] max-[850px]:[padding:0_27px_22px]"
                        >
                          <Link href={item.href} onClick={closeMenus} className={megaLinkClass + " [font-weight:600]"}>
                            Shop all {item.label.toLowerCase()}
                          </Link>
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <p className={columnTitleClass + " [margin:0_0_4px]"}>{column.title}</p>
                              {column.links.map((link) => (
                                <Link key={link.href} href={link.href} onClick={closeMenus} className={megaLinkClass}>
                                  {link.label}
                                  {link.note && (
                                    <span className="[margin-left:8px] [font-size:12px] [color:#786565]">{link.note}</span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Desktop: mega-menu panel, full width under the header */}
                      <div className="mega [display:none] [position:absolute] [left:0] [right:0] [top:100%] [z-index:45] [background:#fff] [border-top:1px_solid_#eee] [box-shadow:0_18px_30px_rgb(33_28_29_/_10%)] max-[850px]:[display:none]">
                        <div className="[max-width:1100px] [margin:0_auto] [padding:28px_32px_34px] [display:grid] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] [gap:32px]">
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <p className={columnTitleClass + " [margin:0_0_12px]"}>{column.title}</p>
                              {column.links.map((link) => (
                                <Link key={link.href} href={link.href} onClick={closeMenus} className={megaLinkClass}>
                                  {link.label}
                                  {link.note && (
                                    <span className="[margin-left:8px] [font-size:12px] [color:#786565]">{link.note}</span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ))}
                          {item.feature && (
                            <Link
                              href={item.feature.href}
                              onClick={closeMenus}
                              className="[display:block] [color:#211c1d] hover:[color:#781d2d]"
                            >
                              <img
                                src={item.feature.image}
                                alt=""
                                className="[width:100%] [aspect-ratio:4/3] [object-fit:cover] [margin-bottom:10px]"
                              />
                              <span className="[font-size:13px] [letter-spacing:1.2px] [text-transform:uppercase]">
                                {item.feature.title} →
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mobile-menu-benefits [display:none] max-[850px]:[display:grid] max-[850px]:[gap:16px] max-[850px]:[margin-top:auto] max-[850px]:[padding:22px_27px_max(22px,_env(safe-area-inset-bottom))] max-[850px]:[background:#f5f2f0] max-[850px]:[color:#443a3a] max-[850px]:[&_>_div]:[display:flex] max-[850px]:[&_>_div]:[align-items:center] max-[850px]:[&_>_div]:[gap:14px] max-[850px]:[&_>_div]:[font-size:13px] max-[850px]:[&_>_div]:[letter-spacing:0.2px] max-[850px]:[&_svg]:[flex:0_0_auto] max-[850px]:[&_svg]:[color:#781d2d] max-[850px]:[&_svg]:[stroke-width:1.6]" aria-label="Shopping benefits">
            <div>
              <Truck size={20} aria-hidden="true" />
              <span>{promiseText.freeDelivery}</span>
            </div>
            <div>
              <RotateCcw size={20} aria-hidden="true" />
              <span>{promiseText.exchange}</span>
            </div>
            <div>
              <Banknote size={20} aria-hidden="true" />
              <span>{promiseText.cashOnDelivery}</span>
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
  const { user } = useStore();

  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // UI preview: nothing is sent or stored yet.
    setNewsletterMessage("Thank you for subscribing.");
    event.currentTarget.reset();
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
      <div className="footer-bottom [border-top:1px_solid_#544b47] [margin-top:50px] [padding-top:20px] [font-size:11px] [color:#b7aaa4] [display:flex] [justify-content:space-between] [&_a]:[margin:0] [flex-wrap:wrap] [align-items:center] [gap:14px]">
        <span>© 2026 Dirndl Wear demo storefront · Unofficial educational frontend</span>
        <ul aria-label="Payment methods" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {paymentMethods.map((method) => (
            <li key={method.id} className="border border-[#6e5a57] px-2.5 py-1 text-[11px] text-[#d9c3c3]">
              {method.label}
            </li>
          ))}
        </ul>
        {user?.role === "admin" && <Link href="/admin">Admin Dashboard</Link>}
      </div>
    </footer>
  );
}
