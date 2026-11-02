import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/lib/models";

type RouteContext = { params: { slug: string } };

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const body: unknown = await request.json();
    if (!isRecord(body)) return invalidRequest("Category fields are invalid.");
    const category = await CategoryModel.findOne({ slug: params.slug });
    if (!category) return invalidRequest("Category not found.", 404);

    const updates: Record<string, string> = {};
    if ("name" in body) {
      if (!isNonEmptyString(body.name, 80)) {
        return invalidRequest("Category name is invalid.");
      }
      const oldName = category.name as string;
      const newName = body.name.trim();
      if (newName !== oldName) {
        await ProductModel.updateMany(
          { category: oldName },
          { $set: { category: newName } },
        );
        updates.name = newName;
      }
    }
    if ("slug" in body) {
      if (!isNonEmptyString(body.slug, 100)) {
        return invalidRequest("Category slug is invalid.");
      }
      updates.slug = slugify(body.slug);
    } else if (updates.name) {
      updates.slug = slugify(updates.name);
    }
    if ("description" in body) {
      if (typeof body.description !== "string" || body.description.length > 2000) {
        return invalidRequest("Category description is invalid.");
      }
      updates.description = body.description.trim();
    }
    if (Object.values(updates).some((value) => !value)) {
      return invalidRequest("Category slug is invalid.");
    }

    Object.assign(category, updates);
    await category.save();
    return NextResponse.json({
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
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

    const category = await CategoryModel.findOne({ slug: params.slug });
    if (!category) return invalidRequest("Category not found.", 404);
    if (await ProductModel.exists({ category: category.name })) {
      return invalidRequest(
        "This category still has products. Move or delete them first.",
        409,
      );
    }
    await category.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
