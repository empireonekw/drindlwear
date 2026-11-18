import "server-only";

import { Readable } from "stream";
import { Db, GridFSBucket, ObjectId } from "mongodb";

import {
  ChatMessage,
  ConversationStatus,
  ConversationSummary,
  MAX_MESSAGE_LENGTH,
  MessageSender,
  SOCKET_EVENTS,
} from "@/lib/messages";

import type { UserDoc } from "./auth";
import { cleanFileName, MAX_IMAGE_BYTES, sniffImageType } from "./images";
import { getDb } from "./mongodb";
import { ADMIN_ROOM, emitTo, userRoom } from "./realtime";

/**
 * Customer ↔ shop messages, stored in MongoDB:
 *
 * - `conversations`: one per customer (unique userId), with status, last-message
 *   preview and unread counts for both sides.
 * - `messages`: every message, linked to its conversation.
 * - GridFS bucket `message_images`: photos sent in chats. Private: served only to
 *   the customer of that conversation and to admins (app/api/messages/images).
 */

export type ConversationDoc = {
  _id: ObjectId;
  userId: ObjectId;
  status: ConversationStatus;
  createdAt: Date;
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageFrom: MessageSender;
  unreadForAdmin: number;
  unreadForCustomer: number;
};

type MessageDoc = {
  _id: ObjectId;
  conversationId: ObjectId;
  from: MessageSender;
  authorId: ObjectId;
  authorName: string;
  text: string;
  imageId?: ObjectId;
  createdAt: Date;
};

export const MESSAGE_IMAGE_BUCKET = "message_images";
export const TEAM_NAME = "Dirndl Wear";

const globalForMessages = globalThis as unknown as { messagesReady?: Promise<void> };

function ensureIndexes(db: Db) {
  globalForMessages.messagesReady ??= Promise.all([
    db.collection("conversations").createIndex({ userId: 1 }, { unique: true }),
    db.collection("conversations").createIndex({ lastMessageAt: -1 }),
    db.collection("messages").createIndex({ conversationId: 1, createdAt: 1 }),
  ])
    .then(() => undefined)
    .catch((error) => {
      globalForMessages.messagesReady = undefined;
      throw error;
    });
  return globalForMessages.messagesReady;
}

async function collections() {
  const db = await getDb();
  await ensureIndexes(db);
  return {
    db,
    conversations: db.collection<ConversationDoc>("conversations"),
    messages: db.collection<MessageDoc>("messages"),
    users: db.collection<UserDoc>("users"),
  };
}

// --------------------------------------------------------------------------- shapes

export const messageImageUrl = (id: ObjectId | string) => `/api/messages/images/${String(id)}`;

function toMessage(doc: MessageDoc): ChatMessage {
  return {
    id: doc._id.toHexString(),
    conversationId: doc.conversationId.toHexString(),
    from: doc.from,
    authorName: doc.authorName,
    text: doc.text,
    ...(doc.imageId ? { image: messageImageUrl(doc.imageId) } : {}),
    createdAt: doc.createdAt.toISOString(),
  };
}

function toSummary(doc: ConversationDoc, user?: Pick<UserDoc, "name" | "email" | "phone"> | null): ConversationSummary {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId.toHexString(),
    customerName: user?.name ?? "Deleted account",
    customerEmail: user?.email ?? "",
    ...(user?.phone ? { customerPhone: user.phone } : {}),
    status: doc.status,
    lastMessageAt: doc.lastMessageAt.toISOString(),
    lastMessagePreview: doc.lastMessagePreview,
    lastMessageFrom: doc.lastMessageFrom,
    unreadForAdmin: doc.unreadForAdmin,
    unreadForCustomer: doc.unreadForCustomer,
  };
}

/** Message text as typed: trimmed, at most MAX_MESSAGE_LENGTH characters, no control characters. */
export function cleanMessageText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

const preview = (text: string, hasImage: boolean) => {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return (oneLine || (hasImage ? "📷 Photo" : "")).slice(0, 140);
};

// --------------------------------------------------------------------------- reading

/** The customer's own conversation and its messages (null when they never wrote). */
export async function customerThread(userId: ObjectId) {
  const { conversations, messages } = await collections();
  const conversation = await conversations.findOne({ userId });
  if (!conversation) return { conversation: null, messages: [] as ChatMessage[] };
  const list = await messages.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(500).toArray();
  return { conversation, messages: list.map(toMessage) };
}

/** Every conversation for the admin inbox, newest activity first, with the customer's details. */
export async function listConversations(): Promise<ConversationSummary[]> {
  const { conversations, users } = await collections();
  const docs = await conversations.find({}).sort({ lastMessageAt: -1 }).limit(500).toArray();
  const people = await users
    .find({ _id: { $in: docs.map((doc) => doc.userId) } }, { projection: { name: 1, email: 1, phone: 1 } })
    .toArray();
  const byId = new Map(people.map((person) => [person._id.toHexString(), person]));
  return docs.map((doc) => toSummary(doc, byId.get(doc.userId.toHexString())));
}

export async function getConversation(id: ObjectId) {
  const { conversations, messages, users } = await collections();
  const conversation = await conversations.findOne({ _id: id });
  if (!conversation) return null;
  const [list, user] = await Promise.all([
    messages.find({ conversationId: id }).sort({ createdAt: 1 }).limit(500).toArray(),
    users.findOne({ _id: conversation.userId }, { projection: { name: 1, email: 1, phone: 1 } }),
  ]);
  return { conversation: toSummary(conversation, user), messages: list.map(toMessage) };
}

