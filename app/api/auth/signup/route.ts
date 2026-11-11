import { MongoServerError, ObjectId } from "mongodb";

import {
  createSession,
  EMAIL_PATTERN,
  hashPassword,
  normalizeEmail,
  passwordProblem,
  toPublicUser,
  UserDoc,
} from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";
import {
  blockIp,
  clientIp,
  fingerprint,
  hit,
  ipBlockedUntil,
  jsonError,
  jsonOk,
  limits,
  readJsonBody,
  str,
  tooMany,
  trackDistinct,
  windows,
} from "@/lib/server/security";
import { noteError, withMetrics } from "@/lib/server/metrics";

export const dynamic = "force-dynamic";

/** Sign-up attempts per IP per hour. */
const ATTEMPTS_PER_IP = 10;
/** Sign-ups across the whole site per hour: a ceiling even if IPs are faked. */
const GLOBAL_PER_HOUR = Number(process.env.SIGNUPS_PER_HOUR) || 300;

const fieldError = (error: string, field: string) => jsonError(400, error, { field });

async function handlePOST(request: Request) {
  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;

  try {
    const ip = clientIp(request);
    const blocked = await ipBlockedUntil(ip);
    if (blocked) return tooMany(blocked, "Too many attempts from your network. Please try again later.");

    // Honeypot: a field people never see. Bots that fill every input get a plain refusal.
    if (str(body.website)) return jsonError(400, "Invalid request.");

    const perIp = await hit("signup-ip", ip, windows.hours(1));
    if (perIp.count > ATTEMPTS_PER_IP) return tooMany(perIp.expiresAt);
    const global = await hit("signup-global", "all", windows.hours(1));
    if (global.count > GLOBAL_PER_HOUR) {
      return tooMany(global.expiresAt, "Sign-ups are busy right now. Please try again shortly.");
    }

    const name = str(body.name, 200).trim().replace(/\s+/g, " ");
    const email = normalizeEmail(str(body.email, 300));
    const phone = str(body.phone, 40).trim();
    const password = str(body.password, 512);

    if (name.length < 2) return fieldError("Please enter your full name.", "name");
    if (name.length > 80) return fieldError("Name must be at most 80 characters.", "name");
    if (/[<>]/.test(name)) return fieldError("Name can't contain < or >.", "name");
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return fieldError("Please enter a valid email address.", "email");
    }
    if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone)) {
      return fieldError("Please enter a valid phone number.", "phone");
    }
    const problem = passwordProblem(password);
    if (problem) return fieldError(problem, "password");
    if (password.toLowerCase().includes(email.split("@")[0]) && email.split("@")[0].length >= 4) {
      return fieldError("Password can't contain your email name.", "password");
    }
    if (body.acceptTerms !== true) {
      return fieldError("Please accept the privacy policy to continue.", "acceptTerms");
    }

    // Many different emails from one IP in a short time looks like a bot:
    // block that IP for an hour.
    const distinctEmails = await trackDistinct("signup-emails", ip, email, windows.hours(1));
    if (distinctEmails > limits.maxAccountsPerIp) {
      await blockIp(ip, windows.hours(1));
      return tooMany(new Date(Date.now() + windows.hours(1)), "Too many attempts from your network. Please try again later.");
    }

    // At most N accounts per IP within the window (default 5 in 30 days).
    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const signupIpHash = fingerprint(`signup-ip:${ip}`);
    const recentAccounts = await users.countDocuments({
      signupIpHash,
      createdAt: { $gt: new Date(Date.now() - limits.accountsPerIpWindowMs) },
    });
    if (recentAccounts >= limits.maxAccountsPerIp) {
      return jsonError(
        429,
        "Too many accounts have been created from your network. Please contact us if you need help.",
      );
    }

    const user: UserDoc = {
      _id: new ObjectId(),
      name,
      email,
      ...(phone ? { phone } : {}),
      passwordHash: await hashPassword(password),
      role: "customer",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      signupIpHash,
    };
    await users.insertOne(user);
    await createSession(user._id);
    return jsonOk({ user: toPublicUser(user) }, 201);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fieldError("An account with this email already exists. Try signing in.", "email");
    }
    noteError(error);
    console.error("Sign-up failed:", error instanceof Error ? error.message : error);
    return jsonError(500, "We couldn't create your account right now. Please try again.");
  }
}

export const POST = withMetrics("auth", handlePOST);
