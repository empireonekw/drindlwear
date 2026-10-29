"use client";

import { ProductGrid } from "@/components/product";
import { useStore } from "@/components/store";

export default function Wishlist() {
  const { wishlist, products } = useStore();

  return (
    <div className="container">
      <h1 className="page-heading">My Wishlist</h1>
      <div className="section">
        {wishlist.length ? (
          <ProductGrid
            items={products.filter((product) => wishlist.includes(product.id))}
          />
        ) : (
          <div className="empty">No favorites saved yet.</div>
        )}
      </div>
    </div>
  );
}