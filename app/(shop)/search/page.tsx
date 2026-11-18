"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useI18n } from "@/components/i18n";
import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";
import { searchProducts } from "@/lib/search";

function Results() {
  const query = useSearchParams().get("q") || "";
  const { products } = useStore();
  const { t } = useI18n();
  const matches = searchProducts(products, query);

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">{t("Search results for „{query}“", { query })}</h1>
      <div className="section [padding:70px_0] max-[520px]:[padding:45px_0]">
        {matches.length ? (
          <ProductGrid items={matches} />
        ) : (
          <p className="py-16 text-center text-[#786565]">{t("No products found.")}</p>
        )}
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <Suspense fallback={null}>
      <Results />
    </Suspense>
  );
}