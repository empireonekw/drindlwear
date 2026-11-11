import {
  createSession,
  normalizeEmail,
  timingSafeDummyHash,
  toPublicUser,
  UserDoc,
  verifyPassword,
} from "@/lib/server/auth";
import { getDb } from "@/lib/server/mongodb";
import {
  blockIp,
  clientIp,
  hit,
  ipBlockedUntil,
  jsonError,
  jsonOk,
  limits,
  peek,
  readJsonBody,
  reset,
  str,
  tooMany,
  trackDistinct,
  windows,
} from "@/lib/server/security";

export const dynamic = "force-dynamic";

/** Sign-in requests per IP per 15 minutes. */
const ATTEMPTS_PER_IP = 30;
/** Wrong passwords for one email before it is locked for 15 minutes. */
const FAILURES_PER_EMAIL = 5;

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;
  const { body } = parsed;

  try {
    const ip = clientIp(request);
    const blocked = await ipBlockedUntil(ip);
    if (blocked) return tooMany(blocked, "Too many attempts from your network. Please try again later.");

    const perIp = await hit("login-ip", ip, windows.minutes(15));
    if (perIp.count > ATTEMPTS_PER_IP) return tooMany(perIp.expiresAt);

    const email = normalizeEmail(str(body.email, 300));
    const password = str(body.password, 512);
    if (!email || !password) return jsonError(400, "Please enter your email and password.");

    // Locked after repeated wrong passwords. This applies to any email,
    // registered or not, so it doesn't reveal which emails have accounts.
    const failures = await peek("login-fail", email);
    if (failures.count >= FAILURES_PER_EMAIL) {
      const minutes = Math.ceil((failures.expiresAt.getTime() - Date.now()) / 60000);
      return tooMany(
        failures.expiresAt,
        `Too many failed attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
      );
    }

    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const user = await users.findOne({ email });
    // Check a password even for unknown emails so the response time doesn't
    // reveal which emails have accounts.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await timingSafeDummyHash()));

    if (!user || !valid) {
      await hit("login-fail", email, windows.minutes(15));
      // One IP failing with many different emails is credential stuffing:
      // block it for an hour.
      const distinct = await trackDistinct("login-fail-emails", ip, email, windows.minutes(15));
      if (distinct > limits.maxAccountsPerIp) await blockIp(ip, windows.hours(1));
      return jsonError(401, "Incorrect email or password.");
    }

    await reset("login-fail", email);
    await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    await createSession(user._id);
    return jsonOk({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Sign-in failed:", error instanceof Error ? error.message : error);
    return jsonError(500, "We couldn't sign you in right now. Please try again.");
  }
}
