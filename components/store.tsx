"use client";

/**
 * UI-preview store. There is no backend right now: everything lives in
 * React state, and the cart, wishlist, orders and a few settings are kept in
 * this browser's localStorage. Products come from lib/placeholder-products.ts
 * and reset on reload.
 */

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  availableStock,
  CartItem,
  Product,
  requiresSize,
  sameCartLine,
  sumSizeStock,
} from "@/lib/data";
import { placeholderProducts } from "@/lib/placeholder-products";

export type OrderStatus =
  | "New"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type Order = {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  total: number;
  status: OrderStatus;
  paymentStatus: string;
  items: { productId: number; name: string; size?: string; qty: number; price: number }[];
  shippingAddress: { street: string; zip: string; city: string };
};

/** `oldPrice: null` clears an existing sale price when editing. */
export type ProductInput = Omit<Product, "id" | "oldPrice"> & {
  oldPrice?: number | null;
};

export type PreviewUser = { name: string; email: string };

type State = {
  items: CartItem[];
  wishlist: number[];
  products: Product[];
  orders: Order[];
  headline: string;
  shopName: string;
  user: PreviewUser | null;
  add: (id: number, qty?: number, size?: string) => boolean;
  remove: (id: number, size?: string) => void;
  quantity: (id: number, qty: number, size?: string) => void;
  toggleWish: (id: number) => void;
  saveProduct: (product: ProductInput, id?: number) => Product;
  deleteProduct: (id: number) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  checkout: (customer: Record<string, string>) => Order;
  setHeadline: (headline: string) => void;
  setShopName: (shopName: string) => void;
  signIn: (user: PreviewUser) => void;
  signOut: () => void;
  clear: () => void;
};

const STORAGE_KEY = "dw-ui-preview";
const DEFAULT_HEADLINE = "Traditional Dresses.";
const DEFAULT_SHOP_NAME = "Dirndl Wear";

const StoreContext = createContext<State | null>(null);

/** Total quantity of a product in the cart, across all sizes. */
const productQty = (cart: CartItem[], id: number) =>
  cart.reduce((total, item) => (item.id === id ? total + item.qty : total), 0);

/** Quantity of one cart line (one product in one size). */
const lineQty = (cart: CartItem[], id: number, size?: string) =>
  cart.find((item) => sameCartLine(item, id, size))?.qty ?? 0;

