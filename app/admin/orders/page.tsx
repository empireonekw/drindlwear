"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";
import { formatOrderId } from "@/lib/order";

const orderStatuses = [
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

  async function changeStatus(orderId: string, status: string) {
    setError("");
    try {
      await updateOrderStatus(orderId, status);
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
      <div className="admin-head">
        <h1>Orders</h1>
        <span>{orders.length} Orders</span>
      </div>
      {error && <p role="alert">{error}</p>}

      <div className="admin-card">
        <table className="admin-table">
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
                      className="field"
                      aria-label={`Change status for order ${order.id}`}
                      value={order.status}
                      onChange={(event) =>
                        changeStatus(order.id, event.target.value)
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
                      className="order-view-button"
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
          className="order-dialog-backdrop"
          onClick={() => setSelectedOrderId(null)}
        >
          <section
            className="order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="order-dialog-header">
              <div>
                <span className="order-dialog-eyebrow">ORDER DETAILS</span>
                <h2 id="order-dialog-title">
                  {formatOrderId(selectedOrder.id)}
                </h2>
                <p>Placed on {selectedOrder.date}</p>
              </div>
              <button
                type="button"
                className="order-dialog-close"
                aria-label="Close order details"
                onClick={() => setSelectedOrderId(null)}
              >
                <X size={20} />
              </button>
            </header>

            <div className="order-dialog-content">
              <div className="order-detail-grid">
                <div className="order-detail-card">
                  <span className="order-detail-label">CUSTOMER</span>
                  <strong>{selectedOrder.customer}</strong>
                  <span>{selectedOrder.customerEmail || "Email unavailable"}</span>
                  <span>{selectedOrder.customerPhone || "Phone not provided"}</span>
                </div>
                <div className="order-detail-card">
                  <span className="order-detail-label">DELIVERY ADDRESS</span>
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
                <div className="order-detail-card order-detail-summary">
                  <span className="order-detail-label">ORDER STATUS</span>
                  <strong>{selectedOrder.status}</strong>
                  <span>
                    Payment: {selectedOrder.paymentStatus || "unpaid"}
                  </span>
                </div>
              </div>

              <h3 className="order-items-heading">Items ordered</h3>
              {selectedOrder.items?.length ? (
                <div className="order-items-list">
                  {selectedOrder.items.map((item) => (
                    <div className="order-item-row" key={item.productId}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>Qty {item.qty} × {money(item.price)}</span>
                      </div>
                      <strong>{money(item.qty * item.price)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="order-items-empty">
                  Item details are unavailable for this order.
                </p>
              )}
              <div className="order-total-row">
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