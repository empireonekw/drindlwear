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
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <div className="breadcrumb [font-size:11px] [color:#888] [padding:24px_0]">Home / Collections / {title}</div>
      <h1 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </h1>
      <p className="subtitle [text-align:center] [color:#777] [font-size:13px] [letter-spacing:1px] [margin-bottom:38px]">FIND YOUR NEXT FAVORITE LOOK</p>

      <div className="filter-chips [display:flex] [gap:10px] [flex-wrap:wrap] [&_button]:[border:1px_solid_#ddd] [&_button]:[padding:9px_13px] [&_button]:[font-size:12px] [&_.active]:[background:#781d2d] [&_.active]:[color:white]">
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

      <div className="toolbar [display:flex] [justify-content:space-between] [align-items:center] [border-top:1px_solid_#eee] [border-bottom:1px_solid_#eee] [padding:16px_0] [margin:35px_0] [&_select]:[padding:12px] [&_select]:[border:1px_solid_#ddd] [&_select]:[background:white] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px]">
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
        <div className="empty [text-align:center] [padding:100px_0] [color:#777]">No products found.</div>
      )}
      <div className="h-20" />
    </div>
  );
}
