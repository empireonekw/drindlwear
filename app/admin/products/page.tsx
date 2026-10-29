"use client";

import { useState } from "react";

import { useStore } from "@/components/store";
import { categories, money, Product } from "@/lib/data";

const blank = {
  name: "",
  category: "Dirndl",
  price: "",
  stock: "",
  color: "",
  image: "",
};

export default function Products() {
  const { products, setProducts } = useStore();
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");

  function save(event: React.FormEvent) {
    event.preventDefault();

    const product: Product = {
      id: edit ?? Date.now(),
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      color: form.color,
      image: form.image || "/images/asset-06.webp",
      description: "Product description",
    };

    setProducts((currentProducts) =>
      edit
        ? currentProducts.map((item) => (item.id === edit ? product : item))
        : [product, ...currentProducts],
    );
    setShow(false);
    setEdit(null);
    setForm(blank);
  }

  function startNewProduct() {
    setEdit(null);
    setForm(blank);
    setShow(!show);
  }

  function startEditing(product: Product) {
    setEdit(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      color: product.color,
      image: product.image,
    });
    setShow(true);
    window.scrollTo(0, 0);
  }

  function deleteProduct(productId: number) {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="admin-head">
        <h1>Manage Products</h1>
        <button className="btn" onClick={startNewProduct}>
          + NEW PRODUCT
        </button>
      </div>

      {show && (
        <div className="admin-card">
          <h2 className="font-serif text-xl mb-5">
            {edit ? "Edit Product" : "New Product"}
          </h2>
          <form className="admin-form" onSubmit={save}>
            <input
              required
              placeholder="Product Name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <select
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="Price (€)"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
            />
            <input
              required
              type="number"
              min="0"
              placeholder="Stock"
              value={form.stock}
              onChange={(event) =>
                setForm({ ...form, stock: event.target.value })
              }
            />
            <input
              placeholder="Color"
              value={form.color}
              onChange={(event) =>
                setForm({ ...form, color: event.target.value })
              }
            />
            <input
              placeholder="Image URL"
              value={form.image}
              onChange={(event) =>
                setForm({ ...form, image: event.target.value })
              }
            />
            <button className="btn full">SAVE</button>
          </form>
        </div>
      )}

      <div className="admin-card">
        <input
          className="field mb-5 w-full"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <img src={product.image} alt="" />
                </td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{money(product.price)}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => startEditing(product)}>Edit</button> ·{" "}
                  <button onClick={() => deleteProduct(product.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}