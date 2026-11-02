import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isNonEmptyString, isRecord } from "@/lib/api";
import { getAdminUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { StoreSettingsModel } from "@/lib/models";

const defaults = { shopName: "Dirndl Wear", currency: "PKR" };

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await StoreSettingsModel.findOne({ key: "default" }).lean();
    return NextResponse.json({
      settings: {
        shopName: settings?.shopName ?? defaults.shopName,
        currency: settings?.currency ?? defaults.currency,
      },
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
    if (
      !isRecord(body) ||
      !isNonEmptyString(body.shopName, 120) ||
      body.currency !== "PKR"
    ) {
      return invalidRequest("A shop name and supported currency are required.");
    }
    const settings = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      {
        $set: { shopName: body.shopName.trim(), currency: body.currency },
        $setOnInsert: { key: "default" },
      },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return NextResponse.json({
      settings: { shopName: settings.shopName, currency: settings.currency },
    });
  } catch (error) {
    return apiError(error);
  }
}
