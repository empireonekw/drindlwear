"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { useAutoRefresh } from "@/lib/use-auto-refresh";

const categories = [
  { name: "WOMEN", image: "/images/asset-06.webp", slug: "women" },
  { name: "MEN", image: "/images/asset-09.webp", slug: "men" },
  { name: "ACCESSORIES", image: "/images/asset-08.webp", slug: "accessories" },
];

export default function Home() {
  const { products } = useStore();
  const [headline, setHeadline] = useState("Traditional Dresses.");
  const [newArrivals, setNewArrivals] = useState(products.slice(8, 16));
  const [arrivalError, setArrivalError] = useState("");

  const loadHomeContent = useCallback(async () => {
    try {
      const [productsResponse, contentResponse] = await Promise.all([
        fetch("/api/products?sort=newest&limit=8", { cache: "no-store" }),
        fetch("/api/content", { cache: "no-store" }),
      ]);
      const payload: unknown = await productsResponse.json();
      if (
        !productsResponse.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("products" in payload) ||
        !Array.isArray(payload.products)
      ) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not load new arrivals.";
        throw new Error(message);
      }
      setNewArrivals(payload.products);
      setArrivalError("");

      if (contentResponse.ok) {
        const contentPayload: unknown = await contentResponse.json();
        if (
          typeof contentPayload === "object" &&
          contentPayload !== null &&
          "content" in contentPayload &&
          typeof contentPayload.content === "object" &&
          contentPayload.content !== null &&
          "headline" in contentPayload.content &&
          typeof contentPayload.content.headline === "string"
        ) {
          setHeadline(contentPayload.content.headline);
        }
      }
    } catch (error: unknown) {
      console.error("Could not refresh homepage data:", error);
      setArrivalError(
        error instanceof Error ? error.message : "Could not load new arrivals.",
      );
    }
  }, []);

  useAutoRefresh(loadHomeContent);

  /*
   * Load homepage-only content on first visit. Shared product data is loaded
   * by StoreProvider.
   */
  useEffect(() => {
    void loadHomeContent();
  }, [loadHomeContent]);

  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: "url(/images/asset-00.jpeg)" }}
      >
        <div className="hero-content">
          <p className="hero-eyebrow">DIRNDL WEAR · NEW COLLECTION</p>
          <h1>
            {headline}
            <br />
            Timeless Elegance.
          </h1>
          <p className="hero-description">
            A modern expression of Alpine heritage, crafted for life&apos;s special
            moments.
          </p>
          <Link className="btn btn-light" href="/collections/women">
            EXPLORE THE COLLECTION
          </Link>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Shop by Category</h2>
        <p className="subtitle">HERITAGE, CRAFTSMANSHIP &amp; ELEGANCE</p>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              href={`/collections/${category.slug}`}
              className="category-card"
              key={category.name}
            >
              <img src={category.image} alt={category.name} />
              <div className="category-overlay">
                <h3>{category.name}</h3>
                <span>SHOP NOW</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">Our Bestsellers</h2>
        <p className="subtitle">CUSTOMER FAVORITES</p>
        <ProductGrid items={products.slice(0, 8)} />
        <div className="text-center mt-10">
          <Link href="/collections/all" className="btn">
            VIEW ALL PRODUCTS
          </Link>
        </div>
      </section>

      <section className="editorial">
        <img src="/images/asset-02.jpeg" alt="Collection" />
        <div className="editorial-copy">
          <span className="text-xs tracking-widest">
            TRADITIONAL DRESSES · TIMELESS ELEGANCE
          </span>
          <h2>Made for special moments</h2>
          <p>
            For festivals, weddings, and special celebrations: find a look that
            reflects your personality, with style and thoughtful details.
          </p>
          <Link className="btn" href="/collections/collections">
            EXPLORE COLLECTION
          </Link>
        </div>
      </section>

      <section className="container section">
        <h2 className="section-title">New Arrivals</h2>
        <p className="subtitle">YOUR NEW FAVORITES</p>
        {arrivalError && <p role="alert">{arrivalError}</p>}
        <ProductGrid items={newArrivals} />
      </section>

      <section className="banner-small">
        <h1>Discover Dirndl Wear</h1>
        <p className="mb-7">
          Exclusive benefits and inspiration for traditional fashion lovers.
        </p>
        <Link href="/club" className="btn">
          LEARN MORE
        </Link>
      </section>
    </>
  );
}
