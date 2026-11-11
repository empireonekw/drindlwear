"use client";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";

export default function Wishlist() {
  const { wishlist, products } = useStore();

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:500_42px_var(--font-serif)] [margin:35px_0_14px] [color:#781d2d]">My Wishlist</h1>
      <div className="section [padding:70px_0] max-[520px]:[padding:45px_0]">
        {wishlist.length ? (
          <ProductGrid
            items={products.filter((product) => wishlist.includes(product.id))}
          />
        ) : (
          <div className="empty [text-align:center] [padding:100px_0] [color:#786565]">No favorites saved yet.</div>
        )}
      </div>
    </div>
  );
}