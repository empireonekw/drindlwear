import { getCurrentUser, toPublicUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

async function handleGET(_request: Request) {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user: user ? toPublicUser(user) : null });
  } catch (error) {
    noteError(error);
    console.error("Could not load the signed-in user:", error instanceof Error ? error.message : error);
    return jsonError(503, "Account service unavailable.", { user: null });
  }
}

export const GET = withMetrics("auth", handleGET);
