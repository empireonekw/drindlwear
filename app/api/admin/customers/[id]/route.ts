import { ObjectId } from "mongodb";

import { getAdmin, type UserDoc } from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/**
 * Changes one account's role. Only POST reaches the API (see middleware.ts),
 * so the body says what to do: { action: "make-admin" } or
 * { action: "remove-admin" }. Admins only.
 *
 * An admin can't change their own role, so the store always keeps at least
 * one admin. The change applies on that person's next page load: roles are
 * read from the database on every request.
 */
async function handlePOST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Only admins can change roles.");

    if (!/^[a-f0-9]{24}$/i.test(params.id)) return jsonError(404, "Account not found.");
    const id = new ObjectId(params.id);

    const parsed = await readJsonBody(request);
    if ("response" in parsed) return parsed.response;
    const action = parsed.body.action;
    if (action !== "make-admin" && action !== "remove-admin") return jsonError(400, "Invalid request.");

    if (id.equals(admin._id)) return jsonError(400, "You can't change your own role.");

    const role: UserDoc["role"] = action === "make-admin" ? "admin" : "customer";
    const result = await (await getDb())
      .collection<UserDoc>("users")
      .findOneAndUpdate({ _id: id }, { $set: { role } }, { returnDocument: "after", projection: { name: 1, role: 1 } });
    if (!result) return jsonError(404, "Account not found.");

    console.info(`Role change: ${admin.email} set account ${params.id} to ${role}.`);
    return jsonOk({ id: params.id, role: result.role });
  } catch (error) {
    noteError(error);
    console.error("Could not change role:", error instanceof Error ? error.message : error);
    return jsonError(500, "The role could not be changed. Please try again.");
  }
}

export const POST = withMetrics("auth", handlePOST);
