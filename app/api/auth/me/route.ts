import { NextResponse } from "next/server";

import { getCurrentUser, toPublicUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(
      { user: user ? toPublicUser(user) : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load the signed-in user:", error);
    return NextResponse.json({ user: null, error: "Could not reach the account service." }, { status: 503 });
  }
}
