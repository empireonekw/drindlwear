import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "./mongodb";

/**
 * In production the cookie gets the `__Host-` prefix: browsers then only
 * accept it over HTTPS, for this exact host, on path "/", which stops
 * subdomains or plain-HTTP pages from planting or overwriting it.
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-dw_session" : "dw_session";
const SESSION_DAYS = 30;

export type UserRole = "customer" | "admin";

export type UserDoc = {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
  /** Keyed hash of the IP the account was created from (for the accounts-per-IP limit). */
  signupIpHash?: string;
};

type SessionDoc = {
  _id?: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
};

/** What the browser is allowed to see about a user. */
export type PublicUser = {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
};

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    name: user.name,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Passwords: scrypt with a random salt per user, stored as
// "scrypt$<N>$<salt hex>$<hash hex>" so the cost can be raised later.

const SCRYPT_N = 16384;
const KEY_LENGTH = 64;

function scryptAsync(password: string, salt: Buffer, N: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r: 8, p: 1 }, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, SCRYPT_N);
  return `scrypt$${SCRYPT_N}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, n, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !n || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), Number(n));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A real hash to check against when the email is unknown, so both cases take as long. */
let dummyHash: Promise<string> | undefined;
export function timingSafeDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

// ---------------------------------------------------------------------------
// Sessions: a random token in an httpOnly cookie; only its SHA-256 is stored,
// so a database leak doesn't hand out working sessions.

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = await getDb();
  await db.collection<SessionDoc>("sessions").insertOne({
    tokenHash: hashToken(token),
    userId,
    createdAt: now,
    expiresAt,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user for this request, or null. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection<SessionDoc>("sessions")
    .findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return db.collection<UserDoc>("users").findOne({ _id: session.userId });
}

/** The signed-in admin, or null for visitors and customers. */
export async function getAdmin(): Promise<UserDoc | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.collection<SessionDoc>("sessions").deleteOne({ tokenHash: hashToken(token) });
  }
  cookies().delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Validation shared by the routes.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Returns an error message, or null when the password is acceptable. */
export function passwordProblem(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}
