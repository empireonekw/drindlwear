"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { initialOrders, Product, products } from "@/lib/data";

type Order = (typeof initialOrders)[number];

type State = {
  items: { id: number; qty: number }[];
  wishlist: number[];
  products: Product[];
  orders: Order[];
  add: (id: number) => void;
  remove: (id: number) => void;
  quantity: (id: number, qty: number) => void;
  toggleWish: (id: number) => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clear: () => void;
};

const StoreContext = createContext<State | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<State["items"]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [catalog, setProducts] = useState<Product[]>(products);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("kruger-demo");
      if (savedState) {
        const data = JSON.parse(savedState);
        setItems(data.items || []);
        setWishlist(data.wishlist || []);
        setProducts(data.catalog || products);
        setOrders(data.orders || initialOrders);
      }
    } catch {}

    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(
        "kruger-demo",
        JSON.stringify({ items, wishlist, catalog, orders }),
      );
    }
  }, [ready, items, wishlist, catalog, orders]);

  const add = (id: number) =>
    setItems((currentItems) => {
      const found = currentItems.find((item) => item.id === id);
      return found
        ? currentItems.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [...currentItems, { id, qty: 1 }];
    });

  const quantity = (id: number, qty: number) =>
    setItems((currentItems) =>
      qty <= 0
        ? currentItems.filter((item) => item.id !== id)
        : currentItems.map((item) =>
            item.id === id ? { ...item, qty } : item,
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
        add,
        remove,
        quantity,
        toggleWish,
        setProducts,
        setOrders,
        clear: () => setItems([]),
      }}
    >
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
