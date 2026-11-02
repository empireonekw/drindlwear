import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel, OrderStatus, ProductModel } from "@/lib/models";

type RouteContext = { params: { id: string } };
const statuses: OrderStatus[] = [
  "New",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const body: unknown = await request.json();
    if (!isRecord(body) || !statuses.includes(body.status as OrderStatus)) {
      return invalidRequest("A valid order status is required.");
    }
    const current = await OrderModel.findOne({ id: params.id });
    if (!current) return invalidRequest("Order not found.", 404);
    if (
      current.status === "Cancelled" &&
      body.status !== "Cancelled"
    ) {
      return invalidRequest("Cancelled orders cannot be reopened.", 409);
    }

    let order;
    if (body.status === "Cancelled" && current.status !== "Cancelled") {
      order = await OrderModel.findOneAndUpdate(
        {
          id: params.id,
          status: current.status,
          stockRestockedAt: { $exists: false },
        },
        {
          $set: { status: "Cancelled", stockRestockedAt: new Date() },
        },
        { new: true, runValidators: true },
      );
      if (!order) {
        return invalidRequest("Order changed during this update. Reload and retry.", 409);
      }

      const quantities = new Map<number, number>();
      for (const item of current.items) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.qty,
        );
      }
      const result = await ProductModel.bulkWrite(
        [...quantities].map(([productId, qty]) => ({
          updateOne: {
            filter: { id: productId },
            update: { $inc: { stock: qty } },
          },
        })),
      );
      if (result.matchedCount !== quantities.size) {
        console.error(`Stock restore incomplete for cancelled order ${params.id}.`);
        return invalidRequest(
          "Order was cancelled, but inventory could not be fully restored.",
          500,
        );
      }
    } else {
      order = await OrderModel.findOneAndUpdate(
        { id: params.id, status: current.status },
        { $set: { status: body.status } },
        { new: true, runValidators: true },
      );
      if (!order) {
        return invalidRequest("Order changed during this update. Reload and retry.", 409);
      }
    }

    if (!order) return invalidRequest("Order not found.", 404);
    return NextResponse.json({
      order: {
        id: order.id,
        customer: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone ?? "",
        shippingAddress: {
          street: order.customer.street,
          zip: order.customer.zip,
          city: order.customer.city,
        },
        date: new Date(order.createdAt).toISOString().slice(0, 10),
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
