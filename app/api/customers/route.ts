import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel, UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const [registeredCustomers, orderCustomers] = await Promise.all([
      UserModel.find({ role: "customer" }).select("name email").limit(500).lean(),
      OrderModel.aggregate([
        {
          $group: {
            _id: "$customer.email",
            name: { $last: "$customer.name" },
            orders: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
            lastOrder: { $max: "$createdAt" },
          },
        },
        { $sort: { lastOrder: -1 } },
        { $limit: 500 },
      ]),
    ]);

    const customers = new Map<
      string,
      {
        email: string;
        name: string;
        orders: number;
        totalRevenue: number;
      }
    >();
    for (const customer of registeredCustomers) {
      customers.set(customer.email, {
        email: customer.email,
        name: customer.name,
        orders: 0,
        totalRevenue: 0,
      });
    }
    for (const customer of orderCustomers) {
      const current = customers.get(customer._id);
      customers.set(customer._id, {
        email: customer._id,
        name: customer.name,
        orders: customer.orders,
        totalRevenue: customer.totalRevenue,
      });
      if (current && !customer.name) {
        customers.get(customer._id)!.name = current.name;
      }
    }

    return NextResponse.json({ customers: [...customers.values()] });
  } catch (error) {
    return apiError(error);
  }
}
