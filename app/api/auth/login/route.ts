import { NextResponse } from "next/server";

import {
  clearRateLimit,
  clientIp,
  createSession,
  normalizeEmail,
  rateLimited,
  timingSafeDummyHash,
  toPublicUser,
  UserDoc,
  verifyPassword,
} from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return fail("Please enter your email and password.");

  const ipKey = `login-ip:${clientIp(request)}`;
  const emailKey = `login-email:${email}`;
  if (rateLimited(ipKey) || rateLimited(emailKey)) {
    return fail("Too many sign-in attempts. Please wait 15 minutes and try again.", 429);
  }

  try {
    const db = await getDb();
    const user = await db.collection<UserDoc>("users").findOne({ email });
    // Check a password even for unknown emails so the response time doesn't
    // reveal which emails have accounts.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await timingSafeDummyHash()));
    if (!user || !valid) return fail("Incorrect email or password.", 401);

    clearRateLimit(emailKey);
    await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    await createSession(user._id);
    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Sign-in failed:", error);
    return fail("We couldn't sign you in right now. Please try again.", 500);
  }
}
