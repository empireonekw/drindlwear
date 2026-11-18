import "server-only";

import { createHmac } from "crypto";

/**
 * Live updates over Socket.IO. The socket server runs in server.mjs, in the
 * same process as Next.js, and puts itself on `globalThis.__dwSocket`; API
 * routes use it here to push events after they have saved something.
 *
 * Sockets only push. Everything that changes data (sending a message,
 * resolving a conversation) goes through the normal API routes, with their
 * sign-in checks, same-site checks and rate limits.
 *
 * If the socket server isn't running (plain `next dev`), nothing is pushed
 * and the pages fall back to checking for new messages every few seconds.
 */

type Emitter = {
  to: (room: string | string[]) => { emit: (event: string, payload: unknown) => void };
  in: (room: string) => { disconnectSockets: (close?: boolean) => void };
};

const io = () => (globalThis as unknown as { __dwSocket?: Emitter }).__dwSocket;

export const ADMIN_ROOM = "admins";
export const userRoom = (userId: string) => `user:${userId}`;

/** Sends `event` to everyone in `rooms`. Does nothing when sockets aren't running. */
export function emitTo(rooms: string | string[], event: string, payload: unknown) {
  try {
    io()?.to(rooms).emit(event, payload);
  } catch (error) {
    console.error("Socket emit failed:", error instanceof Error ? error.message : error);
  }
}

/** Closes every open socket of a user (after signing out or losing admin access). */
export function disconnectUser(userId: string) {
  try {
    io()?.in(userRoom(userId)).disconnectSockets(true);
  } catch (error) {
    console.error("Socket disconnect failed:", error instanceof Error ? error.message : error);
  }
}

const TOKEN_TTL_SECONDS = 60 * 60;

/**
 * A short-lived pass for opening a socket: "<userId>.<role>.<expires>.<signature>",
 * signed with AUTH_SECRET. server.mjs checks it with the same secret, so the
 * socket server never needs the session cookie or the database.
 */
export function socketToken(userId: string, role: "customer" | "admin") {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET is missing or too short.");
  const expires = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const body = `${userId}.${role}.${expires}`;
  const signature = createHmac("sha256", `socket:${secret}`).update(body).digest("base64url");
  return `${body}.${signature}`;
}
