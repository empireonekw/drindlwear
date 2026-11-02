import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isEmail, isRecord } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { NewsletterSubscriberModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body: unknown = await request.json();
    if (!isRecord(body) || !isEmail(body.email)) {
      return invalidRequest("A valid email address is required.");
    }
    await NewsletterSubscriberModel.updateOne(
      { email: body.email.trim().toLowerCase() },
      { $setOnInsert: { email: body.email.trim().toLowerCase() } },
      { upsert: true },
    );
    return NextResponse.json(
      { subscribed: true, message: "Subscription saved." },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
