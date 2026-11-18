"use client";

/**
 * Client store. Accounts and products are real (MongoDB): the signed-in user
 * is loaded from /api/auth/me, and the catalogue arrives with each page load
 * (app/layout.tsx) and is changed through /api/admin/products. Everything else
 * is still UI preview: the cart, wishlist, orders and a few settings live in
 * this browser's localStorage, and outfit sets come from
 * lib/placeholder-products.ts.
 */

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  CartItem,
  lineLimit,
  Product,
  requiresSize,
  roundMoney,
  sameCartLine,
  sumSizeStock,
} from "@/lib/data";
import { placeholderSets } from "@/lib/placeholder-products";
import { OutfitSet, setDiscounts, setPricing, totalSetDiscount } from "@/lib/sets";
import { deliveryCharge, deliveryDecided, PaymentMethodId, paymentMethods } from "@/lib/store-policy";

import { useI18n } from "./i18n";

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
  /** What the customer pays: subtotal minus set savings plus delivery. */
  total: number;
  subtotal?: number;
  /** Set savings taken off the subtotal. */
  discount?: number;
  deliveryFee?: number;
  /** Payment method label, e.g. "Bank transfer". */
  paymentMethod?: string;
  status: OrderStatus;
  paymentStatus: string;
  items: {
    productId: number;
    name: string;
    size?: string;
    qty: number;
    price: number;
    /** Name of the outfit set this piece was bought in. */
    setName?: string;
  }[];
  shippingAddress: { street: string; zip: string; city: string };
};

/** `oldPrice: null` clears an existing sale price when editing. */
export type ProductInput = Omit<Product, "id" | "oldPrice"> & {
  oldPrice?: number | null;
};

/** The signed-in customer, as returned by /api/auth/*. */
export type AuthUser = {
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  createdAt: string;
};

type State = {
  items: CartItem[];
  wishlist: number[];
  products: Product[];
  sets: OutfitSet[];
  orders: Order[];
  headline: string;
  shopName: string;
  user: AuthUser | null;
  /** False until the session check with the server has finished. */
  authReady: boolean;
  add: (id: number, qty?: number, size?: string, setId?: string) => boolean;
  /**
   * Adds one of each piece of a set, each in its chosen size. Returns an
   * error message, or null when everything was added.
   */
  addSet: (setId: string, sizes: Record<number, string | undefined>) => string | null;
  remove: (id: number, size?: string, setId?: string) => void;
  quantity: (id: number, qty: number, size?: string, setId?: string) => void;
  toggleWish: (id: number) => void;
  /** False until the catalogue has loaded (only when the page couldn't include it). */
  productsReady: boolean;
  /** Saves to MongoDB. Rejects with a message to show when it fails. */
  saveProduct: (product: ProductInput, id?: number) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  checkout: (customer: Record<string, string>, payment: PaymentMethodId) => Order;
  setHeadline: (headline: string) => void;
  setShopName: (shopName: string) => void;
  /** Stores the user returned by the login or signup API. */
  signIn: (user: AuthUser) => void;
  signOut: () => Promise<void>;
  clear: () => void;
};

const STORAGE_KEY = "dw-ui-preview";
const DEFAULT_HEADLINE = "Traditional Dresses.";
/** A short-lived default some browsers saved; treated as "never changed". */
const DISCARDED_HEADLINE = "Pure Tradition";
const DEFAULT_SHOP_NAME = "Dirndl Wear";

const StoreContext = createContext<State | null>(null);

/** Quantity of one cart line (one product, size and set). */
const lineQty = (cart: CartItem[], id: number, size?: string, setId?: string) =>
  cart.find((item) => sameCartLine(item, id, size, setId))?.qty ?? 0;

/** Adds `qty` to a cart line, creating the line if needed. */
function withLine(cart: CartItem[], id: number, qty: number, size?: string, setId?: string) {
  return cart.some((item) => sameCartLine(item, id, size, setId))
    ? cart.map((item) =>
        sameCartLine(item, id, size, setId) ? { ...item, qty: item.qty + qty } : item,
      )
    : [...cart, { id, qty, ...(size ? { size } : {}), ...(setId ? { setId } : {}) }];
}

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

/** Calls a product API route and returns its JSON, or throws the server's message. */
async function productRequest<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 403) throw new Error("Your admin session has ended. Sign in again.");
  if (!response.ok) throw new Error(data.error ?? "The product could not be saved. Please try again.");
  return data;
}

