import { destroySession } from "@/lib/server/auth";
import { jsonOk } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    console.error("Sign-out failed:", error instanceof Error ? error.message : error);
  }
  return jsonOk({ ok: true });
}
