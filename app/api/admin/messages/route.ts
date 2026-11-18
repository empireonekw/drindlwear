import { ObjectId } from "mongodb";

import { getAdmin, type UserDoc } from "@/lib/server/auth";
import { addMessage, listConversations, readMessageForm, saveMessageImage } from "@/lib/server/messages";
import { noteError, withMetrics } from "@/lib/server/metrics";
import { getDb } from "@/lib/server/mongodb";
import { jsonError, jsonOk } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Every conversation, newest activity first. Admins only. */
async function handleGET(_request: Request) {
  try {
    if (!(await getAdmin())) return jsonError(403, "Admins only.");
    return jsonOk({ conversations: await listConversations() });
  } catch (error) {
    noteError(error);
    console.error("Could not list conversations:", error instanceof Error ? error.message : error);
    return jsonError(500, "Could not load messages.");
  }
}

/**
 * Starts (or continues) a conversation with a customer: multipart
 * { userId, text, image? }. Used by the inbox's "New" button. Admins only.
 */
async function handlePOST(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Admins only.");

    const form = await readMessageForm(request);
    if (!form) return jsonError(415, "Unsupported request.");
    if ("tooLarge" in form) return jsonError(413, "Photos must be 5 MB or smaller.");
    if (!form.text && !form.image) return jsonError(400, "Write a message or add a photo.");

    if (!/^[a-f0-9]{24}$/i.test(form.userId)) return jsonError(400, "Choose a customer.");
    const customer = await (await getDb())
      .collection<UserDoc>("users")
      .findOne({ _id: new ObjectId(form.userId) }, { projection: { role: 1 } });
    if (!customer) return jsonError(404, "Customer not found.");
    if (customer.role === "admin") return jsonError(400, "Admins can't be messaged here.");

    let imageId;
    if (form.image) {
      const saved = await saveMessageImage(form.image, customer._id, admin._id);
      if (saved.error) return jsonError(400, saved.error);
      imageId = saved.id;
    }
    const result = await addMessage({ customerId: customer._id, from: "admin", author: admin, text: form.text, imageId });
    return jsonOk(result, 201);
  } catch (error) {
    noteError(error);
    console.error("Could not start conversation:", error instanceof Error ? error.message : error);
    return jsonError(500, "The message could not be sent. Please try again.");
  }
}

export const GET = withMetrics("messages", handleGET);
export const POST = withMetrics("messages", handlePOST);
