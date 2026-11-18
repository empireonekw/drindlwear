/**
 * Customer ↔ shop messaging: shapes shared by the API, the admin inbox and
 * the customer chat. Each customer has one conversation with the shop.
 */

export type MessageSender = "customer" | "admin";
export type ConversationStatus = "open" | "resolved";

export type ChatMessage = {
  id: string;
  conversationId: string;
  from: MessageSender;
  /** Shown name: the customer's name, or "Dirndl Wear" for the team. */
  authorName: string;
  text: string;
  /** Private photo, served at /api/messages/images/<id> to this customer and admins only. */
  image?: string;
  createdAt: string;
};

/** One row in the admin inbox. */
export type ConversationSummary = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: ConversationStatus;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageFrom: MessageSender;
  /** Customer messages the team hasn't opened yet. */
  unreadForAdmin: number;
  /** Team replies the customer hasn't seen yet. */
  unreadForCustomer: number;
};

/** Longest message text, in characters. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Socket.IO events pushed by the server (see server.mjs and lib/server/realtime.ts). */
export const SOCKET_EVENTS = {
  /** A new message: { conversation: ConversationSummary, message: ChatMessage } */
  message: "message:new",
  /** Status or unread counts changed: { conversation: ConversationSummary } */
  conversation: "conversation:update",
  /** Someone is typing. To admins: { userId }. To a customer: {} */
  typing: "typing",
} as const;
