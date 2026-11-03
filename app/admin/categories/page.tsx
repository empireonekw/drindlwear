"use client";

import { useCallback, useEffect, useState } from "react";

import { useAutoRefresh } from "@/lib/use-auto-refresh";

type Category = { name: string; slug: string; productCount: number };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not load categories.";
        throw new Error(message);
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("categories" in payload) ||
        !Array.isArray(payload.categories)
      ) {
        throw new Error("Category response was invalid.");
      }
      setCategories(payload.categories as Category[]);
      setError("");
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load categories.",
      );
    }
  }, []);

  useAutoRefresh(loadCategories);
  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return (
    <>
      <h1 className="text-3xl font-serif">Categories</h1>
      {error && <p role="alert">{error}</p>}
      <div className="admin-card [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eee] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eee] [&_th]:[color:#888] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
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