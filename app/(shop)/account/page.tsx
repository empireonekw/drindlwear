"use client";

import { useState } from "react";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

export default function Account() {
  const { user, orders, signIn, signOut } = useStore();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");

  // UI preview: no account is created and nothing leaves the browser.
  // The password field is part of the design only and is never read.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];
    if (!email) {
      setError("Enter your email address.");
      return;
    }
    setError("");
    signIn({ name, email });
  }

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">My Account</h1>
      {user ? (
        <section>
          <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:32px_Georgia,serif] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
            <div>
              <h2 className="font-serif text-2xl">{user.name}</h2>
              <p>{user.email}</p>
            </div>
            <button type="button" className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]" onClick={signOut}>
              SIGN OUT
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
          <h2 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">My Orders</h2>
          {orders.length === 0 && error ? null : orders.length === 0 ? (
            <div className="empty [text-align:center] [padding:100px_0] [color:#777]">
              <p>You have not placed any orders yet.</p>
              <p className="mt-2 text-sm">
                Orders you place in this browser appear here.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <article className="admin-card [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]" key={order.id}>
                <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:32px_Georgia,serif] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
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
                <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eee] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eee] [&_th]:[color:#888] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
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
                      <tr key={`${item.productId}-${item.size ?? ""}`}>
                        <td>
                          {item.name}
                          {item.size ? ` (Size ${item.size})` : ""}
                        </td>
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
        <form className="form-panel [max-width:520px] [margin:40px_auto_90px] [&_label]:[display:block] [&_label]:[margin:17px_0_8px] [&_label]:[font-size:12px] [&_input]:[width:100%] [&_input]:[padding:14px] [&_input]:[border:1px_solid_#ddd] [&_textarea]:[width:100%] [&_textarea]:[padding:14px] [&_textarea]:[border:1px_solid_#ddd] [&_.btn]:[width:100%] [&_.btn]:[margin-top:20px]" onSubmit={handleSubmit}>
          <h2 className="font-serif text-2xl">
            {register ? "Register" : "Sign In"}
          </h2>
          <p className="text-sm text-gray-600">
            Preview mode: accounts aren&apos;t connected yet. No account is
            created and nothing is sent anywhere.
          </p>
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

          <button className="btn [display:inline-flex] [align-items:center] [justify-content:center] [background:#781d2d] [color:white] [padding:16px_27px] [font-size:11px] [letter-spacing:1.5px] [text-transform:uppercase] [transition:.2s] [&:hover]:[background:#9b3345] [&:focus-visible]:[outline:3px_solid_#d9b6b6] [&:focus-visible]:[outline-offset:3px] motion-safe:[transition:color_220ms_ease,_background-color_220ms_ease,_border-color_220ms_ease,_box-shadow_220ms_ease,_transform_220ms_ease] motion-safe:[&:hover]:[transform:translateY(-2px)]">
            {register
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