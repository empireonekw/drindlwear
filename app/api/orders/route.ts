import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    if (!user) return invalidRequest("Authentication is required.", 401);

    const filter =
      user.role === "admin" && request.nextUrl.searchParams.get("scope") !== "mine"
        ? {}
        : { "customer.email": user.email };
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        customer: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone ?? "",
        date: new Date(order.createdAt).toISOString().slice(0, 10),
        total: order.total,
        status: order.status,
        items: order.items,
        shippingAddress: {
          street: order.customer.street,
          zip: order.customer.zip,
          city: order.customer.city,
        },
        paymentStatus: order.paymentStatus,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
