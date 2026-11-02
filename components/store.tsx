"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product, products } from "@/lib/data";
import { notifyDataChanged, useAutoRefresh } from "@/lib/use-auto-refresh";

type Order = {
  id: string;
  customer: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string;
  total: number;
  status: string;
  paymentStatus?: string;
  items?: { productId: number; name: string; qty: number; price: number }[];
  shippingAddress?: { street: string; zip: string; city: string };
};

type State = {
  items: { id: number; qty: number }[];
  wishlist: number[];
  products: Product[];
  orders: Order[];
  backendError: string | null;
  add: (id: number, qty?: number) => boolean;
  remove: (id: number) => void;
  quantity: (id: number, qty: number) => void;
  toggleWish: (id: number) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  saveProduct: (
    product: Omit<Product, "id">,
    id?: number,
  ) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  checkout: (customer: Record<string, string>) => Promise<Order>;
  clear: () => void;
};

const StoreContext = createContext<State | null>(null);

function responseError(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return fallback;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<State["items"]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setProducts] = useState<Product[]>(products);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [wishlistAuthenticated, setWishlistAuthenticated] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);

  const refreshProducts = useCallback(async () => {
    const response = await fetch("/api/products", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok || typeof payload !== "object" || payload === null || !("products" in payload) || !Array.isArray(payload.products)) {
      throw new Error(responseError(payload, "Could not load products."));
    }
    setProducts(payload.products as Product[]);
  }, []);

  const refreshOrders = useCallback(async () => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.status === 401) {
      setOrders([]);
      return;
    }
    const payload: unknown = await response.json();
    if (!response.ok || typeof payload !== "object" || payload === null || !("orders" in payload) || !Array.isArray(payload.orders)) {
      throw new Error(responseError(payload, "Could not load orders."));
    }
    setOrders(payload.orders as Order[]);
  }, []);

  const saveProduct = async (product: Omit<Product, "id">, id?: number) => {
    const response = await fetch(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const payload: unknown = await response.json();
    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("product" in payload)
    ) {
      throw new Error(responseError(payload, "Could not save product."));
    }
    await refreshProducts();
    notifyDataChanged();
    return payload.product as Product;
  };

  const deleteProduct = async (id: number) => {
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(responseError(payload, "Could not delete product."));
    }
    await refreshProducts();
    notifyDataChanged();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new Error(responseError(payload, "Could not update order."));
    }
    await refreshOrders();
    if (status === "Cancelled") await refreshProducts();
    notifyDataChanged();
  };

  const checkout = async (customer: Record<string, string>) => {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items }),
    });
    const payload: unknown = await response.json();
    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("order" in payload)
    ) {
      if (response.status === 409) {
        try {
          await refreshProducts();
        } catch (refreshError) {
          console.error("Could not refresh inventory after checkout conflict:", refreshError);
          setBackendError("Could not refresh product stock. Reload the page and try again.");
        }
      }
      throw new Error(responseError(payload, "Could not place order."));
    }
    const order = payload.order as Order;
    setOrders((current) => [order, ...current]);
    notifyDataChanged();
    void refreshProducts().catch((refreshError: unknown) => {
      console.error("Could not refresh inventory after checkout:", refreshError);
      setBackendError("Order placed, but inventory could not be refreshed.");
    });
    return order;
  };

  useEffect(() => {
    async function loadBackendData() {
      let savedItems: State["items"] = [];
      let savedWishlist: number[] = [];

      try {
        const savedState = localStorage.getItem("kruger-demo");
        if (savedState) {
          const data: unknown = JSON.parse(savedState);
          if (typeof data === "object" && data !== null) {
            if ("items" in data && Array.isArray(data.items)) {
              savedItems = data.items as State["items"];
            }
            if ("wishlist" in data && Array.isArray(data.wishlist)) {
              savedWishlist = data.wishlist as number[];
            }
          }
        }
      } catch (error) {
        console.error("Could not read saved storefront state:", error);
        setBackendError("Saved browser data could not be read.");
      }

      setWishlist(savedWishlist);
      try {
        const [productsResponse, cartResponse] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/cart", { cache: "no-store" }),
        ]);
        const productsPayload: unknown = await productsResponse.json();
        const cartPayload: unknown = await cartResponse.json();

        if (
          !productsResponse.ok ||
          typeof productsPayload !== "object" ||
          productsPayload === null ||
          !("products" in productsPayload) ||
          !Array.isArray(productsPayload.products)
        ) {
          throw new Error(
            responseError(productsPayload, "Could not load products."),
          );
        }
        if (
          !cartResponse.ok ||
          typeof cartPayload !== "object" ||
          cartPayload === null ||
          !("items" in cartPayload) ||
          !Array.isArray(cartPayload.items)
        ) {
          throw new Error(responseError(cartPayload, "Could not load cart."));
        }

        setProducts(productsPayload.products as Product[]);
        setItems(cartPayload.items as State["items"]);
        setBackendAvailable(true);
        setBackendError(null);
      } catch (error) {
        setItems(savedItems);
        setBackendAvailable(false);
        setBackendError(
          error instanceof Error ? error.message : "Backend could not be reached.",
        );
      } finally {
        setReady(true);
      }
    }

    void loadBackendData();
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("kruger-demo", JSON.stringify({ items, wishlist }));
  }, [ready, items, wishlist]);

  useEffect(() => {
    const handleAuthChange = () => setAuthRevision((revision) => revision + 1);
    window.addEventListener("dw-auth-changed", handleAuthChange);
    return () => window.removeEventListener("dw-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!ready || !backendAvailable) return;
    let active = true;
    fetch("/api/wishlist", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          if (active) setWishlistAuthenticated(false);
          return;
        }
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("wishlist" in payload) ||
          !Array.isArray(payload.wishlist)
        ) {
          throw new Error(responseError(payload, "Could not load wishlist."));
        }
        if (active) {
          setWishlist(payload.wishlist as number[]);
          setWishlistAuthenticated(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setBackendError(
            error instanceof Error ? error.message : "Could not load wishlist.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [ready, backendAvailable, authRevision]);

  useAutoRefresh(async (reason) => {
    if (!ready) return;
    try {
      const responses = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/wishlist", { cache: "no-store" }),
        ...(reason === "focus"
          ? [fetch("/api/cart", { cache: "no-store" })]
          : []),
      ]);
      const payloads: unknown[] = await Promise.all(
        responses.map((response) => response.json()),
      );
      const [productsResponse, ordersResponse, wishlistResponse, cartResponse] =
        responses;
      const [productsPayload, ordersPayload, wishlistPayload, cartPayload] =
        payloads;

      if (
        !productsResponse.ok ||
        typeof productsPayload !== "object" ||
        productsPayload === null ||
        !("products" in productsPayload) ||
        !Array.isArray(productsPayload.products)
      ) {
        throw new Error(responseError(productsPayload, "Could not refresh products."));
      }
      if (
        ordersResponse.status !== 401 &&
        (!ordersResponse.ok ||
          typeof ordersPayload !== "object" ||
          ordersPayload === null ||
          !("orders" in ordersPayload) ||
          !Array.isArray(ordersPayload.orders))
      ) {
        throw new Error(responseError(ordersPayload, "Could not refresh orders."));
      }
      if (
        wishlistResponse.status !== 401 &&
        (!wishlistResponse.ok ||
          typeof wishlistPayload !== "object" ||
          wishlistPayload === null ||
          !("wishlist" in wishlistPayload) ||
          !Array.isArray(wishlistPayload.wishlist))
      ) {
        throw new Error(responseError(wishlistPayload, "Could not refresh wishlist."));
      }
      if (
        cartResponse &&
        (!cartResponse.ok ||
          typeof cartPayload !== "object" ||
          cartPayload === null ||
          !("items" in cartPayload) ||
          !Array.isArray(cartPayload.items))
      ) {
        throw new Error(responseError(cartPayload, "Could not refresh cart."));
      }

      setProducts(productsPayload.products as Product[]);
      setBackendAvailable(true);
      if (cartResponse) {
        setItems((current) => {
          const next = (cartPayload as { items: State["items"] }).items;
          return current.length === next.length &&
            current.every(
              (item, index) =>
                item.id === next[index]?.id && item.qty === next[index]?.qty,
            )
            ? current
            : next;
        });
      }
      setOrders(
        ordersResponse.status === 401
          ? []
          : (ordersPayload as { orders: Order[] }).orders,
      );
      if (wishlistResponse.status === 401) {
        setWishlistAuthenticated(false);
      } else {
        setWishlist((current) => {
          const next = (wishlistPayload as { wishlist: number[] }).wishlist;
          return current.length === next.length &&
            current.every((id, index) => id === next[index])
            ? current
            : next;
        });
        setWishlistAuthenticated(true);
      }
      setBackendError(null);
    } catch (error) {
      console.error("Could not refresh storefront data:", error);
      setBackendError(
        error instanceof Error ? error.message : "Could not refresh storefront data.",
      );
    }
  });

  useEffect(() => {
    if (!ready || !backendAvailable) return;
    void fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then(async (response) => {
      if (!response.ok) {
        const payload: unknown = await response.json();
        setBackendError(responseError(payload, "Could not save cart."));
        setBackendAvailable(false);
      }
    }).catch((error: unknown) => {
      console.error("Could not save cart:", error);
      setBackendError("Could not save cart to the backend.");
      setBackendAvailable(false);
    });
  }, [ready, backendAvailable, items]);

  useEffect(() => {
    if (!ready || !backendAvailable || !wishlistAuthenticated) return;
    void fetch("/api/wishlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlist }),
    }).then(async (response) => {
      if (response.status === 401) {
        setWishlistAuthenticated(false);
        return;
      }
      if (!response.ok) {
        const payload: unknown = await response.json();
        setBackendError(responseError(payload, "Could not save wishlist."));
      }
    }).catch((error: unknown) => {
      console.error("Could not save wishlist:", error);
      setBackendError("Could not save wishlist to the backend.");
    });
  }, [ready, backendAvailable, wishlistAuthenticated, wishlist]);

  const add = (id: number, qty = 1) => {
    const stock = catalog.find((product) => product.id === id)?.stock ?? 0;
    const inCart = items.find((item) => item.id === id)?.qty ?? 0;
    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      inCart + qty > stock ||
      inCart + qty > 50
    ) {
      return false;
    }

    setItems((currentItems) => {
      const currentQty =
        currentItems.find((item) => item.id === id)?.qty ?? 0;
      if (currentQty + qty > stock || currentQty + qty > 50) {
        return currentItems;
      }

      const found = currentItems.some((item) => item.id === id);
      return found
        ? currentItems.map((item) =>
            item.id === id ? { ...item, qty: item.qty + qty } : item,
          )
        : [...currentItems, { id, qty }];
    });
    return true;
  };

  const quantity = (id: number, qty: number) =>
    setItems((currentItems) =>
      qty <= 0
        ? currentItems.filter((item) => item.id !== id)
        : currentItems.map((item) =>
            item.id === id ? { ...item, qty: Math.min(qty, 50) } : item,
          ),
    );

  const remove = (id: number) =>
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id),
    );

  const toggleWish = (id: number) =>
    setWishlist((currentWishlist) =>
      currentWishlist.includes(id)
        ? currentWishlist.filter((itemId) => itemId !== id)
        : [...currentWishlist, id],
    );

  return (
    <StoreContext.Provider
      value={{
        items,
        wishlist,
        products: catalog,
        orders,
        backendError,
        add,
        remove,
        quantity,
        toggleWish,
        setProducts,
        setOrders,
        refreshProducts,
        refreshOrders,
        saveProduct,
        deleteProduct,
        updateOrderStatus,
        checkout,
        clear: () => setItems([]),
      }}
    >
      {backendError && (
        <div
          role="status"
          style={{
            background: "#fff3cd",
            color: "#664d03",
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          Backend connection issue: {backendError}
        </div>
      )}
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw Error("Store provider missing");
  }
  return context;
};
