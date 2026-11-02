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
  imagePublicId: "",
};

export default function Products() {
  const { products, saveProduct, deleteProduct } = useStore();
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.image) {
      setError("Choose and upload a product image before saving.");
      return;
    }
    setSaving(true);

    try {
      const product: Omit<Product, "id"> = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        color: form.color,
        image: form.image,
        imagePublicId: form.imagePublicId || undefined,
        description: "Product description",
      };

      await saveProduct(product, edit ?? undefined);
      setShow(false);
      setEdit(null);
      setForm(blank);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
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
      imagePublicId: product.imagePublicId || "",
    });
    setShow(true);
    window.scrollTo(0, 0);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.set("image", file);
      const response = await fetch("/api/uploads/products", {
        method: "POST",
        body: uploadData,
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("image" in payload) ||
        typeof payload.image !== "string" ||
        !("publicId" in payload) ||
        typeof payload.publicId !== "string"
      ) {
        throw new Error(
          typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : "Could not upload image.",
        );
      }

      setForm((current) => ({
        ...current,
        image: payload.image as string,
        imagePublicId: payload.publicId as string,
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload image.",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeProduct(productId: number) {
    if (confirm("Are you sure you want to delete this product?")) {
      setError("");
      try {
        await deleteProduct(productId);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete product.",
        );
      }
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
            {error && <p role="alert">{error}</p>}
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
              placeholder="Price (PKR)"
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
            <label className="block">
              <span className="mb-2 block">Product image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingImage || saving}
                onChange={(event) => {
                  void uploadImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span className="mt-2 block text-sm text-gray-500">
                JPEG, PNG or WebP · maximum 5 MB · uploaded to Cloudinary
              </span>
            </label>
            {form.image && (
              <div className="flex items-center gap-4">
                <img
                  src={form.image}
                  alt="Selected product preview"
                  className="h-28 w-28 rounded border object-contain"
                />
                <span>{uploadingImage ? "Uploading image..." : "Image ready"}</span>
              </div>
            )}
            <button className="btn full" disabled={saving || uploadingImage}>
              {uploadingImage
                ? "UPLOADING IMAGE..."
                : saving
                  ? "SAVING..."
                  : "SAVE"}
            </button>
          </form>
        </div>
      )}

      <div className="admin-card">
        {!show && error && <p role="alert">{error}</p>}
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
                  <button onClick={() => removeProduct(product.id)}>
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