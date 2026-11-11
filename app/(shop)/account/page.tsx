"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail, Phone, CalendarDays } from "lucide-react";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

export default function Account() {
  const router = useRouter();
  const { user, authReady, orders, signOut } = useStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (authReady && !user && !signingOut) router.replace("/account/login");
  }, [authReady, user, signingOut, router]);

  if (!authReady || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#786565]" role="status">
        <Loader2 className="mr-2 animate-spin text-[#781d2d]" size={20} aria-hidden="true" />
        Loading your account…
      </div>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/");
  }

  // Orders are still kept in this browser; show the ones placed with this email.
  const myOrders = orders.filter(
    (order) => order.customerEmail.trim().toLowerCase() === user.email,
  );
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container [max-width:1360px] [margin:0_auto] [padding:0_32px] max-[520px]:[padding:0_17px]">
      <h1 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">My Account</h1>
        <section>
          <div className="mx-auto mb-10 mt-8 flex max-w-[1100px] flex-wrap items-center gap-6 bg-white p-6 shadow-[0_12px_36px_rgb(74_20_32_/_8%)] sm:p-8">
            <div
              className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-[#781d2d] font-serif text-2xl tracking-wider text-white"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[2.5px] text-[#786565]">Welcome back</p>
              <h2 className="truncate font-serif text-[28px] text-[#211c1d]">{user.name}</h2>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#786565]">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} aria-hidden="true" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} aria-hidden="true" /> {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} aria-hidden="true" /> Member since {memberSince}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 border border-[#781d2d] px-6 py-3 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#781d2d] transition-colors hover:bg-[#781d2d] hover:text-white disabled:opacity-60"
            >
              {signingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
          <h2 className="page-heading [text-align:center] [font:42px_Georgia,serif] [margin:35px_0_14px] [color:#781d2d]">My Orders</h2>
          {myOrders.length === 0 ? (
            <div className="empty [text-align:center] [padding:100px_0] [color:#777]">
              <p>You have not placed any orders yet.</p>
              <p className="mt-2 text-sm">
                Orders you place with {user.email} appear here.
              </p>
            </div>
          ) : (
            myOrders.map((order) => (
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
                      <tr key={`${item.productId}-${item.size ?? ""}-${item.setName ?? ""}`}>
                        <td>
                          {item.name}
                          {item.size ? ` (Size ${item.size})` : ""}
                          {item.setName && (
                            <span className="block text-xs text-[#786565]">Part of {item.setName}</span>
                          )}
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
                {order.discount ? (
                  <p className="mt-3 text-[#1f6b44]">Set savings: −{money(order.discount)}</p>
                ) : null}
                {order.deliveryFee !== undefined && (
                  <p className="mt-2">
                    Delivery: {order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)}
                  </p>
                )}
                {order.paymentMethod && <p className="mt-2">Payment: {order.paymentMethod}</p>}
                <p className="mt-3 font-bold">Order total: {money(order.total)}</p>
              </article>
            ))
          )}
        </section>
    </div>
  );
}