/** Adds `delta` units (negative to remove) to a product's size and total stock. */
function adjustStock(product: Product, size: string | undefined, delta: number): Product {
  if (size && product.sizeStock) {
    const sizeStock = {
      ...product.sizeStock,
      [size]: Math.max(0, (product.sizeStock[size] ?? 0) + delta),
    };
    return { ...product, sizeStock, stock: sumSizeStock(sizeStock) };
  }
  return { ...product, stock: Math.max(0, product.stock + delta) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(placeholderProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [headline, setHeadline] = useState(DEFAULT_HEADLINE);
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [user, setUser] = useState<PreviewUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore what this browser saved last time.
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (typeof saved === "object" && saved !== null) {
        const data = saved as Partial<{
          items: CartItem[];
          wishlist: number[];
          orders: Order[];
          headline: string;
          shopName: string;
          user: PreviewUser | null;
        }>;
        if (Array.isArray(data.items)) setItems(data.items);
        if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (typeof data.headline === "string") setHeadline(data.headline);
        if (typeof data.shopName === "string") setShopName(data.shopName);
        if (data.user && typeof data.user.email === "string") setUser(data.user);
      }
    } catch (error) {
      console.error("Could not read saved preview data:", error);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, wishlist, orders, headline, shopName, user }),
      );
    } catch (error) {
      console.error("Could not save preview data:", error);
    }
  }, [ready, items, wishlist, orders, headline, shopName, user]);

  /** True if `qty` more of this line fits the size stock, total stock and the 50 cap. */
  const fits = (cart: CartItem[], product: Product, size: string | undefined, qty: number) =>
    lineQty(cart, product.id, size) + qty <= availableStock(product, size) &&
    productQty(cart, product.id) + qty <= Math.min(product.stock, 50);

  const add = (id: number, qty = 1, size?: string) => {
    const product = catalog.find((entry) => entry.id === id);
    if (!product || !Number.isInteger(qty) || qty < 1 || !fits(items, product, size, qty)) {
      return false;
    }

    setItems((current) => {
      if (!fits(current, product, size, qty)) return current;
      return current.some((item) => sameCartLine(item, id, size))
        ? current.map((item) =>
            sameCartLine(item, id, size) ? { ...item, qty: item.qty + qty } : item,
          )
        : [...current, size ? { id, qty, size } : { id, qty }];
    });
    return true;
  };

  const quantity = (id: number, qty: number, size?: string) =>
    setItems((current) => {
      if (qty <= 0) return current.filter((item) => !sameCartLine(item, id, size));
      const product = catalog.find((entry) => entry.id === id);
      const otherSizes = productQty(current, id) - lineQty(current, id, size);
      const max = product
        ? Math.min(availableStock(product, size), product.stock - otherSizes, 50 - otherSizes)
        : 50 - otherSizes;
      return current.map((item) =>
        sameCartLine(item, id, size)
          ? { ...item, qty: Math.max(1, Math.min(qty, max)) }
          : item,
      );
    });

  const remove = (id: number, size?: string) =>
    setItems((current) => current.filter((item) => !sameCartLine(item, id, size)));

  const toggleWish = (id: number) =>
    setWishlist((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );

  const saveProduct = (input: ProductInput, id?: number) => {
    const { oldPrice, ...rest } = input;
    const existing = id === undefined ? undefined : catalog.find((product) => product.id === id);
    const nextId = id ?? Math.max(0, ...catalog.map((product) => product.id)) + 1;
    // Keep fields the admin form doesn't edit (gallery images, occasions…).
    const product: Product = { ...existing, ...rest, id: nextId };
    if (typeof oldPrice === "number") product.oldPrice = oldPrice;
    else delete product.oldPrice;
    if (product.sizeStock) product.stock = sumSizeStock(product.sizeStock);
    setCatalog((current) =>
      id === undefined
        ? [...current, product]
        : current.map((entry) => (entry.id === id ? product : entry)),
    );
    return product;
  };

  const deleteProduct = (id: number) => {
    setCatalog((current) => current.filter((product) => product.id !== id));
    setItems((current) => current.filter((item) => item.id !== id));
    setWishlist((current) => current.filter((itemId) => itemId !== id));
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const order = orders.find((entry) => entry.id === id);
    if (!order) throw new Error("Order not found.");
    if (order.status === "Cancelled" && status !== "Cancelled") {
      throw new Error("Cancelled orders cannot be reopened.");
    }
    if (status === "Cancelled" && order.status !== "Cancelled") {
      // Put the stock back, size by size.
      setCatalog((current) =>
        current.map((product) =>
          order.items
            .filter((item) => item.productId === product.id)
            .reduce((next, item) => adjustStock(next, item.size, item.qty), product),
        ),
      );
    }
    setOrders((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
    );
  };

  const checkout = (customer: Record<string, string>) => {
    if (!items.length) throw new Error("Your cart is empty.");

    const lines = items.map((item) => {
      const product = catalog.find((entry) => entry.id === item.id);
      if (!product) throw new Error("One or more products are no longer available.");
      if (requiresSize(product.category) && !item.size) {
        throw new Error(`Choose a size for ${product.name} before ordering.`);
      }
      return { item, product };
    });
    for (const { item, product } of lines) {
      const available = availableStock(product, item.size);
      if (item.qty > available || productQty(items, item.id) > product.stock) {
        throw new Error(
          item.size
            ? `Only ${available} ${product.name} left in size ${item.size}.`
            : `Only ${available} ${product.name} left.`,
        );
      }
    }

    const orderItems = lines.map(({ item, product }) => ({
      productId: product.id,
      name: product.name,
      ...(item.size ? { size: item.size } : {}),
      qty: item.qty,
      price: product.price,
    }));
    const order: Order = {
      id: `DW-${String(orders.length + 1).padStart(6, "0")}`,
      customer: `${customer.first ?? ""} ${customer.last ?? ""}`.trim(),
      customerEmail: customer.email ?? "",
      customerPhone: customer.phone ?? "",
      date: new Date().toISOString().slice(0, 10),
      total: orderItems.reduce((sum, item) => sum + item.price * item.qty, 0),
      status: "New",
      paymentStatus: "unpaid",
      items: orderItems,
      shippingAddress: {
        street: customer.street ?? "",
        zip: customer.zip ?? "",
        city: customer.city ?? "",
      },
    };

    setCatalog((current) =>
      current.map((product) =>
        items
          .filter((item) => item.id === product.id)
          .reduce((next, item) => adjustStock(next, item.size, -item.qty), product),
      ),
    );
    setOrders((current) => [order, ...current]);
    return order;
  };

  return (
    <StoreContext.Provider
      value={{
        items,
        wishlist,
        products: catalog,
        orders,
        headline,
        shopName,
        user,
        add,
        remove,
        quantity,
        toggleWish,
        saveProduct,
        deleteProduct,
        updateOrderStatus,
        checkout,
        setHeadline,
        setShopName,
        signIn: setUser,
        signOut: () => setUser(null),
        clear: () => setItems([]),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw Error("Store provider missing");
  return context;
};
