import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/lib/models";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await CategoryModel.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "name",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          slug: 1,
          description: 1,
          productCount: { $size: "$products" },
        },
      },
      { $sort: { name: 1 } },
    ]);
    return NextResponse.json({ categories });
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
    if (!isRecord(body) || !isNonEmptyString(body.name, 80)) {
      return invalidRequest("A category name is required.");
    }
    const name = body.name.trim();
    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? slugify(body.slug)
        : slugify(name);
    if (!slug) return invalidRequest("A valid category slug is required.");

    const category = await CategoryModel.create({
      name,
      slug,
      description:
        typeof body.description === "string" ? body.description.trim() : "",
    });
    return NextResponse.json(
      {
        category: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          productCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
