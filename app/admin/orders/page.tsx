"use client";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

const orderStatuses = [
  "New",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function Orders() {
  const { orders, setOrders } = useStore();

  function updateOrderStatus(orderId: string, status: string) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  return (
    <>
      <div className="admin-head">
        <h1>Orders</h1>
        <span>{orders.length} Orders</span>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Change Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td>{money(order.total)}</td>
                <td>
                  <select
                    className="field"
                    value={order.status}
                    onChange={(event) =>
                      updateOrderStatus(order.id, event.target.value)
                    }
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}