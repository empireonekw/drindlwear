import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HomepageContentModel } from "@/lib/models";

const defaultHeadline = "Moments of Tradition";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const content = await HomepageContentModel.findOne({ key: "homepage" }).lean();
    return NextResponse.json({
      content: { headline: content?.headline ?? defaultHeadline },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    if (!(await getAdminUser(request))) {
      return invalidRequest("Admin authentication is required.", 401);
    }

    const body: unknown = await request.json();
    if (!isRecord(body) || !isNonEmptyString(body.headline, 160)) {
      return invalidRequest("A headline of up to 160 characters is required.");
    }
    const content = await HomepageContentModel.findOneAndUpdate(
      { key: "homepage" },
      {
        $set: { headline: body.headline.trim() },
        $setOnInsert: { key: "homepage" },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return NextResponse.json({ content: { headline: content.headline } });
  } catch (error) {
    return apiError(error);
  }
}
