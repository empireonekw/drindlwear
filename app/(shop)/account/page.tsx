"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";
import { useAutoRefresh } from "@/lib/use-auto-refresh";

type AccountUser = { name: string; email: string; role: string };
type AccountOrder = {
  id: string;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
  customerPhone?: string;
  items: { productId: number; name: string; qty: number; price: number }[];
  shippingAddress: { street: string; zip: string; city: string };
};

export default function Account() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  const loadAccount = useCallback(async () => {
    const userResponse = await fetch("/api/auth/me", { cache: "no-store" });
    if (userResponse.status === 401) {
      setUser(null);
      setOrders([]);
      return;
    }
    const userPayload: unknown = await userResponse.json();
    if (
      !userResponse.ok ||
      typeof userPayload !== "object" ||
      userPayload === null ||
      !("user" in userPayload) ||
      typeof userPayload.user !== "object" ||
      userPayload.user === null
    ) {
      throw new Error("Could not load your account.");
    }

    const accountUser = userPayload.user as AccountUser;
    setUser(accountUser);
    const ordersResponse = await fetch("/api/orders?scope=mine", {
      cache: "no-store",
    });
    const ordersPayload: unknown = await ordersResponse.json();
    if (
      !ordersResponse.ok ||
      typeof ordersPayload !== "object" ||
      ordersPayload === null ||
      !("orders" in ordersPayload) ||
      !Array.isArray(ordersPayload.orders)
    ) {
      throw new Error(
        typeof ordersPayload === "object" &&
          ordersPayload !== null &&
          "error" in ordersPayload &&
          typeof ordersPayload.error === "string"
          ? ordersPayload.error
          : "Could not load your orders.",
      );
    }

    setOrders(ordersPayload.orders as AccountOrder[]);
  }, []);
  useAutoRefresh(loadAccount);

  useEffect(() => {
    let active = true;
    void loadAccount()
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your account.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [loadAccount]);

  async function signOut() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out.");
      window.dispatchEvent(new Event("dw-auth-changed"));
      setUser(null);
      setOrders([]);
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Could not sign out.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const body = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch(
        register ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Could not sign in.";
        throw new Error(message);
      }

      const role =
        typeof payload === "object" &&
        payload !== null &&
        "user" in payload &&
        typeof payload.user === "object" &&
        payload.user !== null &&
        "role" in payload.user
          ? payload.user.role
          : "customer";
      window.dispatchEvent(new Event("dw-auth-changed"));
      if (role === "admin") {
        router.replace("/admin");
      } else {
        await loadAccount();
        router.replace("/account");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-heading">My Account</h1>
      {user ? (
        <section>
          <div className="admin-head">
            <div>
              <h2 className="font-serif text-2xl">{user.name}</h2>
              <p>{user.email}</p>
            </div>
            <button type="button" className="btn" onClick={signOut}>
              SIGN OUT
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <h2 className="page-heading">My Orders</h2>
          {orders.length === 0 && error ? null : orders.length === 0 ? (
            <div className="empty">
              <p>You have not placed any orders yet.</p>
            </div>
          ) : (
            orders.map((order) => (
              <article className="admin-card" key={order.id}>
                <div className="admin-head">
                  <div>
                    <h3 className="font-serif text-xl">
                      Order {formatOrderId(order.id)}
                    </h3>
                    <p>Placed {order.date}</p>
                  </div>
                  <div>
                    <p><strong>{order.status}</strong></p>
                    <p>{order.paymentStatus}</p>
                  </div>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>{money(item.price)}</td>
                        <td>{money(item.price * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-5">
                  Phone: {order.customerPhone || "Not provided"}
                </p>
                <p className="mt-2">
                  Shipping to: {order.shippingAddress.street},{" "}
                  {order.shippingAddress.city}, {order.shippingAddress.zip}
                </p>
                <p className="mt-3 font-bold">Order total: {money(order.total)}</p>
              </article>
            ))
          )}
        </section>
      ) : (
        <form className="form-panel" onSubmit={handleSubmit}>
          <h2 className="font-serif text-2xl">
            {register ? "Register" : "Sign In"}
          </h2>
          {error && <p role="alert">{error}</p>}

          {register && (
            <>
              <label htmlFor="account-name">Name</label>
              <input id="account-name" name="name" required />
            </>
          )}

          <label htmlFor="account-email">Email Address</label>
          <input id="account-email" name="email" type="email" required />

          <label htmlFor="account-password">Password</label>
          <input
            id="account-password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={register ? "new-password" : "current-password"}
            required
          />

          <button className="btn" disabled={submitting}>
            {submitting
              ? "PLEASE WAIT..."
              : register
                ? "CREATE ACCOUNT"
                : "SIGN IN"}
          </button>
          <button
            type="button"
            className="block mt-5 underline text-sm"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already have an account? Sign In"
              : "New here? Register"}
          </button>
        </form>
      )}
    </div>
  );
}