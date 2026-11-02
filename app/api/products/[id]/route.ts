import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { deleteProductImage, isProductImagePublicId } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel, ProductModel } from "@/lib/models";

type RouteContext = { params: { id: string } };

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

function productId(rawId: string) {
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const id = productId(params.id);
    if (!id) return invalidRequest("Product id is invalid.");

    await connectToDatabase();
    const product = await ProductModel.findOne({ id }).lean();
    if (!product) return invalidRequest("Product not found.", 404);
    return NextResponse.json({ product: productResponse(product) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const id = productId(params.id);
    if (!id) return invalidRequest("Product id is invalid.");
    const body: unknown = await request.json();
    if (!isRecord(body)) return invalidRequest("Product fields are invalid.");

    const updates: Record<string, unknown> = {};
    for (const field of ["name", "category", "image"] as const) {
      if (field in body) {
        const max = field === "image" ? 2048 : field === "name" ? 160 : 80;
        const value = body[field];
        if (!isNonEmptyString(value, max)) {
          return invalidRequest(`${field} is invalid.`);
        }
        updates[field] = value.trim();
      }
    }
    if ("imagePublicId" in body) {
      if (!isProductImagePublicId(body.imagePublicId)) {
        return invalidRequest("Cloudinary image id is invalid.");
      }
      updates.imagePublicId = body.imagePublicId;
    }
    const clearImagePublicId = "image" in body && !("imagePublicId" in body);
    for (const field of ["price", "oldPrice"] as const) {
      if (field in body) {
        if (
          typeof body[field] !== "number" ||
          !Number.isFinite(body[field]) ||
          body[field] < 0
        ) {
          return invalidRequest(`${field} must be a non-negative number.`);
        }
        updates[field] = body[field];
      }
    }
    if ("stock" in body) {
      if (!Number.isInteger(body.stock) || (body.stock as number) < 0) {
        return invalidRequest("stock must be a non-negative integer.");
      }
      updates.stock = body.stock;
    }
    for (const field of ["color", "description"] as const) {
      if (field in body) {
        if (typeof body[field] !== "string") {
          return invalidRequest(`${field} must be a string.`);
        }
        updates[field] = body[field].trim();
      }
    }

    const previous = await ProductModel.findOne({ id })
      .select("imagePublicId")
      .lean();
    const update: Record<string, unknown> = { $set: updates };
    if (clearImagePublicId) update.$unset = { imagePublicId: 1 };
    const product = await ProductModel.findOneAndUpdate(
      { id },
      update,
      { new: true, runValidators: true },
    ).lean();
    if (!product) return invalidRequest("Product not found.", 404);
    const warnings: string[] = [];
    if (
      previous?.imagePublicId &&
      previous.imagePublicId !== product.imagePublicId
    ) {
      try {
        if (!(await ProductModel.exists({ imagePublicId: previous.imagePublicId }))) {
          await deleteProductImage(previous.imagePublicId);
        }
      } catch (error) {
        console.error("Could not remove replaced Cloudinary product image:", error);
        warnings.push("The old Cloudinary image could not be removed.");
      }
    }
    return NextResponse.json({
      product: productResponse(product),
      ...(warnings.length ? { warnings } : {}),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const id = productId(params.id);
    if (!id) return invalidRequest("Product id is invalid.");
    if (
      await OrderModel.exists({
        "items.productId": id,
        status: { $ne: "Cancelled" },
      })
    ) {
      return invalidRequest(
        "This product is part of an active order and cannot be deleted.",
        409,
      );
    }
    const product = await ProductModel.findOne({ id }).select("imagePublicId").lean();
    if (!product) return invalidRequest("Product not found.", 404);
    const result = await ProductModel.deleteOne({ id });
    if (!result.deletedCount) return invalidRequest("Product not found.", 404);
    const warnings: string[] = [];
    if (
      product.imagePublicId &&
      !(await ProductModel.exists({ imagePublicId: product.imagePublicId }))
    ) {
      try {
        await deleteProductImage(product.imagePublicId);
      } catch (error) {
        console.error("Could not remove deleted product's Cloudinary image:", error);
        warnings.push("Product deleted, but its Cloudinary image could not be removed.");
      }
    }
    return NextResponse.json({
      success: true,
      ...(warnings.length ? { warnings } : {}),
    });
  } catch (error) {
    return apiError(error);
  }
}
