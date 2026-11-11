"use client";

import { useStore } from "@/components/store";
import { categories as categoryNames } from "@/lib/data";

export default function Categories() {
  const { products } = useStore();
  const categories = categoryNames.map((name) => ({
    name,
    productCount: products.filter((product) => product.category === name).length,
  }));

  return (
    <>
      <h1 className="text-3xl font-serif">Categories</h1>
      <div className="admin-card [background:white] [border:1px_solid_#eadfdc] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eadfdc] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eadfdc] [&_th]:[color:#786565] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
          <thead>
            <tr>
              <th>Category</th>
              <th>Products</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.name}>
                <td>{category.name}</td>
                <td>{category.productCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}