import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { isProductImagePublicId } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { CounterModel, ProductModel } from "@/lib/models";

function productResponse(product: Record<string, unknown>) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    ...(product.oldPrice === undefined ? {} : { oldPrice: product.oldPrice }),
    image: product.image,
    ...(product.imagePublicId === undefined
      ? {}
      : { imagePublicId: product.imagePublicId }),
    color: product.color,
    stock: product.stock,
    description: product.description,
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const search = request.nextUrl.searchParams;
    const query: Record<string, unknown> = {};
    const category = search.get("category");
    const term = search.get("q");

    if (category) query.category = category;
    if (term) query.name = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const parsedLimit = Number(search.get("limit") ?? 100);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 100;
    const productsQuery = ProductModel.find(query);
    if (search.get("sort") === "newest") {
      productsQuery.sort({ createdAt: "desc", id: "desc" });
    } else {
      productsQuery.sort({ id: "asc" });
    }
    const products = await productsQuery.limit(limit).lean();
    return NextResponse.json({ products: products.map(productResponse) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      !isNonEmptyString(body.name, 160) ||
      !isNonEmptyString(body.category, 80) ||
      !isNonEmptyString(body.image, 2048) ||
      typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0 ||
      !Number.isInteger(body.stock) ||
      (body.stock as number) < 0 ||
      ("imagePublicId" in body &&
        body.imagePublicId !== undefined &&
        !isProductImagePublicId(body.imagePublicId))
    ) {
      return invalidRequest("Product fields are invalid.");
    }

    const counter = await CounterModel.findOneAndUpdate(
      { _id: "products" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const product = await ProductModel.create({
      id: counter.seq,
      name: body.name,
      category: body.category,
      price: body.price,
      oldPrice:
        typeof body.oldPrice === "number" && body.oldPrice >= 0
          ? body.oldPrice
          : undefined,
      image: body.image,
      imagePublicId: body.imagePublicId,
      color: typeof body.color === "string" ? body.color.trim() : "",
      stock: body.stock,
      description:
        typeof body.description === "string" ? body.description.trim() : "",
    });

    return NextResponse.json(
      { product: productResponse(product.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
