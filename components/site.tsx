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
        className={menu ? "announcement menu-active" : "announcement"}
        aria-hidden={menu}
      >
        FREE SHIPPING ON ORDERS OVER PKR 2,000 &nbsp; • &nbsp; EXPLORE NEW ARRIVALS
      </div>
      <header className={menu ? "header menu-open" : "header"}>
        <div className="header-top">
          <button
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="primary-navigation"
            onClick={() => setMenu(!menu)}
            className="mobile"
          >
            {menu ? <X /> : <Menu />}
          </button>
          <Link className="logo" href="/">
            <img
              src="/brand/dirndl-wear-logo1.png"
              alt="Dirndl Wear — Traditional Dresses"
              className="brand-logo"
            />
          </Link>
          <div className="header-actions">
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
          className={menu ? "nav open" : "nav"}
        >
          <div className="mobile-menu-header">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenu(false)}
            >
              <X />
            </button>
            <Link
              className="mobile-menu-logo"
              href="/"
              onClick={() => setMenu(false)}
            >
              <img src="/brand/dirndl-wear-logo1.png" alt="Dirndl Wear" />
            </Link>
          </div>
          <div className="mobile-menu-links">
            {[
              "Women",
              "Men",
              "Kids",
              "Collections",
              "Sale",
              "Style Journal",
            ].map((label, index) => (
              <div className="nav-item" key={label}>
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
                      className="mobile-menu-arrow"
                      size={18}
                      aria-hidden="true"
                    />
                  )}
                </Link>
                {index < 4 && (
                  <div className="dropdown">
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
          <div className="mobile-menu-benefits" aria-label="Shopping benefits">
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
            className="nav-backdrop"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenu(false)}
          />
        )}
        {search && (
          <form
            className="searchbar"
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
  return (
    <footer className="footer">
      <div className="footer-grid">
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
                href={`/pages/${encodeURIComponent(item.toLowerCase())}`}
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
              href={`/pages/${encodeURIComponent(item.toLowerCase())}`}
            >
              {item}
            </Link>
          ))}
        </div>
        <div>
          <h4>NEWSLETTER</h4>
          <p>New collections, offers and inspiration delivered to your inbox.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              alert("Newsletter demo: Thank you!");
            }}
          >
            <input
              type="email"
              required
              placeholder="Your email address"
            />
            <button className="btn">SUBSCRIBE</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 Dirndl Wear demo storefront · Unofficial educational frontend
        <Link href="/admin">Admin Dashboard</Link>
      </div>
    </footer>
  );
}
