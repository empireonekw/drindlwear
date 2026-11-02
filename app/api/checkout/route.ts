import { NextRequest, NextResponse } from "next/server";

import {
  apiError,
  invalidRequest,
  isEmail,
  isNonEmptyString,
  isPhone,
  isRecord,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { CounterModel, OrderModel, ProductModel } from "@/lib/models";

type CheckoutLine = { productId: number; qty: number };

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body: unknown = await request.json();
    if (!isRecord(body) || !isRecord(body.customer) || !Array.isArray(body.items)) {
      return invalidRequest("Customer details and cart items are required.");
    }

    const { customer, items } = body;
    if (
      !isNonEmptyString(customer.first, 120) ||
      !isNonEmptyString(customer.last, 120) ||
      !isEmail(customer.email) ||
      !isPhone(customer.phone) ||
      !isNonEmptyString(customer.street, 240) ||
      !isNonEmptyString(customer.zip, 24) ||
      !isNonEmptyString(customer.city, 120)
    ) {
      return invalidRequest("Shipping address details are invalid.");
    }
    if (
      items.length === 0 ||
      items.length > 50 ||
      items.some(
        (item) =>
          !isRecord(item) ||
          !Number.isSafeInteger(item.id) ||
          (item.id as number) < 1 ||
          !Number.isInteger(item.qty) ||
          (item.qty as number) < 1 ||
          (item.qty as number) > 50,
      )
    ) {
      return invalidRequest("Cart items are invalid.");
    }

    const quantities = new Map<number, number>();
    for (const item of items as Array<{ id: number; qty: number }>) {
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.qty);
    }
    if ([...quantities.values()].some((qty) => qty > 50)) {
      return invalidRequest("A product quantity cannot exceed 50.");
    }

    const productIds = [...quantities.keys()];
    const products = await ProductModel.find({ id: { $in: productIds } }).lean();
    if (products.length !== productIds.length) {
      return invalidRequest("One or more products are no longer available.", 409);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const reserved: CheckoutLine[] = [];
    let unavailableProductId: number | null = null;
    try {
      for (const [productId, qty] of quantities) {
        const result = await ProductModel.updateOne(
          { id: productId, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
        );
        if (!result.modifiedCount) {
          unavailableProductId = productId;
          break;
        }
        reserved.push({ productId, qty });
      }
    } catch (error) {
      if (reserved.length) {
        await Promise.all(
          reserved.map((line) =>
            ProductModel.updateOne(
              { id: line.productId },
              { $inc: { stock: line.qty } },
            ),
          ),
        );
      }
      throw error;
    }
    if (unavailableProductId !== null) {
      await Promise.all(
        reserved.map((line) =>
          ProductModel.updateOne(
            { id: line.productId },
            { $inc: { stock: line.qty } },
          ),
        ),
      );
      const product = productMap.get(unavailableProductId);
      return invalidRequest(
        `Insufficient stock for ${product?.name ?? "a product"}. Only ${product?.stock ?? 0} left.`,
        409,
      );
    }

    try {
      const counter = await CounterModel.findOneAndUpdate(
        { _id: "orders" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      const orderId = `RW-${String(counter.seq).padStart(6, "0")}`;
      const orderItems = [...quantities].map(([productId, qty]) => {
        const product = productMap.get(productId)!;
        return {
          productId,
          name: product.name,
          qty,
          price: product.price,
        };
      });
      const total = orderItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
      );
      const roundedTotal = Math.round(total * 100) / 100;
      const order = await OrderModel.create({
        id: orderId,
        customer: {
          name: `${customer.first.trim()} ${customer.last.trim()}`,
          email: customer.email.trim().toLowerCase(),
          phone: customer.phone.trim(),
          street: customer.street.trim(),
          zip: customer.zip.trim(),
          city: customer.city.trim(),
        },
        items: orderItems,
        total: roundedTotal,
        status: "New",
        paymentStatus: "unpaid",
      });

      return NextResponse.json(
        {
          order: {
            id: order.id,
            customer: order.customer.name,
            customerEmail: order.customer.email,
            customerPhone: order.customer.phone,
            date: new Date(order.createdAt).toISOString().slice(0, 10),
            total: order.total,
            status: order.status,
            shippingAddress: {
              street: order.customer.street,
              zip: order.customer.zip,
              city: order.customer.city,
            },
          },
          payment: {
            status: "unpaid",
            message: "Order recorded; payment provider is not configured.",
          },
        },
        { status: 201 },
      );
    } catch (error) {
      await Promise.all(
        reserved.map((line) =>
          ProductModel.updateOne(
            { id: line.productId },
            { $inc: { stock: line.qty } },
          ),
        ),
      );
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
