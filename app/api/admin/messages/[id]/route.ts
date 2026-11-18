import { ObjectId } from "mongodb";

import { getAdmin } from "@/lib/server/auth";
import {
  addMessage,
  getConversation,
  markRead,
  readMessageForm,
  saveMessageImage,
  setStatus,
} from "@/lib/server/messages";
import { noteError, withMetrics } from "@/lib/server/metrics";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server/security";

export const dynamic = "force-dynamic";

const conversationId = (id: string) => (/^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null);

/** One conversation with all its messages. Opening it marks the customer's messages as read. Admins only. */
async function handleGET(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await getAdmin())) return jsonError(403, "Admins only.");
    const id = conversationId(params.id);
    const found = id && (await getConversation(id));
    if (!id || !found) return jsonError(404, "Conversation not found.");
    if (found.conversation.unreadForAdmin) {
      await markRead({ _id: id }, "admin");
      found.conversation.unreadForAdmin = 0;
    }
    return jsonOk(found);
  } catch (error) {
    noteError(error);
    console.error("Could not load conversation:", error instanceof Error ? error.message : error);
    return jsonError(500, "Could not load this conversation.");
  }
}

/**
 * Changes one conversation. Only POST reaches the API (see middleware.ts):
 * - multipart { text, image? }: reply as the shop
 * - JSON { action: "resolve" | "reopen" | "read" }
 * Admins only.
 */
async function handlePOST(request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdmin();
    if (!admin) return jsonError(403, "Admins only.");
    const id = conversationId(params.id);
    const found = id && (await getConversation(id));
    if (!id || !found) return jsonError(404, "Conversation not found.");

    if (request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
      const form = await readMessageForm(request);
      if (!form) return jsonError(415, "Unsupported request.");
      if ("tooLarge" in form) return jsonError(413, "Photos must be 5 MB or smaller.");
      if (!form.text && !form.image) return jsonError(400, "Write a message or add a photo.");
      const customerId = new ObjectId(found.conversation.userId);
      let imageId;
      if (form.image) {
        const saved = await saveMessageImage(form.image, customerId, admin._id);
        if (saved.error) return jsonError(400, saved.error);
        imageId = saved.id;
      }
      // Replying means the team has read the conversation.
      await markRead({ _id: id }, "admin");
      return jsonOk(await addMessage({ customerId, from: "admin", author: admin, text: form.text, imageId }), 201);
    }

    const parsed = await readJsonBody(request);
    if ("response" in parsed) return parsed.response;
    const action = parsed.body.action;
    if (action === "resolve" || action === "reopen") {
      const conversation = await setStatus(id, action === "resolve" ? "resolved" : "open");
      return jsonOk({ conversation });
    }
    if (action === "read") {
      await markRead({ _id: id }, "admin");
      return jsonOk({ ok: true });
    }
    return jsonError(400, "Invalid request.");
  } catch (error) {
    noteError(error);
    console.error("Could not update conversation:", error instanceof Error ? error.message : error);
    return jsonError(500, "The conversation could not be updated. Please try again.");
  }
}

export const GET = withMetrics("messages", handleGET);
export const POST = withMetrics("messages", handlePOST);
