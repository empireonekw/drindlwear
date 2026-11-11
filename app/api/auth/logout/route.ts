import { NextResponse } from "next/server";

import { destroySession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    console.error("Sign-out failed:", error);
  }
  return NextResponse.json({ ok: true });
}
