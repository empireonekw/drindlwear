import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import {
  deleteProductImage,
  detectProductImageFormat,
  isProductImagePublicId,
  MAX_PRODUCT_IMAGE_BYTES,
  uploadProductImage,
} from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_PRODUCT_IMAGE_BYTES + 64 * 1024
    ) {
      return invalidRequest("Image must be 5 MB or smaller.", 413);
    }

    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || image.size === 0) {
      return invalidRequest("Choose an image to upload.");
    }
    if (image.size > MAX_PRODUCT_IMAGE_BYTES) {
      return invalidRequest("Image must be 5 MB or smaller.", 413);
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const format = detectProductImageFormat(bytes);
    if (!format) {
      return invalidRequest("Upload a valid JPEG, PNG, or WebP image.");
    }
    const claimedType =
      format === "jpg" ? "image/jpeg" : `image/${format}`;
    if (image.type !== claimedType) {
      return invalidRequest("Image file content does not match its file type.");
    }

    const uploaded = await uploadProductImage(bytes);
    return NextResponse.json(
      { image: uploaded.url, publicId: uploaded.publicId },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("publicId" in body) ||
      !isProductImagePublicId(body.publicId)
    ) {
      return invalidRequest("Cloudinary product image id is invalid.");
    }
    if (await ProductModel.exists({ imagePublicId: body.publicId })) {
      return invalidRequest("This image is in use by a product.", 409);
    }

    await deleteProductImage(body.publicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
