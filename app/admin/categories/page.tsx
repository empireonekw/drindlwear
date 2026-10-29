"use client";

import { useStore } from "@/components/store";
import { categories } from "@/lib/data";

export default function Categories() {
  const { products } = useStore();

  return (
    <>
      <h1 className="text-3xl font-serif">Categories</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Products</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category}>
                <td>{category}</td>
                <td>
                  {products.filter((product) => product.category === category).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}