/** Customer messages waiting for the team, across all conversations. */
export async function unreadForAdmin() {
  const { conversations } = await collections();
  const [row] = await conversations
    .aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$unreadForAdmin" } } }])
    .toArray();
  return row?.total ?? 0;
}

// --------------------------------------------------------------------------- writing

/** Pushes a conversation's latest state to the admins and to its customer. */
async function broadcastConversation(conversation: ConversationDoc) {
  const { users } = await collections();
  const user = await users.findOne({ _id: conversation.userId }, { projection: { name: 1, email: 1, phone: 1 } });
  const summary = toSummary(conversation, user);
  emitTo([ADMIN_ROOM, userRoom(summary.userId)], SOCKET_EVENTS.conversation, { conversation: summary });
  return summary;
}

/**
 * Saves a message and pushes it live. A customer message creates their
 * conversation the first time and reopens it when it was resolved.
 */
export async function addMessage(input: {
  customerId: ObjectId;
  from: MessageSender;
  author: Pick<UserDoc, "_id" | "name">;
  text: string;
  imageId?: ObjectId;
}) {
  const { conversations, messages, users } = await collections();
  const now = new Date();
  const fromCustomer = input.from === "customer";

  const conversation = await conversations.findOneAndUpdate(
    { userId: input.customerId },
    {
      $set: {
        lastMessageAt: now,
        lastMessagePreview: preview(input.text, Boolean(input.imageId)),
        lastMessageFrom: input.from,
        // A new customer message always needs an answer again.
        ...(fromCustomer ? { status: "open" as const } : {}),
      },
      $inc: fromCustomer ? { unreadForAdmin: 1 } : { unreadForCustomer: 1 },
      $setOnInsert: {
        userId: input.customerId,
        createdAt: now,
        ...(fromCustomer ? { unreadForCustomer: 0 } : { unreadForAdmin: 0, status: "open" as const }),
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!conversation) throw new Error("Could not save the conversation.");

  const doc: MessageDoc = {
    _id: new ObjectId(),
    conversationId: conversation._id,
    from: input.from,
    authorId: input.author._id,
    // Team replies are signed by the shop, not by the admin's own name.
    authorName: fromCustomer ? input.author.name : TEAM_NAME,
    text: input.text,
    ...(input.imageId ? { imageId: input.imageId } : {}),
    createdAt: now,
  };
  await messages.insertOne(doc);

  const user = await users.findOne({ _id: conversation.userId }, { projection: { name: 1, email: 1, phone: 1 } });
  const summary = toSummary(conversation, user);
  const message = toMessage(doc);
  emitTo([ADMIN_ROOM, userRoom(summary.userId)], SOCKET_EVENTS.message, { conversation: summary, message });
  return { conversation: summary, message };
}

/** Marks one side's unread messages as seen. */
export async function markRead(where: { userId: ObjectId } | { _id: ObjectId }, reader: MessageSender) {
  const { conversations } = await collections();
  const field = reader === "admin" ? "unreadForAdmin" : "unreadForCustomer";
  const conversation = await conversations.findOneAndUpdate(
    { ...where, [field]: { $gt: 0 } },
    { $set: { [field]: 0 } },
    { returnDocument: "after" },
  );
  if (conversation) await broadcastConversation(conversation);
}

export async function setStatus(id: ObjectId, status: ConversationStatus) {
  const { conversations } = await collections();
  const conversation = await conversations.findOneAndUpdate({ _id: id }, { $set: { status } }, { returnDocument: "after" });
  return conversation ? broadcastConversation(conversation) : null;
}

// --------------------------------------------------------------------------- photos

/**
 * Saves a chat photo. `customerId` is the customer of the conversation it
 * belongs to; only they and admins can open it later.
 */
type SavedImage = { id: ObjectId; error?: undefined } | { id?: undefined; error: string };

export async function saveMessageImage(file: File, customerId: ObjectId, uploadedBy: ObjectId): Promise<SavedImage> {
  if (file.size === 0) return { error: "That file is empty." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Photos must be 5 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffImageType(bytes);
  if (!contentType) return { error: "Only JPEG, PNG and WebP photos are accepted." };

  const bucket = new GridFSBucket(await getDb(), { bucketName: MESSAGE_IMAGE_BUCKET });
  const upload = bucket.openUploadStream(cleanFileName(file.name), {
    metadata: { contentType, customerId, uploadedBy },
  });
  await new Promise<void>((resolve, reject) => {
    Readable.from(Buffer.from(bytes)).pipe(upload).on("finish", () => resolve()).on("error", reject);
  });
  return { id: upload.id as ObjectId };
}

/** Reads a multipart message body: { text, image?, userId? (admin "New" only) }. */
export async function readMessageForm(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) return null;
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES + 64 * 1024) return { tooLarge: true } as const;
  const form = await request.formData().catch(() => null);
  if (!form) return null;
  const image = form.get("image");
  const userId = form.get("userId");
  return {
    text: cleanMessageText(form.get("text")),
    image: image instanceof File && image.size > 0 ? image : null,
    userId: typeof userId === "string" ? userId : "",
  } as const;
}
