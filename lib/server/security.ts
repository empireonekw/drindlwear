import "server-only";

import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import { getDb } from "./mongodb";

// ---------------------------------------------------------------------------
// Settings (override in .env.local)

const envInt = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};

export const limits = {
  /** New accounts allowed from one IP address in the window below. */
  maxAccountsPerIp: envInt("MAX_ACCOUNTS_PER_IP", 5),
  accountsPerIpWindowMs: envInt("ACCOUNTS_PER_IP_WINDOW_DAYS", 30) * 24 * 60 * 60 * 1000,
};

const MINUTE = 60 * 1000;

// ---------------------------------------------------------------------------
// Hashing: IPs and emails are never stored as-is in limiter records.

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (32+ characters). Add it to .env.local.");
  }
  return value;
}

export const fingerprint = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

// ---------------------------------------------------------------------------
// Client IP

/**
 * The caller's IP address.
 *
 * Next.js passes the X-Forwarded-For header through as the client sent it, so
 * on its own that header can be faked. In production, run behind a host or
 * proxy that sets the real IP (Vercel and nginx set `x-real-ip`) and set
 * TRUSTED_IP_HEADER to that header's name. Without it, the right-most
 * X-Forwarded-For entry is used: that's the one added by the nearest proxy.
 */
export function clientIp(request: Request) {
  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  const fromTrusted = trusted ? request.headers.get(trusted)?.split(",")[0]?.trim() : undefined;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  const ip = fromTrusted || forwarded?.[forwarded.length - 1] || "unknown";
  // Only characters that appear in IPv4/IPv6 addresses; anything else is junk.
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip.toLowerCase() : "invalid";
}

// ---------------------------------------------------------------------------
// MongoDB-backed fixed-window counters. They survive restarts and are shared
// by every server instance. MongoDB deletes expired records by itself.

type LimitDoc = { _id: string; count: number; expiresAt: Date; values?: string[] };

async function limitsCollection() {
  const db = await getDb();
  return db.collection<LimitDoc>("rate_limits");
}

const keyFor = (bucket: string, id: string) => `${bucket}:${fingerprint(id)}`;

/** Adds one to a counter and returns the new count and when the window ends. */
export async function hit(bucket: string, id: string, windowMs: number) {
  const now = new Date();
  const fresh = { $not: [{ $gt: ["$expiresAt", now] }] };
  const doc = await (await limitsCollection()).findOneAndUpdate(
    { _id: keyFor(bucket, id) },
    [
      {
        $set: {
          count: { $cond: [fresh, 1, { $add: ["$count", 1] }] },
          values: { $cond: [fresh, [], { $ifNull: ["$values", []] }] },
          expiresAt: { $cond: [fresh, new Date(now.getTime() + windowMs), "$expiresAt"] },
        },
      },
    ],
    { upsert: true, returnDocument: "after" },
  );
  return { count: doc?.count ?? 1, expiresAt: doc?.expiresAt ?? new Date(now.getTime() + windowMs) };
}

/**
 * Remembers `value` (hashed) in a set for this window and returns how many
 * different values have been seen, e.g. distinct emails tried from one IP.
 */
export async function trackDistinct(bucket: string, id: string, value: string, windowMs: number) {
  const now = new Date();
  const fresh = { $not: [{ $gt: ["$expiresAt", now] }] };
  const hashed = fingerprint(value);
  const doc = await (await limitsCollection()).findOneAndUpdate(
    { _id: keyFor(bucket, id) },
    [
      {
        $set: {
          values: {
            $setUnion: [{ $cond: [fresh, [], { $ifNull: ["$values", []] }] }, [hashed]],
          },
          count: { $cond: [fresh, 1, { $add: ["$count", 1] }] },
          expiresAt: { $cond: [fresh, new Date(now.getTime() + windowMs), "$expiresAt"] },
        },
      },
    ],
    { upsert: true, returnDocument: "after" },
  );
  return doc?.values?.length ?? 1;
}

/** Current count without adding to it (0 when there is no live window). */
export async function peek(bucket: string, id: string) {
  const doc = await (await limitsCollection()).findOne({
    _id: keyFor(bucket, id),
    expiresAt: { $gt: new Date() },
  });
  return doc ? { count: doc.count, expiresAt: doc.expiresAt } : { count: 0, expiresAt: new Date() };
}

export async function reset(bucket: string, id: string) {
  await (await limitsCollection()).deleteOne({ _id: keyFor(bucket, id) });
}

/** Blocks an IP from signing in or signing up for `windowMs`. */
export async function blockIp(ip: string, windowMs: number) {
  const until = new Date(Date.now() + windowMs);
  await (await limitsCollection()).updateOne(
    { _id: keyFor("ip-block", ip) },
    { $set: { count: 1, expiresAt: until } },
    { upsert: true },
  );
}

export async function ipBlockedUntil(ip: string) {
  const { count, expiresAt } = await peek("ip-block", ip);
  return count > 0 ? expiresAt : null;
}

export const windows = {
  minutes: (n: number) => n * MINUTE,
  hours: (n: number) => n * 60 * MINUTE,
};

// ---------------------------------------------------------------------------
// Responses and request parsing

const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export function jsonError(status: number, error: string, extra?: Record<string, unknown>, headers?: HeadersInit) {
  return NextResponse.json({ error, ...extra }, { status, headers: { ...noStore, ...headers } });
}

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

export function tooMany(until: Date, message = "Too many attempts. Please try again later.") {
  const seconds = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));
  return jsonError(429, message, { retryAfter: seconds }, { "Retry-After": String(seconds) });
}

const MAX_BODY_BYTES = 4 * 1024;

/**
 * Reads a small JSON object body. Anything else (wrong content type, too
 * big, not an object) gets a plain 400/413/415 without details.
 */
export async function readJsonBody(
  request: Request,
): Promise<{ body: Record<string, unknown> } | { response: NextResponse }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { response: jsonError(415, "Unsupported request.") };
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return { response: jsonError(413, "Request too large.") };

  const text = await request.text().catch(() => "");
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return { response: jsonError(413, "Request too large.") };
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
    return { body: parsed as Record<string, unknown> };
  } catch {
    return { response: jsonError(400, "Invalid request.") };
  }
}

/** A string field, or "" for anything that isn't a string (blocks `{ "$gt": "" }` tricks). */
export const str = (value: unknown, max = 512) => (typeof value === "string" ? value.slice(0, max) : "");
