import { getAdmin, type UserDoc } from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";
import { jsonError, jsonOk } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** One account as the admin Customers page sees it (no password hash or IP data). */
export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserDoc["role"];
  createdAt: string;
  lastLoginAt: string | null;
  /** True for the admin who is looking at the list. */
  isYou: boolean;
};

/** Every account, most recently signed-in first. Admins only. */
async function handleGET(_request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can see customers.");

    const db = await getDb();
    const users = await db
      .collection<UserDoc>("users")
      .find({}, { projection: { name: 1, email: 1, phone: 1, role: 1, createdAt: 1, lastLoginAt: 1 } })
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .limit(1000)
      .toArray();

    const accounts: AdminAccount[] = users.map((user) => ({
      id: user._id.toHexString(),
      name: user.name,
      email: user.email,
      ...(user.phone ? { phone: user.phone } : {}),
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      isYou: user._id.equals(admin._id),
    }));
    return jsonOk({ accounts });
  } catch (error) {
    noteError(error);
    console.error("Could not list customers:", error instanceof Error ? error.message : error);
    return jsonError(500, "Could not load customers.");
  }
}

export const GET = withMetrics("auth", handleGET);
