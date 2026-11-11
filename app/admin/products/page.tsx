"use client";

import { useState } from "react";

import { ProductInput, useStore } from "@/components/store";
import {
  Audience,
  audiences,
  categories,
  ColorFamily,
  colorFamilies,
  money,
  Occasion,
  occasions,
  Product,
  productSizes,
  requiresSize,
  sumSizeStock,
} from "@/lib/data";

const emptySizeStock = () =>
  Object.fromEntries(productSizes.map((size) => [size, ""])) as Record<string, string>;

const blank = {
  name: "",
  category: "Dirndl",
  audience: "women" as Audience,
  price: "",
  oldPrice: "",
  stock: "",
  sizeStock: emptySizeStock(),
  color: "",
  colorFamily: "" as ColorFamily | "",
  lengthCm: "",
  fit: "",
  material: "",
  includes: "",
  occasions: [] as Occasion[],
  description: "",
  image: "",
};

/** Categories where a dress length makes sense. */
const lengthCategories = ["Dirndl", "Kids"];

export default function Products() {
  const { products, saveProduct, deleteProduct } = useStore();
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.image) {
      setError("Choose a product image before saving.");
      return;
    }
    if (form.oldPrice !== "" && Number(form.oldPrice) <= Number(form.price)) {
      setError("The original price must be higher than the sale price.");
      return;
    }

    try {
      const sized = requiresSize(form.category);
      const sizeStock = sized
        ? Object.fromEntries(
            productSizes.map((size) => [size, Math.max(0, Number(form.sizeStock[size] || 0))]),
          )
        : undefined;
      const optional = (value: string) => value.trim() || undefined;
      const product: ProductInput = {
        name: form.name,
        category: form.category,
        audience: form.audience,
        price: Number(form.price),
        // Empty clears the sale price on an existing product.
        oldPrice: form.oldPrice === "" ? (edit ? null : undefined) : Number(form.oldPrice),
        stock: sizeStock ? sumSizeStock(sizeStock) : Number(form.stock),
        sizeStock,
        color: form.color,
        colorFamily: form.colorFamily || undefined,
        lengthCm:
          lengthCategories.includes(form.category) && form.lengthCm !== ""
            ? Number(form.lengthCm)
            : undefined,
        fit: optional(form.fit),
        material: optional(form.material),
        includes: optional(form.includes),
        occasions: form.occasions,
        image: form.image,
        description: form.description,
      };

      saveProduct(product, edit ?? undefined);
      setShow(false);
      setEdit(null);
      setForm(blank);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save product.");
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
      audience: product.audience,
      price: String(product.price),
      oldPrice: product.oldPrice === undefined ? "" : String(product.oldPrice),
      stock: String(product.stock),
      sizeStock: Object.fromEntries(
        productSizes.map((size) => [size, String(product.sizeStock?.[size] ?? 0)]),
      ),
      color: product.color,
      colorFamily: product.colorFamily ?? "",
      lengthCm: product.lengthCm === undefined ? "" : String(product.lengthCm),
      fit: product.fit ?? "",
      material: product.material ?? "",
      includes: product.includes ?? "",
      occasions: product.occasions ?? [],
      description: product.description,
      image: product.image,
    });
    setShow(true);
    window.scrollTo(0, 0);
  }

  function uploadImage(file?: File) {
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

    // UI preview: the image is only shown in this browser session and is
    // not uploaded anywhere. Products reset on reload.
    setForm((current) => ({ ...current, image: URL.createObjectURL(file) }));
  }

  function removeProduct(productId: number) {
    if (confirm("Are you sure you want to delete this product?")) {
      setError("");
      try {
        deleteProduct(productId);
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
      <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:500_32px_var(--font-serif)] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
        <h1>Manage Products</h1>
        <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" onClick={startNewProduct}>
          + NEW PRODUCT
        </button>
      </div>

      {show && (
        <div className="admin-card [background:white] [border:1px_solid_#eadfdc] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
          <h2 className="font-serif text-xl mb-5">
            {edit ? "Edit Product" : "New Product"}
          </h2>
          <form className="admin-form [display:grid] [grid-template-columns:1fr_1fr] [gap:15px] [&_input]:[padding:12px] [&_input]:[border:1px_solid_#dcd0cd] [&_input]:[width:100%] [&_select]:[padding:12px] [&_select]:[border:1px_solid_#dcd0cd] [&_select]:[width:100%] [&_.full]:[grid-column:1/-1] max-[520px]:[grid-template-columns:1fr] max-[520px]:[&_.full]:[grid-column:auto]" onSubmit={save}>
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
            <label className="block">
              <span className="mb-2 block">Shown under</span>
              <select
                value={form.audience}
                onChange={(event) =>
                  setForm({ ...form, audience: event.target.value as Audience })
                }
              >
                {audiences.map((audience) => (
                  <option key={audience.value} value={audience.value}>
                    {audience.label}
                  </option>
                ))}
              </select>
            </label>
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
              type="number"
              min="0"
              step="0.01"
              placeholder="Original price before sale (optional)"
              aria-label="Original price before sale (optional)"
              value={form.oldPrice}
              onChange={(event) =>
                setForm({ ...form, oldPrice: event.target.value })
              }
            />
            {requiresSize(form.category) ? (
              <fieldset className="full border-0 p-0 m-0">
                <legend className="mb-2">
                  Stock per size (total{" "}
                  {sumSizeStock(
                    Object.fromEntries(
                      productSizes.map((size) => [size, Number(form.sizeStock[size] || 0)]),
                    ),
                  )}
                  )
                </legend>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                  {productSizes.map((size) => (
                    <label key={size} className="block text-sm">
                      <span className="mb-1 block">{size}</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={form.sizeStock[size]}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            sizeStock: { ...form.sizeStock, [size]: event.target.value },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <input
                required
                type="number"
                min="0"
                placeholder="Stock"
                aria-label="Stock"
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
              />
            )}
            <input
              placeholder="Color name, e.g. Rose"
              aria-label="Color name"
              value={form.color}
              onChange={(event) =>
                setForm({ ...form, color: event.target.value })
              }
            />
            <label className="block">
              <span className="mb-2 block">Colour group (for &ldquo;Shop by colour&rdquo;)</span>
              <select
                value={form.colorFamily}
                onChange={(event) =>
                  setForm({ ...form, colorFamily: event.target.value as ColorFamily | "" })
                }
              >
                <option value="">None</option>
                {colorFamilies.map((family) => (
                  <option key={family.value} value={family.value}>
                    {family.label}
                  </option>
                ))}
              </select>
            </label>
            {lengthCategories.includes(form.category) && (
              <input
                type="number"
                min="0"
                placeholder="Dress length in cm, e.g. 65"
                aria-label="Dress length in cm"
                value={form.lengthCm}
                onChange={(event) =>
                  setForm({ ...form, lengthCm: event.target.value })
                }
              />
            )}
            <input
              placeholder="Fit, e.g. Fits true to size"
              aria-label="Fit"
              value={form.fit}
              onChange={(event) => setForm({ ...form, fit: event.target.value })}
            />
            <input
              placeholder="Material, e.g. Cotton blend, satin apron"
              aria-label="Material"
              value={form.material}
              onChange={(event) => setForm({ ...form, material: event.target.value })}
            />
            <input
              placeholder="What's included, e.g. Dress and apron. Blouse sold separately."
              aria-label="What's included"
              value={form.includes}
              onChange={(event) => setForm({ ...form, includes: event.target.value })}
            />
            <fieldset className="full border-0 p-0 m-0">
              <legend className="mb-2">Occasions</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {occasions.map((occasion) => (
                  <label key={occasion.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="!w-auto !p-0"
                      checked={form.occasions.includes(occasion.value)}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          occasions: event.target.checked
                            ? [...form.occasions, occasion.value]
                            : form.occasions.filter((value) => value !== occasion.value),
                        })
                      }
                    />
                    {occasion.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <textarea
              placeholder="Description"
              aria-label="Description"
              rows={4}
              maxLength={5000}
              className="w-full [padding:12px] [border:1px_solid_#dcd0cd] [background:white]"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <label className="block">
              <span className="mb-2 block">Product image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  uploadImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span className="mt-2 block text-sm text-gray-500">
                JPEG, PNG or WebP · maximum 5 MB · preview only, not uploaded
              </span>
            </label>
            {form.image && (
              <div className="flex items-center gap-4">
                <img
                  src={form.image}
                  alt="Selected product preview"
                  className="h-28 w-28 rounded border object-contain"
                />
                <span>Image ready</span>
              </div>
            )}
            <button className="btn full [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#5e1622] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
              SAVE
            </button>
          </form>
        </div>
      )}

      <div className="admin-card [background:white] [border:1px_solid_#eadfdc] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        {!show && error && <p role="alert">{error}</p>}
        <input
          className="field mb-5 w-full [padding:12px] [border:1px_solid_#dcd0cd] [background:white]"
          placeholder="Search products..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eadfdc] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eadfdc] [&_th]:[color:#786565] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
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