import "server-only";

import type { Db } from "mongodb";

import {
  audiences,
  categories,
  colorFamilies,
  occasions as occasionList,
  productSizes,
  requiresSize,
  sumSizeStock,
  type Audience,
  type ColorFamily,
  type Occasion,
  type Product,
} from "@/lib/data";
import { placeholderProducts } from "@/lib/placeholder-products";

import { getDb } from "./mongodb";

/**
 * The catalogue, stored in MongoDB (collection "catalog"). Each product keeps
 * the numeric `id` the storefront uses in URLs (/product/12); new ids come from
 * the "counters" collection so two admins saving at once never clash.
 *
 * The first time the store runs against an empty database, the placeholder
 * products are copied in so the shop isn't blank. After that the admin owns the
 * catalogue: deleting every product leaves it empty.
 *
 * (An older "products" collection from an earlier version of the app, with a
 * different shape, is left untouched and not used.)
 */

const COLLECTION = "catalog";

type ProductDoc = Product & { createdAt: Date; updatedAt: Date };

/** Largest product save request: room for a long description and a dozen photo paths. */
export const MAX_PRODUCT_BYTES = 32 * 1024;

const globalForProducts = globalThis as unknown as { catalogReady?: Promise<void> };

function ensureReady(db: Db) {
  globalForProducts.catalogReady ??= (async () => {
    const products = db.collection<ProductDoc>(COLLECTION);
    await products.createIndex({ id: 1 }, { unique: true });

    const meta = db.collection<{ _id: string; at: Date }>("meta");
    const alreadySeeded = await meta.findOne({ _id: "catalog-seeded" });
    if (!alreadySeeded && (await products.estimatedDocumentCount()) === 0) {
      const now = new Date();
      await products
        .insertMany(
          placeholderProducts.map((product) => ({ ...product, createdAt: now, updatedAt: now })),
          { ordered: false },
        )
        // Another server instance may have seeded at the same moment.
        .catch((error) => {
          if (error?.code !== 11000) throw error;
        });
      // The seed is already in euros: stop scripts/convert-prices-to-eur.mjs dividing it again.
      await meta.updateOne({ _id: "prices-eur" }, { $setOnInsert: { at: now } }, { upsert: true });
    }
    await meta.updateOne({ _id: "catalog-seeded" }, { $setOnInsert: { at: new Date() } }, { upsert: true });

    // Next id: one past the highest id in use.
    const highest = await products.find({}, { projection: { id: 1 } }).sort({ id: -1 }).limit(1).next();
    await db
      .collection<{ _id: string; seq: number }>("counters")
      .updateOne({ _id: COLLECTION }, { $max: { seq: highest?.id ?? 0 } }, { upsert: true });
  })().catch((error) => {
    globalForProducts.catalogReady = undefined;
    throw error;
  });
  return globalForProducts.catalogReady;
}

async function productsCollection() {
  const db = await getDb();
  await ensureReady(db);
  return { db, products: db.collection<ProductDoc>(COLLECTION) };
}

const publicFields = { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 } as const;

export async function listProducts(): Promise<Product[]> {
  const { products } = await productsCollection();
  return products.find({}, { projection: publicFields }).sort({ id: 1 }).toArray();
}

