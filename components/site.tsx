"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AnnouncementBar } from "./announcement-bar";
import { HeaderSearch } from "./header-search";
import { useStore } from "./store";

const navItemClass =
  "nav-item [position:static] [height:100%] [display:flex] [align-items:center] max-[1359px]:[display:block] max-[1359px]:[height:auto] max-[1359px]:[border-bottom:1px_solid_#eee9e6]";
const topLinkClass =
  "[display:flex] [height:100%] [align-items:center] [font-size:clamp(12px,_0.85vw,_14px)] [letter-spacing:1.1px] [white-space:nowrap] [color:#211c1d] [text-transform:uppercase] [transition:color_180ms_ease] hover:[color:#781d2d] max-[1359px]:[width:100%] max-[1359px]:[min-height:64px] max-[1359px]:[padding:16px_27px] max-[1359px]:[font-size:15px] max-[1359px]:[letter-spacing:1.5px] max-[1359px]:[color:#211c1d] max-[1359px]:hover:[background:#fbf5f2] max-[1359px]:hover:[color:#781d2d]";
const megaLinkClass =
  "[display:block] [padding:6px_0] [font-size:14px] [color:#211c1d] [transition:color_160ms_ease] hover:[color:#781d2d]";
const columnTitleClass =
  "[font-size:11px] [letter-spacing:1.6px] [text-transform:uppercase] [color:#786565]";
