import { promisify } from "node:util";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { CounterModel, UserModel, UserRole } from "@/lib/models";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "dw_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export function ensureAuthConfigured() {
  authSecret();
}

export async function claimInitialAdminRole() {
  try {
    await CounterModel.create({ _id: "admin-bootstrap", seq: 0 });
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== 11000
    ) {
      throw error;
    }
  }

  if (await UserModel.exists({})) {
    await CounterModel.updateOne(
      { _id: "admin-bootstrap", seq: 0 },
      { $set: { seq: 1 } },
    );
    return false;
  }

  const claim = await CounterModel.findOneAndUpdate(
    { _id: "admin-bootstrap", seq: 0 },
    { $set: { seq: 1 } },
    { new: true },
  );
  return Boolean(claim);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession(user: {
  id: string;
  role: UserRole;
}) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(authSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (!payload.sub) return null;

    const user = await UserModel.findById(payload.sub).select("name email role");
    if (!user) return null;

    return {
      id: String(user._id),
      name: user.name as string,
      email: user.email as string,
      role: user.role as UserRole,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AUTH_SECRET")) {
      throw error;
    }
    return null;
  }
}

export async function getAdminUser(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return user?.role === "admin" ? user : null;
}
