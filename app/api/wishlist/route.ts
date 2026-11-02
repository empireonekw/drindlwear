import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel, UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    if (!user) return invalidRequest("Authentication is required.", 401);

    const record = await UserModel.findById(user.id).select("wishlist").lean();
    return NextResponse.json({ wishlist: record?.wishlist ?? [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    if (!user) return invalidRequest("Authentication is required.", 401);

    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("wishlist" in body) ||
      !Array.isArray(body.wishlist) ||
      body.wishlist.length > 100 ||
      body.wishlist.some(
        (id) => !Number.isSafeInteger(id) || (id as number) < 1,
      )
    ) {
      return invalidRequest("Wishlist product ids are invalid.");
    }

    const wishlist = [...new Set(body.wishlist as number[])];
    if (
      wishlist.length &&
      (await ProductModel.countDocuments({ id: { $in: wishlist } })) !==
        wishlist.length
    ) {
      return invalidRequest("One or more wishlist products do not exist.", 404);
    }
    await UserModel.updateOne({ _id: user.id }, { $set: { wishlist } });
    return NextResponse.json({ wishlist });
  } catch (error) {
    return apiError(error);
  }
}
