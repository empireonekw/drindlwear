"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";

import { ImagePicker } from "@/components/admin/image-picker";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  inputClass,
  PageHeader,
  SearchInput,
  StockBadge,
  Tabs,
  tableClass,
  tdClass,
  textareaClass,
  thClass,
  useToast,
} from "@/components/admin/ui";
import { ProductInput, useStore } from "@/components/store";
import {
  Audience,
  audiences,
  categories,
  ColorFamily,
  colorFamilies,
  colorSwatches,
  money,
  Occasion,
  occasions,
  Product,
  productSizes,
  requiresSize,
} from "@/lib/data";

/** Categories where a dress length makes sense. */
const lengthCategories = ["Dirndl", "Kids"];
type StockFilter = "all" | "in" | "low" | "out";

type Form = {
  name: string;
  category: string;
  audience: Audience;
  price: string;
  oldPrice: string;
  stock: string;
  sizeStock: Record<string, string>;
  color: string;
  colorFamily: ColorFamily | "";
  lengthCm: string;
  fit: string;
  material: string;
  includes: string;
  occasions: Occasion[];
  description: string;
  photos: string[];
};

const blank = (): Form => ({
  name: "",
  category: "Dirndl",
  audience: "women",
  price: "",
  oldPrice: "",
  stock: "",
  sizeStock: Object.fromEntries(productSizes.map((size) => [size, ""])),
  color: "",
  colorFamily: "",
  lengthCm: "",
  fit: "",
  material: "",
  includes: "",
  occasions: [],
  description: "",
  photos: [],
});

const fromProduct = (product: Product): Form => ({
  name: product.name,
  category: product.category,
  audience: product.audience,
  price: String(product.price),
  oldPrice: product.oldPrice === undefined ? "" : String(product.oldPrice),
  stock: String(product.stock),
  sizeStock: Object.fromEntries(productSizes.map((size) => [size, String(product.sizeStock?.[size] ?? 0)])),
  color: product.color,
  colorFamily: product.colorFamily ?? "",
  lengthCm: product.lengthCm === undefined ? "" : String(product.lengthCm),
  fit: product.fit ?? "",
  material: product.material ?? "",
  includes: product.includes ?? "",
  occasions: product.occasions ?? [],
  description: product.description,
  photos: [product.image, ...(product.images ?? [])],
});

export default function ProductsPage() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}

