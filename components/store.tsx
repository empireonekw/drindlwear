"use client";

/**
 * Client store. Accounts are real (MongoDB, see app/api/auth); the signed-in
 * user is loaded from /api/auth/me. Everything else is still UI preview: the
 * cart, wishlist, orders and a few settings live in this browser's
 * localStorage, and products come from lib/placeholder-products.ts and reset
 * on reload.
 */

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  CartItem,
  lineLimit,
  Product,
  requiresSize,
  sameCartLine,
  sumSizeStock,
} from "@/lib/data";
import { placeholderProducts, placeholderSets } from "@/lib/placeholder-products";
import { OutfitSet, setDiscounts, setPricing, totalSetDiscount } from "@/lib/sets";
import { deliveryCharge, PaymentMethodId, paymentMethods } from "@/lib/store-policy";

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
  /** Payment method label, e.g. "Cash on Delivery". */
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
  id: string;
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
  saveProduct: (product: ProductInput, id?: number) => Product;
  deleteProduct: (id: number) => void;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(placeholderProducts);
  const sets = placeholderSets;
  const [orders, setOrders] = useState<Order[]>([]);
  const [headline, setHeadline] = useState(DEFAULT_HEADLINE);
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [ready, setReady] = useState(false);

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
        if (typeof data.headline === "string") setHeadline(data.headline);
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
    if (!set || !pricing) return "This set is no longer available.";

    // Check every piece first so the set goes in whole or not at all.
    let next = items;
    for (const piece of pricing.pieces) {
      const size = requiresSize(piece.category) ? sizes[piece.id] : undefined;
      if (requiresSize(piece.category) && !size) return `Choose a size for ${piece.name}.`;
      if (!fits(next, piece, size, 1, setId)) {
        return size
          ? `${piece.name} is not available in size ${size}.`
          : `${piece.name} is out of stock.`;
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

  const checkout = (customer: Record<string, string>, payment: PaymentMethodId) => {
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
      const available = lineLimit(items, product, item);
      if (item.qty > available) {
        throw new Error(
          item.size
            ? `Only ${available} ${product.name} left in size ${item.size}.`
            : `Only ${available} ${product.name} left.`,
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
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = totalSetDiscount(setDiscounts(items, catalog, sets));
    const deliveryFee = deliveryCharge(subtotal - discount);
    const method = paymentMethods.find((entry) => entry.id === payment) ?? paymentMethods[0];
    const paymentStatus: Record<PaymentMethodId, string> = {
      cod: "To be paid on delivery",
      bank: "Awaiting bank transfer",
      wallet: "Not charged (preview)",
      card: "Not charged (preview)",
    };
    const order: Order = {
      id: `DW-${String(orders.length + 1).padStart(6, "0")}`,
      customer: `${customer.first ?? ""} ${customer.last ?? ""}`.trim(),
      customerEmail: customer.email ?? "",
      customerPhone: customer.phone ?? "",
      date: new Date().toISOString().slice(0, 10),
      subtotal,
      ...(discount > 0 ? { discount } : {}),
      deliveryFee,
      total: subtotal - discount + deliveryFee,
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
