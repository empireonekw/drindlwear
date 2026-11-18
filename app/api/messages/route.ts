import { getCurrentUser } from "@/lib/server/auth";
import {
  addMessage,
  customerThread,
  markRead,
  readMessageForm,
  saveMessageImage,
} from "@/lib/server/messages";
import { noteError, withMetrics } from "@/lib/server/metrics";
import { hit, jsonError, jsonOk, tooMany, windows } from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Messages a customer may send per 10 minutes, and photos per hour. */
const MESSAGES_PER_10_MIN = 30;
const PHOTOS_PER_HOUR = 20;

/**
 * The signed-in customer's conversation with the shop. With ?read=1 (the chat
 * is open) the team's replies are marked as read; without it, `unread` says
 * how many are waiting. Signed-out visitors get { signedIn: false }.
 */
async function handleGET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonOk({ signedIn: false, messages: [], status: null, unread: 0 });
    const { conversation, messages } = await customerThread(user._id);
    const read = new URL(request.url).searchParams.get("read") === "1";
    let unread = conversation?.unreadForCustomer ?? 0;
    if (read && unread) {
      await markRead({ userId: user._id }, "customer");
      unread = 0;
    }
    return jsonOk({ signedIn: true, status: conversation?.status ?? null, messages, unread });
  } catch (error) {
    noteError(error);
    console.error("Could not load messages:", error instanceof Error ? error.message : error);
    return jsonError(500, "Messages are unavailable right now. Please try again.");
  }
}

/** Sends a message to the shop: multipart { text, image? }. Signed-in customers only. */
async function handlePOST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError(401, "Please sign in to send a message.");
    if (user.role === "admin") return jsonError(400, "Admins reply from the dashboard.");

    const form = await readMessageForm(request);
    if (!form) return jsonError(415, "Unsupported request.");
    if ("tooLarge" in form) return jsonError(413, "Photos must be 5 MB or smaller.");
    if (!form.text && !form.image) return jsonError(400, "Write a message or add a photo.");

    const limit = await hit("message", user._id.toHexString(), windows.minutes(10));
    if (limit.count > MESSAGES_PER_10_MIN) return tooMany(limit.expiresAt, "You're sending messages very quickly. Please wait a moment.");

    let imageId;
    if (form.image) {
      const photos = await hit("message-photo", user._id.toHexString(), windows.hours(1));
      if (photos.count > PHOTOS_PER_HOUR) return tooMany(photos.expiresAt, "Photo limit reached. Please try again later.");
      const saved = await saveMessageImage(form.image, user._id, user._id);
      if (saved.error) return jsonError(400, saved.error);
      imageId = saved.id;
    }

    const result = await addMessage({ customerId: user._id, from: "customer", author: user, text: form.text, imageId });
    return jsonOk({ message: result.message, status: result.conversation.status }, 201);
  } catch (error) {
    noteError(error);
    console.error("Could not send message:", error instanceof Error ? error.message : error);
    return jsonError(500, "Your message could not be sent. Please try again.");
  }
}

export const GET = withMetrics("messages", handleGET);
export const POST = withMetrics("messages", handlePOST);
