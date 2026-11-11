import { NextResponse } from "next/server";
import { MongoServerError, ObjectId } from "mongodb";

import {
  clientIp,
  createSession,
  EMAIL_PATTERN,
  hashPassword,
  normalizeEmail,
  passwordProblem,
  rateLimited,
  toPublicUser,
  UserDoc,
} from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400, field?: string) =>
  NextResponse.json({ error, ...(field ? { field } : {}) }, { status });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.");

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const email = normalizeEmail(body.email);
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) return fail("Please enter your full name.", 400, "name");
  if (name.length > 80) return fail("Name must be at most 80 characters.", 400, "name");
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return fail("Please enter a valid email address.", 400, "email");
  }
  if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone)) {
    return fail("Please enter a valid phone number.", 400, "phone");
  }
  const problem = passwordProblem(password);
  if (problem) return fail(problem, 400, "password");
  if (body.acceptTerms !== true) {
    return fail("Please accept the privacy policy to continue.", 400, "acceptTerms");
  }

  if (rateLimited(`signup:${clientIp(request)}`)) {
    return fail("Too many attempts. Please wait a few minutes and try again.", 429);
  }

  try {
    const db = await getDb();
    const user: UserDoc = {
      _id: new ObjectId(),
      name,
      email,
      ...(phone ? { phone } : {}),
      passwordHash: await hashPassword(password),
      role: "customer",
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    await db.collection<UserDoc>("users").insertOne(user);
    await createSession(user._id);
    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail("An account with this email already exists. Try signing in.", 409, "email");
    }
    console.error("Sign-up failed:", error);
    return fail("We couldn't create your account right now. Please try again.", 500);
  }
}
