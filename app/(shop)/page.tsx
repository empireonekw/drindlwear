"use client";

import Link from "next/link";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";

const categories = [
  { name: "WOMEN", image: "/images/asset-06.webp", slug: "women" },
  { name: "MEN", image: "/images/asset-09.webp", slug: "men" },
  { name: "ACCESSORIES", image: "/images/asset-08.webp", slug: "accessories" },
];

export default function Home() {
  const { products } = useStore();

  return (
    <>
      <section
        className="hero"
        style={{ backgroundImage: "url(/images/asset-00.jpeg)" }}
      >
        <div className="hero-content">
          <p className="hero-eyebrow">DIRNDL WEAR · NEW COLLECTION</p>
          <h1>
            Traditional Dresses.
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
        <ProductGrid items={products.slice(8, 16)} />
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
