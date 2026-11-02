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