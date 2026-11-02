import mongoose, { Schema } from "mongoose";

export type UserRole = "customer" | "admin";
export type OrderStatus =
  | "New"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

const productSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    image: { type: String, required: true, trim: true, maxlength: 2048 },
    imagePublicId: {
      type: String,
      trim: true,
      match: /^dirndl-wear\/products\/[a-f0-9-]{36}$/,
    },
    color: { type: String, trim: true, maxlength: 80, default: "" },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
  },
  { timestamps: true },
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
      required: true,
    },
    wishlist: { type: [Number], default: [] },
  },
  { timestamps: true },
);

const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, trim: true, maxlength: 24 },
      street: { type: String, required: true, trim: true },
      zip: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },
    items: [
      {
        productId: { type: Number, required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["New", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "New",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    stockRestockedAt: { type: Date },
  },
  { timestamps: true },
);

const cartSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    items: [
      {
        productId: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1, max: 50 },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      expires: 0,
    },
  },
  { timestamps: true },
);

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

const storeSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    shopName: { type: String, required: true, maxlength: 120 },
    currency: { type: String, enum: ["PKR"], default: "PKR" },
  },
  { timestamps: true },
);

const homepageContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    headline: { type: String, required: true, maxlength: 160 },
  },
  { timestamps: true },
);

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    subscribedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export const ProductModel =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);
export const CategoryModel =
  mongoose.models.Category ||
  mongoose.model("Category", categorySchema);
export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
export const CartModel =
  mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export const CounterModel =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);
export const StoreSettingsModel =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);
export const HomepageContentModel =
  mongoose.models.HomepageContent ||
  mongoose.model("HomepageContent", homepageContentSchema);
export const NewsletterSubscriberModel =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
