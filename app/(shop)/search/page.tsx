"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";

function Results() {
  const query = useSearchParams().get("q") || "";
  const { products } = useStore();
  const matches = products.filter((product) =>
    `${product.name} ${product.category} ${product.color}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="container">
      <h1 className="page-heading">Search results for „{query}“</h1>
      <div className="section">
        <ProductGrid items={matches} />
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <Suspense fallback={<p>Search...</p>}>
      <Results />
    </Suspense>
  );
}