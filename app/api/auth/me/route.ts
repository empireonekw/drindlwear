import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest } from "@/lib/api";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    if (!user) return invalidRequest("Authentication is required.", 401);
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
