"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

import { searchProducts } from "@/lib/search";

import { useI18n } from "./i18n";
import { useStore } from "./store";

const MAX_RESULTS = 5;

/**
 * Always-visible search field for wide screens, with live product results
 * as you type. ↑/↓ move through results, Enter opens one (or all results),
 * Escape closes.
 */
export function HeaderSearch({ className = "" }: { className?: string }) {
  const { products } = useStore();
  const { t, money } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const term = q.trim();
  const results = term ? searchProducts(products, term) : [];
  const shown = results.slice(0, MAX_RESULTS);
  // Rows: the shown products, then "See all results".
  const rowCount = term ? shown.length + 1 : 0;
  const showPanel = open && term.length > 0;

  // Close when clicking elsewhere, and after navigating.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => setActive(-1), [term]);

  function goToAll() {
    if (!term) return;
    setOpen(false);
    input.current?.blur();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function goTo(id: number) {
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(`/product/${id}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && rowCount) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % rowCount);
    } else if (event.key === "ArrowUp" && rowCount) {
      event.preventDefault();
      setActive((current) => (current <= 0 ? rowCount - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && active < shown.length) goTo(shown[active].id);
      else goToAll();
    } else if (event.key === "Escape") {
      if (open && term) setOpen(false);
      else {
        setQ("");
        input.current?.blur();
      }
    }
  }

  const optionId = (index: number) => `${listId}-option-${index}`;

  return (
    <div ref={box} className={"relative " + className}>
      <div className="group flex h-10 w-[clamp(220px,16vw,300px)] items-center gap-2.5 rounded-full border border-[#e3d8d5] bg-white/70 pl-4 pr-1.5 transition-[width,border-color,box-shadow,background-color] duration-300 ease-out focus-within:w-[clamp(260px,20vw,360px)] focus-within:border-[#781d2d] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(120_29_45_/_8%)] hover:border-[#cdbdb9]">
        <Search size={17} strokeWidth={1.7} aria-hidden="true" className="flex-none text-[#786565] group-focus-within:text-[#781d2d]" />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label={t("Search the store")}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t("Search dirndl, blouses…")}
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[#211c1d] outline-none placeholder:text-[#998a8a] focus-visible:![outline:none]"
        />
        {q && (
          <button
            type="button"
            aria-label={t("Clear search")}
            onClick={() => {
              setQ("");
              input.current?.focus();
            }}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[#786565] transition-colors hover:bg-[#f6eeec] hover:text-[#781d2d]"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Live results */}
      <div
        className={
          "absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] origin-top-right overflow-hidden rounded-2xl border border-[#eadfdc] bg-white shadow-[0_24px_50px_rgb(74_20_32_/_14%)] transition-[opacity,transform] duration-200 ease-out " +
          (showPanel ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")
        }
      >
        <ul id={listId} role="listbox" aria-label={t("Matching products")} className="m-0 list-none p-1.5">
          {shown.map((product, index) => (
            <li key={product.id} id={optionId(index)} role="option" aria-selected={active === index}>
              <Link
                href={`/product/${product.id}`}
                tabIndex={-1}
                onMouseEnter={() => setActive(index)}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(product.id);
                }}
                className={
                  "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors " +
                  (active === index ? "bg-[#f6eeec]" : "")
                }
              >
                <img src={product.image} alt="" className="h-14 w-11 flex-none rounded-md object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-[#211c1d]">{product.name}</span>
                  <span className="block truncate text-[12px] text-[#786565]">
                    {t(product.category)} · {t(product.color)}
                    {product.stock <= 0 ? ` · ${t("Sold out")}` : ""}
                  </span>
                </span>
                <span className="flex-none text-right text-[13px] font-medium text-[#211c1d]">
                  {money(product.price)}
                  {product.oldPrice && (
                    <span className="block text-[11px] font-normal text-[#786565] line-through">{money(product.oldPrice)}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
          {term && !shown.length && (
            <li className="px-3 py-4 text-[14px] text-[#786565]" role="presentation">
              {t("No products match “{term}”. Try a colour, category or occasion.", { term })}
            </li>
          )}
          {term && (
            <li id={optionId(shown.length)} role="option" aria-selected={active === shown.length}>
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(shown.length)}
                onClick={goToAll}
                className={
                  "mt-1 flex w-full items-center justify-between rounded-xl border-t border-[#f0e7e4] px-3 py-3 text-left text-[13px] font-medium text-[#781d2d] transition-colors " +
                  (active === shown.length ? "bg-[#f6eeec]" : "")
                }
              >
                <span>
                  {t("See all results for “{term}”", { term })}{results.length ? ` (${results.length})` : ""}
                </span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
