import { NextResponse } from "next/server";

import { getDb } from "@/lib/server/mongodb";

export const dynamic = "force-dynamic";

/** Used by the deploy scripts: "ok" only when the database answers. */
export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 });
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