export async function createProduct(input: Omit<Product, "id">): Promise<Product> {
  const { db, products } = await productsCollection();
  const counter = await db
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate({ _id: COLLECTION }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  const product: Product = { ...input, id: counter?.seq ?? Date.now() };
  const now = new Date();
  await products.insertOne({ ...product, createdAt: now, updatedAt: now });
  return product;
}

/** Replaces a product's fields. Returns null when there is no product with that id. */
export async function updateProduct(id: number, input: Omit<Product, "id">): Promise<Product | null> {
  const { products } = await productsCollection();
  const product: Product = { ...input, id };
  const unset = (["oldPrice", "images", "colorFamily", "sizeStock", "lengthCm", "fit", "material", "includes", "occasions"] as const)
    .filter((key) => product[key] === undefined)
    .reduce<Record<string, "">>((fields, key) => ({ ...fields, [key]: "" }), {});
  const result = await products.updateOne(
    { id },
    { $set: { ...product, updatedAt: new Date() }, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
  );
  return result.matchedCount ? product : null;
}

export async function deleteProduct(id: number) {
  const { products } = await productsCollection();
  const result = await products.deleteOne({ id });
  return result.deletedCount > 0;
}

// ---------------------------------------------------------------------------
// Validation: the admin form is checked again here, because anything sent to
// the API could have been made by hand.

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const wholeNumber = (value: unknown, min: number, max: number) =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null;
/** A euro amount with at most two decimals (cents). */
const euroAmount = (value: unknown, min: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return null;
  const cents = Math.round(value * 100);
  return Math.abs(value * 100 - cents) < 1e-6 ? cents / 100 : null;
};
/** Only photos served by this site: /images/… or uploads at /api/images/<id>. */
const isPhoto = (value: unknown): value is string =>
  typeof value === "string" && (/^\/images\/[\w.-]+$/.test(value) || /^\/api\/images\/[a-f0-9]{24}$/i.test(value));

export function validateProduct(body: unknown): { product: Omit<Product, "id"> } | { error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return { error: "Invalid product." };
  const raw = body as Record<string, unknown>;

  const name = text(raw.name, 120);
  if (name.length < 2) return { error: "Enter a product name." };
  const category = text(raw.category, 60);
  if (!categories.includes(category)) return { error: "Choose a category." };
  const audience = text(raw.audience, 20) as Audience;
  if (!audiences.some((entry) => entry.value === audience)) return { error: "Choose who the product is for." };

  const price = euroAmount(raw.price, 0.01, 100_000);
  if (price === null) return { error: "Enter a price above €0 with at most two decimals." };
  let oldPrice: number | undefined;
  if (raw.oldPrice !== undefined && raw.oldPrice !== null) {
    const value = euroAmount(raw.oldPrice, 0.01, 100_000);
    if (value === null || value <= price) return { error: "The original price must be higher than the selling price." };
    oldPrice = value;
  }

  if (!isPhoto(raw.image)) return { error: "Add at least one photo." };
  const extra = Array.isArray(raw.images) ? raw.images : [];
  if (extra.length > 11 || !extra.every(isPhoto)) return { error: "Photos must be uploaded to the shop." };

  const color = text(raw.color, 40);
  if (!color) return { error: "Enter the colour shoppers will see." };
  const colorFamily = text(raw.colorFamily, 20) as ColorFamily;
  if (colorFamily && !colorFamilies.some((entry) => entry.value === colorFamily)) return { error: "Choose a colour group." };

  let stock: number;
  let sizeStock: Record<string, number> | undefined;
  if (requiresSize(category)) {
    const given = typeof raw.sizeStock === "object" && raw.sizeStock !== null ? (raw.sizeStock as Record<string, unknown>) : {};
    sizeStock = {};
    for (const size of productSizes) {
      const qty = given[size] === undefined ? 0 : wholeNumber(given[size], 0, 9999);
      if (qty === null) return { error: `Stock for size ${size} must be a whole number.` };
      sizeStock[size] = qty;
    }
    stock = sumSizeStock(sizeStock);
  } else {
    const value = wholeNumber(raw.stock, 0, 99_999);
    if (value === null) return { error: "Enter how many are in stock." };
    stock = value;
  }

  let lengthCm: number | undefined;
  if (raw.lengthCm !== undefined && raw.lengthCm !== null) {
    if (typeof raw.lengthCm !== "number" || !Number.isFinite(raw.lengthCm) || raw.lengthCm < 20 || raw.lengthCm > 200) {
      return { error: "Dress length must be between 20 and 200 cm." };
    }
    lengthCm = Math.round(raw.lengthCm);
  }

  const occasions = (Array.isArray(raw.occasions) ? raw.occasions : []).filter((value): value is Occasion =>
    occasionList.some((entry) => entry.value === value),
  );

  const optional = (value: unknown, max: number) => text(value, max) || undefined;
  const product: Omit<Product, "id"> = {
    name,
    category,
    audience,
    price,
    ...(oldPrice ? { oldPrice } : {}),
    image: raw.image,
    ...(extra.length ? { images: extra as string[] } : {}),
    color,
    ...(colorFamily ? { colorFamily } : {}),
    stock,
    ...(sizeStock ? { sizeStock } : {}),
    ...(lengthCm ? { lengthCm } : {}),
    ...(optional(raw.fit, 120) ? { fit: optional(raw.fit, 120) } : {}),
    ...(optional(raw.material, 200) ? { material: optional(raw.material, 200) } : {}),
    ...(optional(raw.includes, 200) ? { includes: optional(raw.includes, 200) } : {}),
    ...(occasions.length ? { occasions: [...new Set(occasions)] } : {}),
    description: text(raw.description, 3000),
  };
  return { product };
}