export function Header() {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const router = useRouter();
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const [q, setQ] = useState("");
  /** Mobile drawer: which menu section is expanded. */
  const [openSection, setOpenSection] = useState<string | null>(null);
  /**
   * Desktop: after clicking a mega-menu link the pointer is still over the
   * menu, so keep it closed until the pointer leaves that item.
   */
  const [megaSuppressed, setMegaSuppressed] = useState(false);
  /** Desktop: the menu opened by clicking its name (hover opens menus too). */
  const [clickOpen, setClickOpen] = useState<string | null>(null);
  const { items, wishlist, user } = useStore();

  function closeMenus() {
    setMenu(false);
    setOpenSection(null);
    setMegaSuppressed(true);
    setClickOpen(null);
  }

  // A menu opened by click closes on a click elsewhere or on Escape.
  useEffect(() => {
    if (!clickOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(`[data-nav-item="${clickOpen}"]`)) setClickOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setClickOpen(null);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [clickOpen]);
  const cartCount = items.reduce((total, item) => total + item.qty, 0);

  function closeSearch() {
    setSearch(false);
    searchButton.current?.focus();
  }

  // Focus the field once the search row starts opening.
  useEffect(() => {
    if (!search) return;
    const timer = window.setTimeout(() => searchInput.current?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(timer);
  }, [search]);

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
      <AnnouncementBar hidden={menu} />
      <header className={menu ? "header menu-open [background:#fbf5f2] [position:sticky] [top:0] [z-index:40] [border-bottom:1px_solid_#eadfdc] min-[1360px]:[display:grid] min-[1360px]:[grid-template-columns:minmax(0,_1fr)_auto_minmax(0,_1fr)] min-[1360px]:[align-items:center] min-[1360px]:[column-gap:24px] min-[1360px]:[padding:0_clamp(40px,_4.5vw,_96px)] max-[1359px]:[&.menu-open]:[z-index:60]" : "header [background:#fbf5f2] [position:sticky] [top:0] [z-index:40] [border-bottom:1px_solid_#eadfdc] min-[1360px]:[display:grid] min-[1360px]:[grid-template-columns:minmax(0,_1fr)_auto_minmax(0,_1fr)] min-[1360px]:[align-items:center] min-[1360px]:[column-gap:24px] min-[1360px]:[padding:0_clamp(40px,_4.5vw,_96px)] max-[1359px]:[&.menu-open]:[z-index:60]"}>
        <div className="header-top min-[1360px]:[display:contents] [height:76px] [max-width:none] [margin:auto] [display:flex] [align-items:center] [justify-content:space-between] [padding:0_5%] max-[1359px]:[height:75px] max-[1359px]:[display:grid] max-[1359px]:[grid-template-columns:minmax(36px,_1fr)_auto_minmax(0,_1fr)] max-[1359px]:[gap:8px] max-[1359px]:[padding:0_16px] max-[1359px]:[&_>_.mobile]:[display:flex] max-[1359px]:[&_>_.mobile]:[align-items:center] max-[1359px]:[&_>_.mobile]:[justify-content:center] max-[1359px]:[&_>_.mobile]:[width:36px] max-[1359px]:[&_>_.mobile]:[height:40px] max-[1359px]:[&_>_.mobile]:[justify-self:start] max-[1359px]:[&_>_.logo]:[justify-self:center] max-[430px]:[grid-template-columns:minmax(32px,_1fr)_auto_minmax(0,_1fr)] max-[430px]:[gap:4px] max-[430px]:[padding:0_10px]">
          <button
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="primary-navigation"
            onClick={() => setMenu(!menu)}
            className="mobile [display:none] max-[1359px]:[display:block]"
          >
            {menu ? <X /> : <Menu />}
          </button>
          <Link className="logo min-[1360px]:[grid-column:2] min-[1360px]:[grid-row:1] [font-family:var(--font-serif)] [font-size:35px] [letter-spacing:4px] [font-weight:bold] [line-height:normal] [&_span]:[display:block] [&_span]:[text-align:center] [&_span]:[font:10px_var(--font-sans)] [&_span]:[letter-spacing:8px] [&_span]:[margin-top:10px] max-[1359px]:[font-size:24px] max-[1359px]:[&_span]:[font-size:8px] max-[1359px]:[&_span]:[letter-spacing:5px] [display:flex] [align-items:center]" href="/">
            {/* Brand guide: wordmark in the navigation, monogram where space is small. */}
            <img
              src="/brand/dirndl-wear-wordmark.png"
              alt="Dirndl Wear — Traditional Dresses"
              width={250}
              height={46}
              className="brand-logo [width:clamp(190px,_15vw,_240px)] [height:auto] max-[599px]:[display:none]"
            />
            <img
              src="/brand/dirndl-wear-monogram.png"
              alt="Dirndl Wear"
              width={72}
              height={44}
              className="[display:none] max-[599px]:[display:block] max-[599px]:[width:72px] max-[599px]:[height:auto]"
            />
          </Link>
          <div className="header-actions min-[1360px]:[grid-column:3] min-[1360px]:[grid-row:1] min-[1360px]:[justify-self:end] min-[1360px]:[&_svg]:[stroke-width:1.6] [display:flex] [gap:24px] [align-items:center] [&>a]:[position:relative] [&_small]:[position:absolute] [&_small]:[top:-8px] [&_small]:[right:-8px] [&_small]:[background:#eadfdc] [&_small]:[border-radius:50%] [&_small]:[font-size:10px] [&_small]:[padding:2px_5px] max-[1359px]:[gap:clamp(8px,_2vw,_14px)] max-[1359px]:[&_svg]:[width:19px] max-[520px]:[&_a[aria-label='Konto']]:[display:none] max-[1359px]:[justify-self:end] max-[1359px]:[&_a]:[display:flex] max-[1359px]:[&_a]:[flex:0_0_24px] max-[1359px]:[&_a]:[align-items:center] max-[1359px]:[&_a]:[justify-content:center] max-[1359px]:[&_a]:[height:40px] max-[1359px]:[&_button]:[display:flex] max-[1359px]:[&_button]:[flex:0_0_24px] max-[1359px]:[&_button]:[align-items:center] max-[1359px]:[&_button]:[justify-content:center] max-[1359px]:[&_button]:[height:40px] max-[430px]:[gap:5px] max-[430px]:[&_svg]:[width:18px] motion-safe:[&>a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&>a:hover]:[transform:scale(1.08)] motion-safe:[&>button:hover]:[transform:scale(1.08)]">
            {/* Wide screens: search field with live results. Smaller screens: icon + slide-down row. */}
            <HeaderSearch className="hidden min-[1360px]:block" />
            <button
              ref={searchButton}
              className="min-[1360px]:!hidden"
              aria-label={search ? "Close search" : "Search"}
              aria-expanded={search}
              aria-controls="site-search"
              onClick={() => setSearch(!search)}
            >
              <Search />
            </button>
            <Link
              aria-label={user ? `Account: ${user.name}` : "Create an account"}
              title={user ? user.name : "Create an account"}
              href={user ? "/account" : "/account/register"}
            >
              <UserRound />
              {user && (
                <span
                  aria-hidden="true"
                  className="[position:absolute] [right:-3px] [bottom:2px] [width:9px] [height:9px] [border-radius:50%] [background:#781d2d] [border:2px_solid_#fbf5f2]"
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
          className={menu ? "nav open min-[1360px]:[grid-column:1] min-[1360px]:[grid-row:1] [display:flex] [justify-content:flex-start] [gap:clamp(18px,_1.6vw,_32px)] [height:80px] [align-items:center] max-[1359px]:[display:none] max-[1359px]:[position:fixed] max-[1359px]:[top:0] max-[1359px]:[left:0] max-[1359px]:[right:auto] max-[1359px]:[height:100dvh] max-[1359px]:[background:#fff] max-[1359px]:[padding:0_0_max(16px,_env(safe-area-inset-bottom))] max-[1359px]:[flex-direction:column] max-[1359px]:[align-items:stretch] max-[1359px]:[gap:0] max-[1359px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[1359px]:[&.open]:[display:flex] max-[1359px]:[z-index:62] max-[1359px]:[bottom:0] max-[1359px]:[width:min(90vw,_560px)] max-[1359px]:[max-height:none] max-[1359px]:[overflow-y:auto] max-[1359px]:[overscroll-behavior:contain] max-[1359px]:[justify-content:flex-start] max-[1359px]:[&_.dropdown]:[display:none]" : "nav min-[1360px]:[grid-column:1] min-[1360px]:[grid-row:1] [display:flex] [justify-content:flex-start] [gap:clamp(18px,_1.6vw,_32px)] [height:80px] [align-items:center] max-[1359px]:[display:none] max-[1359px]:[position:fixed] max-[1359px]:[top:0] max-[1359px]:[left:0] max-[1359px]:[right:auto] max-[1359px]:[height:100dvh] max-[1359px]:[background:#fff] max-[1359px]:[padding:0_0_max(16px,_env(safe-area-inset-bottom))] max-[1359px]:[flex-direction:column] max-[1359px]:[align-items:stretch] max-[1359px]:[gap:0] max-[1359px]:[box-shadow:12px_0_36px_rgb(33_28_29_/_12%)] max-[1359px]:[&.open]:[display:flex] max-[1359px]:[z-index:62] max-[1359px]:[bottom:0] max-[1359px]:[width:min(90vw,_560px)] max-[1359px]:[max-height:none] max-[1359px]:[overflow-y:auto] max-[1359px]:[overscroll-behavior:contain] max-[1359px]:[justify-content:flex-start] max-[1359px]:[&_.dropdown]:[display:none]"}
        >
          <div className="mobile-menu-header [display:none] max-[1359px]:[position:sticky] max-[1359px]:[top:0] max-[1359px]:[z-index:1] max-[1359px]:[isolation:isolate] max-[1359px]:[display:grid] max-[1359px]:[flex:0_0_76px] max-[1359px]:[grid-template-columns:36px_minmax(0,_1fr)] max-[1359px]:[align-items:center] max-[1359px]:[gap:8px] max-[1359px]:[padding:0_18px] max-[1359px]:[border-bottom:1px_solid_#eee8e5] max-[1359px]:[background:#fff] max-[1359px]:[&_>_button]:[position:relative] max-[1359px]:[&_>_button]:[display:flex] max-[1359px]:[&_>_button]:[width:36px] max-[1359px]:[&_>_button]:[height:40px] max-[1359px]:[&_>_button]:[align-items:center] max-[1359px]:[&_>_button]:[justify-content:center] max-[1359px]:[&_>_button]:[color:#211c1d] max-[1359px]:[&_svg]:[width:21px] max-[1359px]:[&_svg]:[height:21px] max-[1359px]:[&_svg]:[stroke-width:1.7] max-[430px]:[grid-template-columns:32px_minmax(0,_1fr)] max-[430px]:[gap:4px] max-[430px]:[padding:0_12px] max-[430px]:[&_>_button]:[width:32px]">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
            <Link
              className="mobile-menu-logo max-[1359px]:[position:absolute] max-[1359px]:[top:50%] max-[1359px]:[left:50%] max-[1359px]:[display:flex] max-[1359px]:[width:clamp(150px,_44vw,_200px)] max-[1359px]:[justify-content:center] max-[1359px]:[transform:translate(-50%,_-50%)] max-[1359px]:[&_img]:[width:100%] max-[1359px]:[&_img]:[height:auto] max-[1359px]:[&_img]:[object-fit:contain]"
              href="/"
              onClick={() => setMenu(false)}
            >
              <img src="/brand/dirndl-wear-wordmark.png" alt="Dirndl Wear" />
            </Link>
          </div>
          <div className="mobile-menu-links [display:contents] max-[1359px]:[display:block] max-[1359px]:[flex:0_0_auto]">
            {mainNav.map((item) => {
              const sectionId = `nav-section-${item.label.toLowerCase()}`;
              const expanded = openSection === item.label;
              const hoverOpen = megaSuppressed
                ? ""
                : " min-[1360px]:[&:hover_.mega]:[display:block] min-[1360px]:[&:focus-within_.mega]:[display:block]";
              const linkColor = item.highlight ? " [color:#781d2d] max-[1359px]:[color:#781d2d]" : "";
              return (
                <div
                  className={navItemClass + hoverOpen}
                  key={item.label}
                  data-nav-item={item.label}
                  onMouseLeave={() => setMegaSuppressed(false)}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={closeMenus}
                      className={
                        topLinkClass + linkColor + (item.columns ? " max-[1359px]:[display:none]" : "")
                      }
                    >
                      {item.label}
                    </Link>
                  ) : (
                    // Desktop: a name with no page of its own opens its menu on click.
                    <button
                      type="button"
                      aria-expanded={clickOpen === item.label}
                      aria-controls={`${sectionId}-mega`}
                      onClick={() => {
                        setMegaSuppressed(false);
                        setClickOpen(clickOpen === item.label ? null : item.label);
                      }}
                      className={topLinkClass + linkColor + " [gap:6px] max-[1359px]:[display:none]"}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className={
                          "[transition:transform_180ms_ease]" +
                          (clickOpen === item.label ? " [transform:rotate(180deg)]" : "")
                        }
                      />
                    </button>
                  )}

                  {item.columns && (
                    <>
                      {/* Mobile: expandable section inside the drawer */}
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={sectionId}
                        onClick={() => setOpenSection(expanded ? null : item.label)}
                        className="[display:none] max-[1359px]:[display:flex] max-[1359px]:[width:100%] max-[1359px]:[min-height:64px] max-[1359px]:[align-items:center] max-[1359px]:[justify-content:space-between] max-[1359px]:[padding:16px_27px] max-[1359px]:[font-size:15px] max-[1359px]:[letter-spacing:1.5px] max-[1359px]:[text-transform:uppercase] max-[1359px]:[color:#211c1d]"
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
                          className="[display:none] max-[1359px]:[display:grid] max-[1359px]:[gap:18px] max-[1359px]:[padding:0_27px_22px]"
                        >
                          {item.href && (
                            <Link href={item.href} onClick={closeMenus} className={megaLinkClass + " [font-weight:600]"}>
                              Shop all {item.label.toLowerCase()}
                            </Link>
                          )}
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <p className={columnTitleClass + " [margin:0_0_4px]"}>{column.title}</p>
                              {column.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={closeMenus}
                                  className={megaLinkClass + (link.highlight ? " [color:#781d2d] [font-weight:600]" : "")}
                                >
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
                      <div
                        id={`${sectionId}-mega`}
                        className={
                          "mega [display:none] [position:absolute] [left:0] [right:0] [top:100%] [z-index:45] [background:#fff] [border-top:1px_solid_#eadfdc] [box-shadow:0_18px_30px_rgb(33_28_29_/_10%)] max-[1359px]:[display:none]" +
                          (clickOpen === item.label ? " min-[1360px]:[display:block]" : "")
                        }
                      >
                        <div className="[max-width:1100px] [margin:0_auto] [padding:28px_32px_34px] [display:grid] [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] [gap:32px]">
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <p className={columnTitleClass + " [margin:0_0_12px]"}>{column.title}</p>
                              {column.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={closeMenus}
                                  className={megaLinkClass + (link.highlight ? " [color:#781d2d] [font-weight:600]" : "")}
                                >
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
          <div className="mobile-menu-benefits [display:none] max-[1359px]:[display:grid] max-[1359px]:[gap:16px] max-[1359px]:[margin-top:auto] max-[1359px]:[padding:22px_27px_max(22px,_env(safe-area-inset-bottom))] max-[1359px]:[background:#fbf5f2] max-[1359px]:[color:#211c1d] max-[1359px]:[&_>_div]:[display:flex] max-[1359px]:[&_>_div]:[align-items:center] max-[1359px]:[&_>_div]:[gap:14px] max-[1359px]:[&_>_div]:[font-size:13px] max-[1359px]:[&_>_div]:[letter-spacing:0.2px] max-[1359px]:[&_svg]:[flex:0_0_auto] max-[1359px]:[&_svg]:[color:#781d2d] max-[1359px]:[&_svg]:[stroke-width:1.6]" aria-label="Shopping benefits">
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
            className="nav-backdrop [display:none] max-[1359px]:[position:fixed] max-[1359px]:[z-index:61] max-[1359px]:[inset:0] max-[1359px]:[display:block] max-[1359px]:[width:100%] max-[1359px]:[height:100%] max-[1359px]:[background:rgb(25_20_21_/_54%)] max-[1359px]:[animation:menu-backdrop-in_220ms_ease_both]"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenu(false)}
          />
        )}
        {/* Search row: slides open under the header (height + fade), slides closed again. */}
        <div
          id="site-search"
          className={
            "searchbar grid min-[1360px]:[grid-column:1_/_-1] min-[1360px]:[margin:0_calc(-1_*_clamp(40px,_4.5vw,_96px))] " +
            "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
            // Opening: visible at once so the field can take focus. Closing: hidden only after the slide.
            (search
              ? "visible grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity]"
              : "invisible grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility]")
          }
        >
          <div className="min-h-0 overflow-hidden">
            <form
              role="search"
              className={
                "flex h-[64px] items-center gap-4 border-t border-[#eadfdc] px-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-7 " +
                (search ? "translate-y-0" : "-translate-y-3")
              }
              onSubmit={(event) => {
                event.preventDefault();
                const term = q.trim();
                if (!term) return;
                setSearch(false);
                router.push(`/search?q=${encodeURIComponent(term)}`);
              }}
            >
              <Search size={21} strokeWidth={1.6} aria-hidden="true" className="flex-none text-[#211c1d]" />
              <label htmlFor="site-search-input" className="sr-only">
                Search the store
              </label>
              <input
                id="site-search-input"
                ref={searchInput}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Search..."
                value={q}
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                }}
                tabIndex={search ? 0 : -1}
                className="h-full min-w-0 flex-1 bg-transparent text-[17px] tracking-[0.2px] text-[#211c1d] outline-none placeholder:text-[#786565] focus-visible:![outline:none]"
              />
              <button
                type="button"
                aria-label="Close search"
                tabIndex={search ? 0 : -1}
                onClick={closeSearch}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[#211c1d] transition-colors hover:bg-[#f6eeec] hover:text-[#781d2d]"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </form>
          </div>
        </div>
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
    <footer className="footer [background:#781d2d] [color:#ffffff] [padding:65px_6%_20px] [&_h3]:[font:500_28px_var(--font-serif)] [&_h4]:[font-size:12px] [&_h4]:[letter-spacing:2px] [&_h4]:[margin-bottom:25px] [&_p]:[font-size:13px] [&_p]:[color:#d9b6b6] [&_p]:[line-height:1.9] [&_a]:[display:block] [&_a]:[color:#d9b6b6] [&_a]:[font-size:12px] [&_a]:[margin:12px_0] [&_input]:[background:transparent] [&_input]:[border:1px_solid_#d9b6b6] [&_input]:[padding:14px] [&_input]:[color:white] [&_input]:[width:100%] [&_input]:[margin:12px_0] [&_a:hover]:[color:#ffffff] [&_input::placeholder]:[color:#d9b6b6] motion-safe:[&_a]:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&_a:hover]:[color:#fff] motion-safe:[&_a:hover]:[transform:translateX(3px)]">
      <div className="footer-grid [display:grid] [grid-template-columns:2fr_1fr_1fr_2fr] [gap:45px] [max-width:1400px] [margin:auto] max-[850px]:[grid-template-columns:repeat(2,1fr)] max-[520px]:[grid-template-columns:1fr]">
        <div>
          <img
            src="/brand/dirndl-wear-logo-white.png"
            alt="Dirndl Wear — Traditional Dresses"
            width={240}
            height={174}
            className="mb-5 h-auto w-[240px]"
          />
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
            <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#ffffff] [color:#781d2d] [font-weight:600] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#d9b6b6] [&:focus-visible]:[outline:2px_solid_#ffffff] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">SUBSCRIBE</button>
          </form>
          {newsletterMessage && <p role="status">{newsletterMessage}</p>}
        </div>
      </div>
      <div className="footer-bottom [border-top:1px_solid_#9b4a57] [margin-top:50px] [padding-top:20px] [font-size:11px] [color:#d9b6b6] [display:flex] [justify-content:space-between] [&_a]:[margin:0] [flex-wrap:wrap] [align-items:center] [gap:14px]">
        <span>© 2026 Dirndl Wear demo storefront · Unofficial educational frontend</span>
        <ul aria-label="Payment methods" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {paymentMethods.map((method) => (
            <li key={method.id} className="border border-[#a85a66] px-2.5 py-1 text-[11px] text-[#d9b6b6]">
              {method.label}
            </li>
          ))}
        </ul>
        {user?.role === "admin" && <Link href="/admin">Admin Dashboard</Link>}
      </div>
    </footer>
  );
}
