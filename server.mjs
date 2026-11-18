// Runs the shop: Next.js and the Socket.IO server for live messages, on one port.
//
//   npm run dev     → node scripts/dev.mjs → this file in development
//   pm2 (live site) → NODE_ENV=production node server.mjs -H 127.0.0.1 -p 4820
//
// Sockets only push updates (new message, status change, "typing…"). Sending a
// message goes through the normal API routes (app/api/messages, app/api/admin/messages),
// which save it and then push it out through `globalThis.__dwSocket`.
//
// Who may connect: anyone with a socket token from /api/messages/socket-token (a
// signed-in account). The token is signed with AUTH_SECRET (lib/server/realtime.ts
// makes it, this file checks it). Customers join only their own room; admins join
// the "admins" room and receive every conversation.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

import nextEnv from "@next/env";
import next from "next";
import { Server } from "socket.io";

const args = process.argv.slice(2);
const argValue = (...names) => {
  const index = args.findIndex((arg) => names.includes(arg));
  return index >= 0 ? args[index + 1] : undefined;
};

const dev = process.env.NODE_ENV !== "production";
process.env.NODE_ENV = dev ? "development" : "production";
const hostname = argValue("-H", "--hostname") ?? process.env.HOST ?? (dev ? "localhost" : "127.0.0.1");
const port = Number(argValue("-p", "--port") ?? process.env.PORT ?? 3000);
// A second dev server needs its own build folder (see next.config.mjs).
const distDir = argValue("--dist-dir");
if (distDir) process.env.NEXT_DIST_DIR = distDir;

// .env.local etc., the same files Next.js reads (AUTH_SECRET is needed below).
nextEnv.loadEnvConfig(process.cwd(), dev);

const httpServer = createServer();
// Passing the server lets Next.js take its own websocket (hot reload in development).
const app = next({ dev, hostname, port, httpServer });
const handle = app.getRequestHandler();

// ----------------------------------------------------------------------------- tokens

const USER_ID = /^[a-f0-9]{24}$/;

/** Checks "<userId>.<role>.<expires>.<signature>"; returns { userId, role } or null. */
function readToken(token) {
  const secret = process.env.AUTH_SECRET;
  if (typeof token !== "string" || !secret || secret.length < 32) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, role, expires, signature] = parts;
  if (!USER_ID.test(userId) || (role !== "customer" && role !== "admin")) return null;
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now() / 1000) return null;
  const expected = createHmac("sha256", `socket:${secret}`).update(`${userId}.${role}.${expires}`).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { userId, role };
}

// ----------------------------------------------------------------------------- sockets

/** The host the browser used (behind nginx this is the forwarded host). */
const requestHost = (req) =>
  String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim().toLowerCase();

const io = new Server(httpServer, {
  path: "/socket.io",
  serveClient: false,
  // Other upgrade requests (Next.js hot reload) must be left alone, not closed.
  destroyUpgrade: false,
  maxHttpBufferSize: 16 * 1024, // clients only send tiny "typing" events
  pingInterval: 25_000,
  pingTimeout: 20_000,
  // Only pages from this site may connect (when the browser says where it came from).
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    if (!origin) return callback(null, true);
    try {
      callback(null, new URL(origin).host.toLowerCase() === requestHost(req));
    } catch {
      callback(null, false);
    }
  },
});

io.use((socket, nextStep) => {
  const who = readToken(socket.handshake.auth?.token);
  if (!who) return nextStep(new Error("unauthorized"));
  socket.data.userId = who.userId;
  socket.data.role = who.role;
  nextStep();
});

io.on("connection", (socket) => {
  const { userId, role } = socket.data;
  socket.join(`user:${userId}`);
  if (role === "admin") socket.join("admins");

  // "typing…": a customer tells the team; an admin tells one customer. At most every 1.5 s.
  let lastTyping = 0;
  socket.on("typing", (payload) => {
    const now = Date.now();
    if (now - lastTyping < 1500) return;
    lastTyping = now;
    if (role === "admin") {
      const target = payload && typeof payload.userId === "string" ? payload.userId : "";
      if (USER_ID.test(target)) io.to(`user:${target}`).emit("typing", {});
    } else {
      io.to("admins").emit("typing", { userId });
    }
  });
});

globalThis.__dwSocket = io;

// ----------------------------------------------------------------------------- start

await app.prepare();
httpServer.on("request", (req, res) => {
  // Socket.IO answers its own long-polling requests; everything else is Next.js.
  if (req.url?.startsWith("/socket.io/")) return;
  handle(req, res);
});
// A busy port means another server is already running: say so plainly and stop,
// instead of staying alive half-started.
httpServer.once("error", (error) => {
  if (error.code !== "EADDRINUSE") throw error;
  console.error(
    `\n✖ Port ${port} is already in use: another dev server is still running.\n` +
      `  Stop it (close its terminal or press Ctrl+C there), or use another port:  npm run dev -- -p ${port + 1}\n`,
  );
  process.exit(1);
});
httpServer.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port} (${dev ? "development" : "production"}, live messages on)`);
});

// Started by scripts/dev.mjs: stop when the launcher goes away (no orphaned dev servers).
if (process.send) process.on("disconnect", () => process.exit(0));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
