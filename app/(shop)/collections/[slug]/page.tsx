"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { categories } from "@/lib/data";

const collectionSlugs = [
  "all",
  "women",
  "collections",
  "new arrivals",
  "sale",
  "krüger club",
];
const menCategories = [
  "Lederhosen",
  "Traditional Shirts",
  "Traditional Jackets",
];

export default function Collection() {
  const { slug } = useParams<{ slug: string }>();
  const { products } = useStore();
  const [sort, setSort] = useState("featured");
  const [filter, setFilter] = useState("All");
  const title = decodeURIComponent(slug).replace(/-/g, " ");

  const filtered = useMemo(() => {
    let matchingProducts = products.filter((product) => {
      const normalizedTitle = title.toLowerCase();
      return (
        collectionSlugs.includes(normalizedTitle) ||
        (normalizedTitle === "men"
          ? menCategories.includes(product.category)
          : normalizedTitle === "kids"
            ? product.category === "Kids"
            : product.category.toLowerCase() === normalizedTitle ||
              product.name.toLowerCase().includes(normalizedTitle))
      );
    });

    if (title.toLowerCase() === "sale") {
      matchingProducts = matchingProducts.filter(
        (product) => product.oldPrice,
      );
    }

    if (filter !== "All") {
      matchingProducts = matchingProducts.filter(
        (product) => product.category === filter,
      );
    }

    return [...matchingProducts].sort((first, second) =>
      sort === "low"
        ? first.price - second.price
        : sort === "high"
          ? second.price - first.price
          : sort === "name"
            ? first.name.localeCompare(second.name)
            : first.id - second.id,
    );
  }, [products, title, sort, filter]);

  return (
    <div className="container">
      <div className="breadcrumb">Home / Collections / {title}</div>
      <h1 className="page-heading">
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </h1>
      <p className="subtitle">FIND YOUR NEXT FAVORITE LOOK</p>

      <div className="filter-chips">
        {["All", ...categories].map((category) => (
          <button
            className={filter === category ? "active" : ""}
            onClick={() => setFilter(category)}
            key={category}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <span>{filtered.length} Products</span>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {filtered.length ? (
        <ProductGrid items={filtered} />
      ) : (
        <div className="empty">No products found.</div>
      )}
      <div className="h-20" />
    </div>
  );
}
