import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel, ProductModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const [orderSummary, monthlyOrders, productCount] = await Promise.all([
      OrderModel.aggregate([
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            orderValue: { $sum: "$total" },
            customerEmails: { $addToSet: "$customer.email" },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            orders: { $sum: 1 },
          },
        },
      ]),
      ProductModel.countDocuments(),
    ]);

    const counts = new Map(
      monthlyOrders.map((entry) => [
        `${entry._id.year}-${entry._id.month}`,
        entry.orders as number,
      ]),
    );
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const month = date.getMonth() + 1;
      return {
        label: date.toLocaleString("en", { month: "short" }),
        orders: counts.get(`${date.getFullYear()}-${month}`) ?? 0,
      };
    });
    const summary = orderSummary[0];

    return NextResponse.json({
      summary: {
        orderValue: summary?.orderValue ?? 0,
        orderCount: summary?.orderCount ?? 0,
        customerCount: summary?.customerEmails.length ?? 0,
        productCount,
      },
      monthlyOrders: months,
    });
  } catch (error) {
    return apiError(error);
  }
}
