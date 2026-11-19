"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, Heart, Landmark, Ruler, RotateCcw, Truck } from "lucide-react";

import { FitFinder } from "@/components/fit-finder";
import { useI18n } from "@/components/i18n";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product";
import { SizeGuide, SizeGuideHandle } from "@/components/size-guide";
import { ProductSkeleton } from "@/components/skeletons";
import { useStore } from "@/components/store";
import {
  audiences,
  availableStock,
  colorSwatches,
  Product,
  productSizes,
  requiresSize,
} from "@/lib/data";
import { completeTheLook, similarProducts } from "@/lib/recommendations";
import { setPricing } from "@/lib/sets";
import { sizeChartFor } from "@/lib/size-guide";
import { promiseText } from "@/lib/store-policy";

const primaryButton =
  "inline-flex items-center justify-center bg-[#781d2d] px-7 py-4 text-[12px] font-medium uppercase tracking-[1.5px] text-white transition hover:bg-[#5e1622] disabled:cursor-not-allowed disabled:bg-[#786565]";

const sectionTitle =
  "m-0 mb-3 text-center font-serif text-[34px] font-normal tracking-[1px] text-[#781d2d] max-[520px]:text-[29px]";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { products, productsReady } = useStore();
  const product = products.find((item) => item.id === Number(id));
  const { t } = useI18n();

  if (!product && !productsReady) return <ProductSkeleton />;
  if (!product) {
    return <div className="py-24 text-center text-[#786565]">{t("Product not found.")}</div>;
  }
  // `key` resets size, quantity and gallery when moving to another product.
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const { products, sets, add, toggleWish, wishlist } = useStore();
  const i18n = useI18n();
  const { t, money } = i18n;
  const promises = promiseText(i18n);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const sizeGuide = useRef<SizeGuideHandle>(null);
  const sizeSection = useRef<HTMLDivElement>(null);
  const buyButton = useRef<HTMLButtonElement>(null);

  const needsSize = requiresSize(product.category);
  const outOfStock = product.stock <= 0;
  const sizeLeft = needsSize && size ? availableStock(product, size) : null;
  const maxQuantity = Math.max(1, Math.min(sizeLeft ?? product.stock, 50));
  const wished = wishlist.includes(product.id);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;
  const audience = audiences.find((entry) => entry.value === product.audience);
  const categorySlug = product.category.toLowerCase().replaceAll(" ", "-");
  const look = completeTheLook(product, products);
  const inSets = sets.flatMap((set) => {
    const pricing = set.productIds.includes(product.id) ? setPricing(set, products) : null;
    return pricing?.available ? [{ set, pricing }] : [];
  });
  const similar = similarProducts(product, products, look);
  const sizeChart = needsSize ? sizeChartFor(product) : null;

  /** Selecting a size, from a size button or the fit finder: fresh quantity and messages. */
  function chooseSize(option: string) {
    setSize(option);
    setQuantity(1);
    setAdded(false);
    setMessage("");
  }

  // Mobile: show the sticky bar once the main "Add to cart" button scrolls away.
  useEffect(() => {
    const target = buyButton.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function addToCart() {
    if (needsSize && !size) {
      setMessage(t("Please choose a size first."));
      sizeSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!add(product.id, quantity, needsSize ? size : undefined)) {
      setMessage(
        sizeLeft !== null
          ? t("Only {count} left in size {size}, including what's already in your cart.", { count: sizeLeft, size })
          : t("Requested quantity exceeds available stock."),
      );
      setAdded(false);
      return;
    }
    setMessage("");
    setAdded(true);
  }

  const details = [
    product.lengthCm ? [t("Length"), t("{cm} cm (waist to hem)", { cm: product.lengthCm })] : null,
    product.material ? [t("Material"), t(product.material)] : null,
    product.includes ? [t("What's included"), t(product.includes)] : null,
  ].filter((row): row is [string, string] => row !== null);

  const availability = outOfStock
    ? { text: t("Out of stock"), tone: "text-[#781d2d]" }
    : sizeLeft !== null
      ? sizeLeft <= 3
        ? { text: t("Only {count} left in size {size}", { count: sizeLeft, size }), tone: "text-[#781d2d]" }
        : { text: t("In stock in size {size}", { size }), tone: "text-[#1f6b44]" }
      : needsSize
        ? { text: t("Choose a size to see availability"), tone: "text-[#786565]" }
        : product.stock <= 5
          ? { text: t("Only {count} left", { count: product.stock }), tone: "text-[#781d2d]" }
          : { text: t("In stock"), tone: "text-[#1f6b44]" };

  const buttonLabel = outOfStock
    ? t("Out of stock")
    : needsSize && !size
      ? t("Select a size")
      : t("Add to cart · {amount}", { amount: money(product.price * quantity) });

  return (
    <div className="mx-auto max-w-[1360px] px-8 max-[520px]:px-4 max-[850px]:pb-24">
      <nav aria-label={t("Breadcrumb")} className="py-6 text-[12px] text-[#786565]">
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
          <li><Link href="/" className="hover:text-[#781d2d]">{t("Home")}</Link></li>
          <li aria-hidden="true">/</li>
          {audience && product.audience !== "unisex" && (
            <>
              <li>
                <Link href={`/collections/${product.audience}`} className="hover:text-[#781d2d]">
                  {t(audience.label)}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          )}
          <li>
            <Link href={`/collections/${categorySlug}`} className="hover:text-[#781d2d]">
              {t(product.category)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[#211c1d]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-[6%] pb-20 max-[850px]:grid-cols-1 max-[850px]:gap-8">
        <ProductGallery
          images={[product.image, ...(product.images ?? [])]}
          name={product.name}
          badge={discount > 0 ? `−${discount}%` : undefined}
        />

        <div className="min-w-0">
          <p className="m-0 text-[11px] uppercase tracking-[2px] text-[#786565]">
            Dirndl Wear · {t(product.category)}
          </p>
          <h1 className="m-0 mt-2 font-serif text-[40px] font-normal leading-tight text-[#781d2d] max-[520px]:text-[32px]">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <strong className={`text-[22px] ${discount ? "text-[#781d2d]" : ""}`}>{money(product.price)}</strong>
            {product.oldPrice && (
              <>
                <del className="text-[15px] text-[#786565]">{money(product.oldPrice)}</del>
                <span className="bg-[#f3e6e3] px-2 py-0.5 text-[12px] font-semibold text-[#781d2d]">
                  {t("Save {percent}%", { percent: discount })}
                </span>
              </>
            )}
          </div>
          <p className="m-0 mt-1 text-[12px] text-[#786565]">{t("Includes VAT; delivery calculated at checkout")}</p>

          {/* Colour */}
          <p className="mb-0 mt-6 flex items-center gap-2 text-sm">
            <strong>{t("Colour:")}</strong> {t(product.color)}
            {product.colorFamily && (
              <span
                aria-hidden="true"
                className="inline-block h-5 w-5 rounded-full border border-[#d8c9c4]"
                style={{ background: colorSwatches[product.colorFamily] }}
              />
            )}
          </p>

          {/* Size */}
          {needsSize && (
            <div ref={sizeSection} className="mt-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p id="size-label" className="m-0 text-sm">
                  <strong>{t("Size (EU):")}</strong> {size || t("choose a size")}
                </p>
                <button
                  type="button"
                  onClick={() => sizeGuide.current?.open()}
                  className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-[#781d2d]"
                >
                  <Ruler size={16} aria-hidden="true" /> {t("Size guide")}
                </button>
              </div>
              <div role="group" aria-labelledby="size-label" className="grid grid-cols-7 gap-2 max-[420px]:grid-cols-4">
                {productSizes.map((option) => {
                  const left = availableStock(product, option);
                  const soldOut = left <= 0;
                  const selected = size === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      disabled={soldOut}
                      aria-label={soldOut ? t("Size {size}, sold out", { size: option }) : left <= 3 ? t("Size {size}, only {count} left", { size: option, count: left }) : t("Size {size}", { size: option })}
                      onClick={() => chooseSize(option)}
                      className={
                        "relative h-12 border text-[15px] transition " +
                        (soldOut
                          ? "cursor-not-allowed border-dashed border-[#d8c9c4] bg-[#fbf5f2] text-[#786565] line-through"
                          : selected
                            ? "border-[#781d2d] bg-[#781d2d] text-white"
                            : "border-[#cfc3bf] bg-white hover:border-[#211c1d]")
                      }
                    >
                      {option}
                      {!soldOut && left <= 3 && (
                        <span aria-hidden="true" className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-[#781d2d]"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
              {product.fit && (
                <p className="m-0 mt-3 bg-[#f3e6e3] px-4 py-2.5 text-sm">
                  <strong>{t("Fit:")}</strong> {t(product.fit)}
                </p>
              )}
              {sizeChart && (
                <FitFinder
                  product={product}
                  chart={sizeChart}
                  selectedSize={size}
                  onSelect={chooseSize}
                  onOpenGuide={() => sizeGuide.current?.open()}
                />
              )}
            </div>
          )}

          <p role="status" className={`m-0 mt-4 text-sm ${availability.tone}`}>{availability.text}</p>

          {/* Quantity, add to cart, wishlist */}
          <div className="mt-4 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center border border-[#cfc3bf] bg-white">
              <button
                type="button"
                aria-label={t("Decrease quantity")}
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-[52px] w-11 text-lg disabled:text-[#c9bdb9]"
              >
                −
              </button>
              <span aria-live="polite" className="min-w-7 text-center">{quantity}</span>
              <button
                type="button"
                aria-label={t("Increase quantity")}
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity(quantity + 1)}
                className="h-[52px] w-11 text-lg disabled:text-[#c9bdb9]"
              >
                +
              </button>
            </div>
            <button
              ref={buyButton}
              type="button"
              onClick={addToCart}
              disabled={outOfStock}
              className={`${primaryButton} min-w-[200px] flex-1`}
            >
              {buttonLabel}
            </button>
            <button
              type="button"
              onClick={() => toggleWish(product.id)}
              aria-pressed={wished}
              aria-label={wished ? t("Remove from wishlist") : t("Save to wishlist")}
              className="grid h-[54px] w-[54px] place-items-center border border-[#cfc3bf] bg-white text-[#781d2d] hover:border-[#781d2d]"
            >
              <Heart size={22} fill={wished ? "currentColor" : "none"} aria-hidden="true" />
            </button>
          </div>

          {message && <p role="alert" className="m-0 mt-3 text-sm text-[#781d2d]">{message}</p>}
          {added && !message && (
            <p role="status" className="m-0 mt-3 flex flex-wrap items-center gap-x-3 text-sm text-[#1f6b44]">
              {t("Added to your cart.")}
              <Link href="/cart" className="font-semibold text-[#781d2d] underline underline-offset-4">
                {t("View cart")}
              </Link>
            </p>
          )}

          {/* Sets that include this piece */}
          {inSets.length > 0 && (
            <div className="mt-6 border border-[#eadfdb] bg-white p-4">
              <p className="m-0 text-[11px] uppercase tracking-[1.6px] text-[#786565]">{t("Also available as a set")}</p>
              <ul className="m-0 mt-2 grid list-none gap-3 p-0">
                {inSets.map(({ set, pricing }) => (
                  <li key={set.id}>
                    <Link href={`/sets/${set.id}`} className="group flex items-center gap-3">
                      <span className="flex shrink-0 -space-x-3">
                        {pricing.pieces.slice(0, 3).map((piece) => (
                          <img key={piece.id} src={piece.image} alt="" className="h-12 w-10 border-2 border-white object-cover" />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-semibold group-hover:text-[#781d2d] group-hover:underline">{t(set.name)}</span>
                        <span className="text-[#786565]">
                          {t("{count} pieces for {amount}", { count: pricing.pieces.length, amount: money(pricing.price) })}{" "}
                          <span className="text-[#1f6b44]">· {t("save {amount}", { amount: money(pricing.saving) })}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery promises */}
          <ul className="m-0 mt-6 grid list-none gap-3 border-y border-[#eadfdc] p-0 py-5 text-sm">
            <li className="flex items-center gap-3">
              <Truck size={19} className="shrink-0 text-[#781d2d]" aria-hidden="true" />
              <span>{t("{delivery} across Germany", { delivery: promises.deliveryTime })}</span>
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw size={19} className="shrink-0 text-[#781d2d]" aria-hidden="true" /> {promises.exchange}
            </li>
            <li className="flex items-center gap-3">
              <Landmark size={19} className="shrink-0 text-[#781d2d]" aria-hidden="true" /> {promises.bankTransfer}
            </li>
          </ul>

          {/* More information */}
          <div className="mt-6 divide-y divide-[#eadfdc] border-b border-[#eadfdc]">
            <details open className="group py-4">
              <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between text-sm font-semibold uppercase tracking-[1.2px]">
                {t("Details")}
                <ChevronDown size={18} aria-hidden="true" className="text-[#786565] transition group-open:rotate-180" />
              </summary>
              <p className="mb-0 mt-3 text-sm leading-7 text-[#786565]">{t(product.description)}</p>
              {details.length > 0 && (
                <dl className="mb-0 mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                  {details.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="font-semibold">{label}</dt>
                      <dd className="m-0 text-[#786565]">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </details>
            {needsSize && (
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between text-sm font-semibold uppercase tracking-[1.2px]">
                  {t("Size & fit")}
                  <ChevronDown size={18} aria-hidden="true" className="text-[#786565] transition group-open:rotate-180" />
                </summary>
                <p className="mb-0 mt-3 text-sm leading-7 text-[#786565]">
                  {product.fit ? t(product.fit) : t("Fits true to size.")}
                  {product.lengthCm ? " " + t("Length {cm} cm from waist to hem.", { cm: product.lengthCm }) : ""}{" "}
                  <button type="button" onClick={() => sizeGuide.current?.open()} className="underline underline-offset-4 hover:text-[#781d2d]">
                    {t("Open the size guide")}
                  </button>
                </p>
              </details>
            )}
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between text-sm font-semibold uppercase tracking-[1.2px]">
                {t("Delivery & returns")}
                <ChevronDown size={18} aria-hidden="true" className="text-[#786565] transition group-open:rotate-180" />
              </summary>
              <ul className="m-0 mt-3 list-disc pl-5 text-sm leading-7 text-[#786565]">
                <li>{t("{delivery} across Germany.", { delivery: promises.deliveryTime })}</li>
                <li>{promises.shippingCost}.</li>
                <li>{t("{exchange}, counted from the day it arrives.", { exchange: promises.exchange })}</li>
              </ul>
              <p className="mb-0 mt-2 text-sm leading-7 text-[#786565]">
                {t("All the details:")}{" "}
                <Link href="/pages/shipping-&-delivery" className="underline underline-offset-4">{t("Shipping & Delivery")}</Link>
                {" · "}
                <Link href="/pages/returns" className="underline underline-offset-4">{t("Returns")}</Link>
              </p>
            </details>
          </div>
        </div>
      </div>

      {look.length > 0 && (
        <section aria-labelledby="look-title" className="pb-16">
          <h2 id="look-title" className={sectionTitle}>{t("Complete the look")}</h2>
          <p className="mb-9 text-center text-[13px] tracking-[1px] text-[#786565]">{t("PIECES THAT GO WITH IT")}</p>
          <ProductGrid items={look} />
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="similar-title" className="pb-20">
          <h2 id="similar-title" className={sectionTitle}>{t("You may also like")}</h2>
          <p className="mb-9 text-center text-[13px] tracking-[1px] text-[#786565]">{t("MORE LIKE THIS")}</p>
          <ProductGrid items={similar} />
        </section>
      )}

      {/* Mobile sticky bar, shown once the main button has scrolled away */}
      {showStickyBar && !outOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-30 hidden items-center gap-3 border-t border-[#eadfdb] bg-white px-4 py-3 shadow-[0_-6px_20px_rgb(33_28_29/8%)] max-[850px]:flex">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="m-0 truncate text-[13px]">{product.name}{size ? ` · ${size}` : ""}</p>
            <strong className="text-[15px]">{money(product.price)}</strong>
          </div>
          <button type="button" onClick={addToCart} className={`${primaryButton} px-5 py-3.5`}>
            {needsSize && !size ? t("Select size") : t("Add to cart")}
          </button>
        </div>
      )}

      <SizeGuide ref={sizeGuide} product={product} />
    </div>
  );
}
