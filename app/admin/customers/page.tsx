"use client";

import { useStore } from "@/components/store";
import { money } from "@/lib/data";

export default function Customers() {
  const { orders } = useStore();
  const customerNames = [...new Set(orders.map((order) => order.customer))];

  return (
    <>
      <h1 className="text-3xl font-serif">Customers</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Orders</th>
              <th>Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {customerNames.map((name) => {
              const customerOrders = orders.filter(
                (order) => order.customer === name,
              );
              const totalRevenue = customerOrders.reduce(
                (total, order) => total + order.total,
                0,
              );

              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{customerOrders.length}</td>
                  <td>{money(totalRevenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}