function Products() {
  const { products, saveProduct, deleteProduct } = useStore();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  // Images already used in the shop, offered in the photo library.
  const projectImages = useMemo(
    () => [...new Set(products.flatMap((product) => [product.image, ...(product.images ?? [])]))].filter((url) => url.startsWith("/images/")),
    [products],
  );

  // Open the editor from a link like /admin/products?edit=3 (dashboard), or
  // filter by ?category=Dirndl (categories page).
  useEffect(() => {
    const fromLink = searchParams.get("category");
    if (fromLink && categories.includes(fromLink)) setCategory(fromLink);
    const id = Number(searchParams.get("edit"));
    const product = products.find((entry) => entry.id === id);
    if (product) {
      openEditor(product);
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openEditor(product?: Product) {
    setErrors({});
    setForm(product ? fromProduct(product) : blank());
    setEditing(product ? product.id : "new");
  }
  const closeEditor = () => setEditing(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const sized = requiresSize(form.category);
  const sizeTotal = productSizes.reduce((total, size) => total + Math.max(0, Number(form.sizeStock[size] || 0)), 0);
  const discount =
    form.oldPrice && form.price && Number(form.oldPrice) > Number(form.price)
      ? Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)
      : 0;

  function save() {
    const found: Partial<Record<keyof Form, string>> = {};
    if (form.name.trim().length < 2) found.name = "Enter a product name.";
    if (!form.photos.length) found.photos = "Add at least one photo.";
    if (form.price === "" || Number(form.price) <= 0) found.price = "Enter a price above 0.";
    if (form.oldPrice !== "" && Number(form.oldPrice) <= Number(form.price)) {
      found.oldPrice = "The original price must be higher than the selling price.";
    }
    if (!sized && (form.stock === "" || Number(form.stock) < 0)) found.stock = "Enter how many are in stock.";
    if (!form.color.trim()) found.color = "Enter the colour shoppers will see.";
    setErrors(found);
    if (Object.keys(found).length) {
      toast("Please fix the highlighted fields.", "error");
      return;
    }

    const sizeStock = sized
      ? Object.fromEntries(productSizes.map((size) => [size, Math.max(0, Math.floor(Number(form.sizeStock[size] || 0)))]))
      : undefined;
    const optional = (value: string) => value.trim() || undefined;
    const isNew = editing === "new";
    const input: ProductInput = {
      name: form.name.trim(),
      category: form.category,
      audience: form.audience,
      price: Math.round(Number(form.price)),
      // Empty clears the sale price on an existing product.
      oldPrice: form.oldPrice === "" ? (isNew ? undefined : null) : Math.round(Number(form.oldPrice)),
      stock: sizeStock ? sizeTotal : Math.max(0, Math.floor(Number(form.stock))),
      sizeStock,
      color: form.color.trim(),
      colorFamily: form.colorFamily || undefined,
      lengthCm: lengthCategories.includes(form.category) && form.lengthCm !== "" ? Number(form.lengthCm) : undefined,
      fit: optional(form.fit),
      material: optional(form.material),
      includes: optional(form.includes),
      occasions: form.occasions,
      image: form.photos[0],
      images: form.photos.slice(1),
      description: form.description.trim(),
    };
    saveProduct(input, isNew ? undefined : (editing as number));
    toast(isNew ? `${input.name} added to the catalogue.` : `${input.name} saved.`);
    closeEditor();
  }

  function remove(product: Product) {
    deleteProduct(product.id);
    setConfirmDelete(null);
    closeEditor();
    toast(`${product.name} deleted.`);
  }

  const stockOf = (product: Product): StockFilter => (product.stock <= 0 ? "out" : product.stock <= 3 ? "low" : "in");
  const searched = products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.color}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (!category || product.category === category);
  });
  const visible = searched.filter((product) => stockFilter === "all" || stockOf(product) === stockFilter);
  const countFor = (filter: StockFilter) => searched.filter((product) => filter === "all" || stockOf(product) === filter).length;
  const editingProduct = typeof editing === "number" ? products.find((product) => product.id === editing) : undefined;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} products in the catalogue.`}
        actions={
          <Button variant="primary" onClick={() => openEditor()}>
            <Plus size={17} aria-hidden="true" /> New product
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f1e8e5] p-4">
          <SearchInput label="Search products" placeholder="Search by name, category or colour" value={query} onChange={setQuery} />
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass.replace("w-full", "") + " w-auto min-w-[180px]"}>
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <div className="w-full">
            <Tabs
              label="Filter by stock"
              value={stockFilter}
              onChange={setStockFilter}
              options={[
                { value: "all", label: "All", count: countFor("all") },
                { value: "in", label: "In stock", count: countFor("in") },
                { value: "low", label: "Low stock", count: countFor("low") },
                { value: "out", label: "Sold out", count: countFor("out") },
              ]}
            />
          </div>
        </div>

        {visible.length ? (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Product</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Price</th>
                  <th className={thClass}>Stock</th>
                  <th className={thClass}>Sizes</th>
                  <th className={thClass + " text-right"}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-[#fdfaf8]">
                    <td className={tdClass}>
                      <button type="button" onClick={() => openEditor(product)} className="flex items-center gap-3 text-left">
                        <img src={product.image} alt="" className="h-14 w-11 flex-none rounded-lg object-cover" />
                        <span className="min-w-0">
                          <span className="block font-medium text-charcoal hover:text-burgundy">{product.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-taupe">
                            {product.colorFamily && (
                              <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: colorSwatches[product.colorFamily] }} aria-hidden="true" />
                            )}
                            {product.color} · {audiences.find((audience) => audience.value === product.audience)?.label}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className={tdClass + " text-taupe"}>{product.category}</td>
                    <td className={tdClass}>
                      <span className="font-medium [font-variant-numeric:tabular-nums]">{money(product.price)}</span>
                      {product.oldPrice && (
                        <span className="ml-2 text-[12px] text-taupe line-through">{money(product.oldPrice)}</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <StockBadge stock={product.stock} />
                    </td>
                    <td className={tdClass}>
                      {product.sizeStock ? (
                        <span className="flex flex-wrap gap-1">
                          {productSizes.map((size) => (
                            <span
                              key={size}
                              title={`Size ${size}: ${product.sizeStock?.[size] ?? 0}`}
                              className={
                                "rounded-md px-1.5 py-0.5 text-[11px] [font-variant-numeric:tabular-nums] " +
                                ((product.sizeStock?.[size] ?? 0) > 0 ? "bg-[#f1ecea] text-charcoal" : "bg-transparent text-[#c4b6b4] line-through")
                              }
                            >
                              {size}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-[12px] text-taupe">One size</span>
                      )}
                    </td>
                    <td className={tdClass + " text-right"}>
                      <span className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" aria-label={`Edit ${product.name}`} onClick={() => openEditor(product)}>
                          <Pencil size={15} /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={`Delete ${product.name}`} onClick={() => setConfirmDelete(product)}>
                          <Trash2 size={15} />
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title={products.length ? "No products match" : "No products yet"}
            text={products.length ? "Try another search, category or stock filter." : "Add your first product to start selling."}
            action={!products.length && <Button variant="primary" onClick={() => openEditor()}>New product</Button>}
          />
        )}
      </Card>

      <Drawer
        open={editing !== null}
        onClose={closeEditor}
        wide
        title={editing === "new" ? "New product" : "Edit product"}
        subtitle={editingProduct ? `${editingProduct.category} · ID ${editingProduct.id}` : "Fill in the details shoppers will see."}
        footer={
          <>
            {editingProduct && (
              <Button variant="danger" className="mr-auto" onClick={() => setConfirmDelete(editingProduct)}>
                <Trash2 size={15} /> Delete
              </Button>
            )}
            <Button onClick={closeEditor}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {editing === "new" ? "Add product" : "Save changes"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <Card title="Photos" description="The first photo is shown on product cards.">
            <ImagePicker value={form.photos} onChange={(photos) => set("photos", photos)} projectImages={projectImages} />
            {errors.photos && <p className="m-0 mt-2 text-[13px] text-[#9b1c2e]">{errors.photos}</p>}
          </Card>

          <Card title="Basic details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" htmlFor="p-name" error={errors.name} className="sm:col-span-2">
                <input id="p-name" className={inputClass} value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Rosalie midi dirndl" />
              </Field>
              <Field label="Category" htmlFor="p-category">
                <select id="p-category" className={inputClass} value={form.category} onChange={(event) => set("category", event.target.value)}>
                  {categories.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Shown under" htmlFor="p-audience">
                <select id="p-audience" className={inputClass} value={form.audience} onChange={(event) => set("audience", event.target.value as Audience)}>
                  {audiences.map((audience) => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description" htmlFor="p-description" className="sm:col-span-2">
                <textarea id="p-description" rows={4} maxLength={5000} className={textareaClass} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Fabric, details, how it's worn…" />
              </Field>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (Rs)" htmlFor="p-price" error={errors.price}>
                <input id="p-price" type="number" min="0" inputMode="numeric" className={inputClass} value={form.price} onChange={(event) => set("price", event.target.value)} placeholder="14990" />
              </Field>
              <Field label="Original price (Rs)" htmlFor="p-old" error={errors.oldPrice} hint="Only for sale items. Leave empty if not on sale.">
                <input id="p-old" type="number" min="0" inputMode="numeric" className={inputClass} value={form.oldPrice} onChange={(event) => set("oldPrice", event.target.value)} placeholder="Optional" />
              </Field>
            </div>
            {discount > 0 && (
              <p className="m-0 mt-3">
                <Badge tone="burgundy">Shown as −{discount}% sale</Badge>
              </p>
            )}
          </Card>

          <Card title="Stock" description={sized ? `Units per size · total ${sizeTotal}` : "Sold in one size"}>
            {sized ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                {productSizes.map((size) => (
                  <Field key={size} label={`EU ${size}`} htmlFor={`p-size-${size}`}>
                    <input
                      id={`p-size-${size}`}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      className={inputClass + " text-center"}
                      value={form.sizeStock[size]}
                      onChange={(event) => set("sizeStock", { ...form.sizeStock, [size]: event.target.value })}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <Field label="Units in stock" htmlFor="p-stock" error={errors.stock} className="max-w-[220px]">
                <input id="p-stock" type="number" min="0" inputMode="numeric" className={inputClass} value={form.stock} onChange={(event) => set("stock", event.target.value)} />
              </Field>
            )}
          </Card>

          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Colour name" htmlFor="p-color" error={errors.color}>
                <input id="p-color" className={inputClass} value={form.color} onChange={(event) => set("color", event.target.value)} placeholder="e.g. Rose" />
              </Field>
              <Field label="Colour group" htmlFor="p-family" hint="Used by “Shop by colour”.">
                <select id="p-family" className={inputClass} value={form.colorFamily} onChange={(event) => set("colorFamily", event.target.value as ColorFamily | "")}>
                  <option value="">None</option>
                  {colorFamilies.map((family) => (
                    <option key={family.value} value={family.value}>
                      {family.label}
                    </option>
                  ))}
                </select>
              </Field>
              {lengthCategories.includes(form.category) && (
                <Field label="Dress length (cm)" htmlFor="p-length" hint="Short 50–55 · Midi 60–65 · Long 70+">
                  <input id="p-length" type="number" min="0" className={inputClass} value={form.lengthCm} onChange={(event) => set("lengthCm", event.target.value)} />
                </Field>
              )}
              <Field label="Fit" htmlFor="p-fit">
                <input id="p-fit" className={inputClass} value={form.fit} onChange={(event) => set("fit", event.target.value)} placeholder="e.g. Fits true to size" />
              </Field>
              <Field label="Material" htmlFor="p-material">
                <input id="p-material" className={inputClass} value={form.material} onChange={(event) => set("material", event.target.value)} placeholder="e.g. Cotton blend, satin apron" />
              </Field>
              <Field label="What's included" htmlFor="p-includes" className="sm:col-span-2">
                <input id="p-includes" className={inputClass} value={form.includes} onChange={(event) => set("includes", event.target.value)} placeholder="e.g. Dress and apron. Blouse sold separately." />
              </Field>
            </div>
          </Card>

          <Card title="Occasions" description="Where this product appears under “Shop by occasion”.">
            <div className="flex flex-wrap gap-2">
              {occasions.map((occasion) => {
                const on = form.occasions.includes(occasion.value);
                return (
                  <button
                    key={occasion.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set("occasions", on ? form.occasions.filter((value) => value !== occasion.value) : [...form.occasions, occasion.value])
                    }
                    className={
                      "h-9 rounded-full border px-3.5 text-[13px] transition-colors " +
                      (on ? "border-burgundy bg-burgundy text-white" : "border-[#dcd0cd] bg-white text-charcoal hover:border-burgundy")
                    }
                  >
                    {occasion.label}
                  </button>
                );
              })}
            </div>
          </Card>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete ${confirmDelete?.name ?? "product"}?`}
        text="It is removed from the shop, carts and wishlists. This can't be undone."
        confirmLabel="Delete product"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
      />
    </>
  );
}
