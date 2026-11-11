import { destroySession } from "@/lib/server/auth";
import { jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

async function handlePOST(_request: Request) {
  try {
    await destroySession();
  } catch (error) {
    noteError(error);
    console.error("Sign-out failed:", error instanceof Error ? error.message : error);
  }
  return jsonOk({ ok: true });
}

export const POST = withMetrics("auth", handlePOST);
