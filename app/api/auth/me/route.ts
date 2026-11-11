import { getCurrentUser, toPublicUser } from "@/lib/server/auth";
import { jsonError, jsonOk } from "@/lib/server/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user: user ? toPublicUser(user) : null });
  } catch (error) {
    console.error("Could not load the signed-in user:", error instanceof Error ? error.message : error);
    return jsonError(503, "Account service unavailable.", { user: null });
  }
}
