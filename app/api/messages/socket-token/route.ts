import { getCurrentUser } from "@/lib/server/auth";
import { socketToken } from "@/lib/server/realtime";
import { jsonError, jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/**
 * A one-hour pass for the live-messages socket (see server.mjs). Only the
 * signed-in account gets one; other websites can't read it (no CORS).
 */
async function handleGET(_request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError(401, "Not signed in.");
    return jsonOk({ token: socketToken(user._id.toHexString(), user.role) });
  } catch (error) {
    noteError(error);
    console.error("Could not issue socket token:", error instanceof Error ? error.message : error);
    return jsonError(500, "Live messages are unavailable right now.");
  }
}

export const GET = withMetrics("messages", handleGET);
