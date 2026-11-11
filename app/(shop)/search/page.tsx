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
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">Search results for „{query}“</h1>
      <div className="section [padding:70px_0] max-[520px]:[padding:45px_0]">
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