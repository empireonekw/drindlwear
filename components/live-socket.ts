"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

/**
 * One Socket.IO connection per browser tab, shared by everything on the page
 * that wants live messages (the chat, the admin inbox, the admin sidebar
 * badge). It opens when the first user mounts and closes after the last one
 * unmounts.
 *
 * Each (re)connection fetches a fresh one-hour pass from
 * /api/messages/socket-token, so a connection always reflects the account's
 * current sign-in and role. If the server refuses (signed out), it tries again
 * after a pause instead of hammering it.
 */

let shared: Socket | null = null;
let users = 0;
let retry: number | undefined;

function acquire() {
  users += 1;
  if (shared) return shared;
  const socket = io({
    path: "/socket.io",
    withCredentials: true,
    reconnectionDelayMax: 10_000,
    auth: (send) => {
      fetch("/api/messages/socket-token", { cache: "no-store" })
        .then((response) => response.json())
        .then((data: { token?: string }) => send({ token: data.token ?? "" }))
        .catch(() => send({ token: "" }));
    },
  });
  // A refused handshake doesn't retry by itself.
  socket.on("connect_error", () => {
    if (socket.active) return;
    window.clearTimeout(retry);
    retry = window.setTimeout(() => {
      if (shared === socket) socket.connect();
    }, 15_000);
  });
  shared = socket;
  return socket;
}

function release() {
  users = Math.max(0, users - 1);
  if (users > 0 || !shared) return;
  window.clearTimeout(retry);
  shared.disconnect();
  shared = null;
}

/**
 * The shared socket while `enabled` (e.g. only when signed in), and whether
 * it is connected. When it isn't, callers fall back to checking every few
 * seconds.
 */
export function useLiveSocket(enabled: boolean) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const current = acquire();
    const update = () => setConnected(current.connected);
    current.on("connect", update);
    current.on("disconnect", update);
    setSocket(current);
    update();
    return () => {
      current.off("connect", update);
      current.off("disconnect", update);
      setSocket(null);
      setConnected(false);
      release();
    };
  }, [enabled]);

  return { socket, connected };
}

/** Calls `handler` for `event` on the shared socket while mounted. */
export function useSocketEvent<T>(socket: Socket | null, event: string, handler: (payload: T) => void) {
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

/** Runs `check` every `ms` while the socket is not connected (the fallback when live updates are down). */
export function useFallbackPolling(active: boolean, connected: boolean, check: () => void, ms = 10_000) {
  useEffect(() => {
    if (!active || connected) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, ms);
    return () => window.clearInterval(timer);
  }, [active, connected, check, ms]);
}
