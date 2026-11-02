import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (error) {
    return apiError(error);
  }
}