export function StoreProvider({
  children,
  initialProducts,
}: {
  children: React.ReactNode;
  /** The catalogue from the server, or null when the page couldn't load it. */
  initialProducts: Product[] | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(initialProducts ?? []);
  const [productsReady, setProductsReady] = useState(initialProducts !== null);
  // Messages for shoppers (set and checkout errors) in the shop's language.
  const { t } = useI18n();
  const sets = placeholderSets;
  const [orders, setOrders] = useState<Order[]>([]);
  const [headline, setHeadline] = useState(DEFAULT_HEADLINE);
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [ready, setReady] = useState(false);

  // The page normally arrives with the catalogue; if it didn't, fetch it.
  useEffect(() => {
    if (initialProducts !== null) return;
    let cancelled = false;
    fetch("/api/products", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled && Array.isArray(data.products)) setCatalog(data.products);
      })
      .catch((error) => console.error("Could not load products:", error))
      .finally(() => {
        if (!cancelled) setProductsReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ask the server who is signed in (the session cookie is httpOnly).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user?: AuthUser | null }) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch((error) => console.error("Could not check the session:", error))
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

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
        }>;
        if (Array.isArray(data.items)) setItems(data.items);
        if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (typeof data.headline === "string" && data.headline !== DISCARDED_HEADLINE) setHeadline(data.headline);
        if (typeof data.shopName === "string") setShopName(data.shopName);
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
        JSON.stringify({ items, wishlist, orders, headline, shopName }),
      );
    } catch (error) {
      console.error("Could not save preview data:", error);
    }
  }, [ready, items, wishlist, orders, headline, shopName]);

  /** True if `qty` more fits on this line, given stock and the cart's other lines. */
  const fits = (
    cart: CartItem[],
    product: Product,
    size: string | undefined,
    qty: number,
    setId?: string,
  ) => lineQty(cart, product.id, size, setId) + qty <= lineLimit(cart, product, { size, setId });

  const add = (id: number, qty = 1, size?: string, setId?: string) => {
    const product = catalog.find((entry) => entry.id === id);
    if (!product || !Number.isInteger(qty) || qty < 1 || !fits(items, product, size, qty, setId)) {
      return false;
    }
    setItems((current) =>
      fits(current, product, size, qty, setId) ? withLine(current, id, qty, size, setId) : current,
    );
    return true;
  };

  const addSet = (setId: string, sizes: Record<number, string | undefined>) => {
    const set = sets.find((entry) => entry.id === setId);
    const pricing = set && setPricing(set, catalog);
    if (!set || !pricing) return t("This set is no longer available.");

    // Check every piece first so the set goes in whole or not at all.
    let next = items;
    for (const piece of pricing.pieces) {
      const size = requiresSize(piece.category) ? sizes[piece.id] : undefined;
      if (requiresSize(piece.category) && !size) return t("Choose a size for {pieces}.", { pieces: piece.name });
      if (!fits(next, piece, size, 1, setId)) {
        return size
          ? t("{name} is not available in size {size}.", { name: piece.name, size })
          : t("{name} is out of stock.", { name: piece.name });
      }
      next = withLine(next, piece.id, 1, size, setId);
    }
    setItems(next);
    return null;
  };

  const quantity = (id: number, qty: number, size?: string, setId?: string) =>
    setItems((current) => {
      if (qty <= 0) return current.filter((item) => !sameCartLine(item, id, size, setId));
      const product = catalog.find((entry) => entry.id === id);
      const max = product ? lineLimit(current, product, { size, setId }) : 50;
      return current.map((item) =>
        sameCartLine(item, id, size, setId)
          ? { ...item, qty: Math.max(1, Math.min(qty, max)) }
          : item,
      );
    });

  const remove = (id: number, size?: string, setId?: string) =>
    setItems((current) => current.filter((item) => !sameCartLine(item, id, size, setId)));

  const toggleWish = (id: number) =>
    setWishlist((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );

  const saveProduct = async (input: ProductInput, id?: number) => {
    const { oldPrice, ...rest } = input;
    const body = { ...rest, ...(typeof oldPrice === "number" ? { oldPrice } : {}) };
    const { product } =
      id === undefined
        ? await productRequest<{ product: Product }>("/api/admin/products", { product: body })
        : await productRequest<{ product: Product }>(`/api/admin/products/${id}`, { action: "update", product: body });
    setCatalog((current) =>
      current.some((entry) => entry.id === product.id)
        ? current.map((entry) => (entry.id === product.id ? product : entry))
        : [...current, product],
    );
    return product;
  };

  const deleteProduct = async (id: number) => {
    await productRequest(`/api/admin/products/${id}`, { action: "delete" });
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

  const checkout = (customer: Record<string, string>, payment: PaymentMethodId) => {
    if (!items.length) throw new Error(t("Your cart is empty."));

    const lines = items.map((item) => {
      const product = catalog.find((entry) => entry.id === item.id);
      if (!product) throw new Error(t("One or more products are no longer available."));
      if (requiresSize(product.category) && !item.size) {
        throw new Error(t("Choose a size for {name} before ordering.", { name: product.name }));
      }
      return { item, product };
    });
    for (const { item, product } of lines) {
      const available = lineLimit(items, product, item);
      if (item.qty > available) {
        throw new Error(
          item.size
            ? t("Only {count} × {name} left in size {size}.", { count: available, name: product.name, size: item.size })
            : t("Only {count} × {name} left.", { count: available, name: product.name }),
        );
      }
    }

    const orderItems = lines.map(({ item, product }) => {
      const setName = item.setId ? sets.find((set) => set.id === item.setId)?.name : undefined;
      return {
        productId: product.id,
        name: product.name,
        ...(item.size ? { size: item.size } : {}),
        qty: item.qty,
        price: product.price,
        ...(setName ? { setName } : {}),
      };
    });
    const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.price * item.qty, 0));
    const discount = roundMoney(totalSetDiscount(setDiscounts(items, catalog, sets)));
    const deliveryFee = deliveryCharge(subtotal - discount);
    const method = paymentMethods.find((entry) => entry.id === payment) ?? paymentMethods[0];
    const paymentStatus: Record<PaymentMethodId, string> = {
      bank: "Awaiting bank transfer",
    };
    const order: Order = {
      id: `DW-${String(orders.length + 1).padStart(6, "0")}`,
      customer: `${customer.first ?? ""} ${customer.last ?? ""}`.trim(),
      customerEmail: customer.email ?? "",
      customerPhone: customer.phone ?? "",
      date: new Date().toISOString().slice(0, 10),
      subtotal,
      ...(discount > 0 ? { discount } : {}),
      // Left out while shipping costs are undecided, so the order doesn't claim "free".
      ...(deliveryDecided ? { deliveryFee } : {}),
      total: roundMoney(subtotal - discount + deliveryFee),
      paymentMethod: method.label,
      status: "New",
      paymentStatus: paymentStatus[method.id],
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
        productsReady,
        sets,
        orders,
        headline,
        shopName,
        user,
        authReady,
        add,
        addSet,
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
        signOut,
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
