import { destroySession, getCurrentUser } from "@/lib/server/auth";
import { disconnectUser } from "@/lib/server/realtime";
import { jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

async function handlePOST(_request: Request) {
  try {
    // Close this account's live-message sockets too.
    const user = await getCurrentUser().catch(() => null);
    await destroySession();
    if (user) disconnectUser(user._id.toHexString());
  } catch (error) {
    noteError(error);
    console.error("Sign-out failed:", error instanceof Error ? error.message : error);
  }
  return jsonOk({ ok: true });
}

export const POST = withMetrics("auth", handlePOST);
