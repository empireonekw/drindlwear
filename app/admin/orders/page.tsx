"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import { OrderStatus, useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

const orderStatuses: OrderStatus[] = [
  "New",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function Orders() {
  const { orders, updateOrderStatus } = useStore();
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  useEffect(() => {
    if (!selectedOrderId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedOrderId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedOrderId]);

  function changeStatus(orderId: string, status: OrderStatus) {
    setError("");
    try {
      updateOrderStatus(orderId, status);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update order.",
      );
    }
  }

  return (
    <>
      <div className="admin-head [display:flex] [justify-content:space-between] [align-items:center] [margin-bottom:30px] [&_h1]:[font:32px_Georgia,serif] max-[520px]:[flex-wrap:wrap] max-[520px]:[gap:12px] max-[520px]:[&_h1]:[font-size:27px]">
        <h1>Orders</h1>
        <span>{orders.length} Orders</span>
      </div>
      {error && <p role="alert">{error}</p>}

      <div className="admin-card [background:white] [border:1px_solid_#eee] [border-radius:8px] [padding:25px] [margin:25px_0] [overflow-x:auto] [min-width:0] motion-safe:[transition:transform_240ms_ease,_box-shadow_240ms_ease] motion-safe:[&:hover]:[transform:translateY(-3px)] motion-safe:[&:hover]:[box-shadow:0_12px_28px_rgb(33_28_29_/_8%)]">
        <table className="admin-table [width:100%] [border-collapse:collapse] [text-align:left] [font-size:13px] [&_th]:[padding:15px_12px] [&_th]:[border-bottom:1px_solid_#eee] [&_td]:[padding:15px_12px] [&_td]:[border-bottom:1px_solid_#eee] [&_th]:[color:#888] [&_th]:[font-size:11px] [&_th]:[text-transform:uppercase] [&_th]:[letter-spacing:1px] [&_img]:[height:52px] [&_img]:[width:45px] [&_img]:[object-fit:cover] [&_button]:[color:#781d2d]">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{formatOrderId(order.id)}</strong>
                  </td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>{money(order.total)}</td>
                  <td>
                    <select
                      className="field [padding:12px] [border:1px_solid_#ddd] [background:white]"
                      aria-label={`Change status for order ${order.id}`}
                      value={order.status}
                      onChange={(event) =>
                        changeStatus(order.id, event.target.value as OrderStatus)
                      }
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="order-view-button [display:inline-flex] [align-items:center] [gap:7px] [border:1px_solid_#ead9d7] [border-radius:6px] [padding:8px_11px] [color:#781d2d] [background:#fff] [font-size:12px] [font-weight:600] [transition:background_.2s,_border-color_.2s] [&:hover]:[background:#fbf3f1] [&:hover]:[border-color:#c99e99]"
                      aria-label={`View details for order ${order.id}`}
                      title="View order details"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <Eye size={18} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <div
          className="order-dialog-backdrop [position:fixed] [inset:0] [z-index:1000] [display:flex] [align-items:center] [justify-content:center] [padding:24px] [background:#21131699] [backdrop-filter:blur(3px)] max-[520px]:[align-items:flex-end] max-[520px]:[padding:0]"
          onClick={() => setSelectedOrderId(null)}
        >
          <section
            className="order-dialog [width:min(760px,_100%)] [max-height:min(88vh,_900px)] [overflow-y:auto] [border-radius:12px] [background:#fff] [box-shadow:0_24px_80px_#190b0e40] max-[520px]:[max-height:92vh] max-[520px]:[border-radius:14px_14px_0_0]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="order-dialog-header [display:flex] [align-items:flex-start] [justify-content:space-between] [padding:25px_30px_22px] [border-bottom:1px_solid_#eee8e7] [background:#fcf8f6] [&_h2]:[margin:7px_0_4px] [&_h2]:[color:#35171e] [&_h2]:[font:28px_Georgia,serif] [&_p]:[color:#786f6e] [&_p]:[font-size:13px] max-[520px]:[padding:21px_20px_17px]">
              <div>
                <span className="order-dialog-eyebrow [display:block] [color:#927d7b] [font-size:10px] [font-weight:700] [letter-spacing:1.2px]">ORDER DETAILS</span>
                <h2 id="order-dialog-title">
                  {formatOrderId(selectedOrder.id)}
                </h2>
                <p>Placed on {selectedOrder.date}</p>
              </div>
              <button
                type="button"
                className="order-dialog-close [display:grid] [width:36px] [height:36px] [place-items:center] [border:1px_solid_#e8ddda] [border-radius:50%] [color:#5b3035] [background:white] [&:hover]:[background:#f5eae8]"
                aria-label="Close order details"
                onClick={() => setSelectedOrderId(null)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="order-dialog-content [padding:25px_30px_30px] max-[520px]:[padding:20px]">
              <div className="order-detail-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:12px] max-[520px]:[grid-template-columns:1fr]">
                <div className="order-detail-card [display:flex] [min-width:0] [flex-direction:column] [gap:7px] [padding:16px] [border:1px_solid_#eee8e7] [border-radius:8px] [color:#544849] [font-size:13px] [overflow-wrap:anywhere] [&_strong]:[color:#302326] [&_strong]:[font-size:14px]">
                  <span className="order-detail-label [display:block] [color:#927d7b] [font-size:10px] [font-weight:700] [letter-spacing:1.2px] [margin-bottom:3px]">CUSTOMER</span>
                  <strong>{selectedOrder.customer}</strong>
                  <span>{selectedOrder.customerEmail || "Email unavailable"}</span>
                  <span>{selectedOrder.customerPhone || "Phone not provided"}</span>
                </div>
                <div className="order-detail-card [display:flex] [min-width:0] [flex-direction:column] [gap:7px] [padding:16px] [border:1px_solid_#eee8e7] [border-radius:8px] [color:#544849] [font-size:13px] [overflow-wrap:anywhere] [&_strong]:[color:#302326] [&_strong]:[font-size:14px]">
                  <span className="order-detail-label [display:block] [color:#927d7b] [font-size:10px] [font-weight:700] [letter-spacing:1.2px] [margin-bottom:3px]">DELIVERY ADDRESS</span>
                  {selectedOrder.shippingAddress ? (
                    <strong>
                      {selectedOrder.shippingAddress.street}
                      <br />
                      {selectedOrder.shippingAddress.city},{" "}
                      {selectedOrder.shippingAddress.zip}
                    </strong>
                  ) : (
                    <strong>Address unavailable</strong>
                  )}
                </div>
                <div className="order-detail-card order-detail-summary [display:flex] [min-width:0] [flex-direction:column] [gap:7px] [padding:16px] [border:1px_solid_#eee8e7] [border-radius:8px] [color:#544849] [font-size:13px] [overflow-wrap:anywhere] [&_strong]:[color:#302326] [&_strong]:[font-size:14px] [grid-column:1_/_-1] [flex-direction:row] [align-items:center] [justify-content:space-between] [&_.order-detail-label]:[margin:0] max-[520px]:[grid-column:auto] max-[520px]:[flex-wrap:wrap] max-[520px]:[justify-content:flex-start] max-[520px]:[gap:10px_18px]">
                  <span className="order-detail-label [display:block] [color:#927d7b] [font-size:10px] [font-weight:700] [letter-spacing:1.2px] [margin-bottom:3px]">ORDER STATUS</span>
                  <strong>{selectedOrder.status}</strong>
                  <span>
                    Payment: {selectedOrder.paymentStatus || "unpaid"}
                  </span>
                </div>
              </div>

              <h3 className="order-items-heading [margin:25px_0_12px] [color:#35171e] [font:20px_Georgia,serif]">Items ordered</h3>
              {selectedOrder.items?.length ? (
                <div className="order-items-list [border-top:1px_solid_#eee8e7]">
                  {selectedOrder.items.map((item) => (
                    <div className="order-item-row [display:flex] [align-items:center] [justify-content:space-between] [gap:16px] [padding:14px_2px] [border-bottom:1px_solid_#eee8e7] [font-size:13px] [&_div]:[display:flex] [&_div]:[flex-direction:column] [&_div]:[gap:5px] [&_div_span]:[color:#817576] [&_div_span]:[font-size:12px] [&_>_strong]:[white-space:nowrap]" key={`${item.productId}-${item.size ?? ""}-${item.setName ?? ""}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.size ? `Size ${item.size} · ` : ""}Qty {item.qty} × {money(item.price)}
                        </span>
                        {item.setName && <span>Part of {item.setName}</span>}
                      </div>
                      <strong>{money(item.qty * item.price)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="order-items-empty [padding:14px_0] [color:#817576] [font-size:13px]">
                  Item details are unavailable for this order.
                </p>
              )}
              {selectedOrder.deliveryFee !== undefined && (
                <p className="mt-4 flex justify-between text-sm">
                  <span>Delivery</span>
                  <strong>{selectedOrder.deliveryFee === 0 ? "Free" : money(selectedOrder.deliveryFee)}</strong>
                </p>
              )}
              {selectedOrder.paymentMethod && (
                <p className="mt-2 flex justify-between text-sm">
                  <span>Payment</span>
                  <strong>{selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}</strong>
                </p>
              )}
              {selectedOrder.discount ? (
                <p className="mt-4 flex justify-between text-sm text-[#1f6b44]">
                  <span>Set savings</span>
                  <strong>−{money(selectedOrder.discount)}</strong>
                </p>
              ) : null}
              <div className="order-total-row [display:flex] [justify-content:space-between] [margin-top:16px] [padding-top:17px] [border-top:1px_solid_#dfd3d1] [color:#35171e] [font-size:16px] [&_strong]:[font-size:18px]">
                <span>Order total</span>
                <strong>{money(selectedOrder.total)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}