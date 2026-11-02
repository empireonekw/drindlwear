import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { CartModel, ProductModel } from "@/lib/models";

const CART_COOKIE = "dw_cart";
const CART_SECONDS = 30 * 24 * 60 * 60;

export const dynamic = "force-dynamic";

function cartSessionId(request: NextRequest) {
  const value = request.cookies.get(CART_COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : randomUUID();
}

function withCartCookie(response: NextResponse, request: NextRequest, id: string) {
  if (request.cookies.get(CART_COOKIE)?.value !== id) {
    response.cookies.set(CART_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CART_SECONDS,
    });
  }
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const sessionId = cartSessionId(request);
    const cart = await CartModel.findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    }).lean();
    return withCartCookie(
      NextResponse.json({
        items: cart?.items.map((item: { productId: number; qty: number }) => ({
          id: item.productId,
          qty: item.qty,
        })) ?? [],
      }),
      request,
      sessionId,
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("items" in body) ||
      !Array.isArray(body.items) ||
      body.items.length > 50 ||
      body.items.some(
        (item) =>
          typeof item !== "object" ||
          item === null ||
          !("id" in item) ||
          !("qty" in item) ||
          !Number.isSafeInteger(item.id) ||
          (item.id as number) < 1 ||
          !Number.isInteger(item.qty) ||
          (item.qty as number) < 1 ||
          (item.qty as number) > 50,
      )
    ) {
      return invalidRequest("Cart items are invalid.");
    }

    const items = body.items as Array<{ id: number; qty: number }>;
    const combined = new Map<number, number>();
    for (const item of items) {
      combined.set(item.id, (combined.get(item.id) ?? 0) + item.qty);
    }
    if ([...combined.values()].some((qty) => qty > 50)) {
      return invalidRequest("A product quantity cannot exceed 50.");
    }

    const ids = [...combined.keys()];
    if (ids.length && (await ProductModel.countDocuments({ id: { $in: ids } })) !== ids.length) {
      return invalidRequest("One or more cart products do not exist.", 404);
    }
    const sessionId = cartSessionId(request);
    await CartModel.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          items: [...combined].map(([productId, qty]) => ({ productId, qty })),
          expiresAt: new Date(Date.now() + CART_SECONDS * 1000),
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    return withCartCookie(
      NextResponse.json({
        items: [...combined].map(([id, qty]) => ({ id, qty })),
      }),
      request,
      sessionId,
    );
  } catch (error) {
    return apiError(error);
  }
}
