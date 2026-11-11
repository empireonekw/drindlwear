/**
 * Creates or updates the store's admin account from .env.local:
 *
 *   ADMIN_EMAIL, ADMIN_PASSWORD (required), ADMIN_NAME (optional)
 *
 * Run with:  npm run seed:admin
 *
 * Safe to run again: an existing account with that email is promoted to
 * admin and its password is reset to ADMIN_PASSWORD (which also signs it out
 * everywhere). The password hash format must match lib/server/auth.ts.
 */

import { randomBytes, scrypt } from "node:crypto";
import { MongoClient } from "mongodb";

const SCRYPT_N = 16384;
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: SCRYPT_N, r: 8, p: 1 }, (error, key) =>
      error
        ? reject(error)
        : resolve(`scrypt$${SCRYPT_N}$${salt.toString("hex")}$${key.toString("hex")}`),
    ),
  );
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME?.trim() || "Store Admin";

if (!uri) fail("MONGODB_URI is not set in .env.local.");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Set a valid ADMIN_EMAIL in .env.local.");
if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  fail("ADMIN_PASSWORD must be at least 8 characters with a letter and a number.");
}

const client = await new MongoClient(uri).connect();
try {
  // Same database choice as lib/server/mongodb.ts.
  let db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  if (db.databaseName === "test" && !process.env.MONGODB_DB) db = client.db("dirndl-wear");

  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true });

  const passwordHash = await hashPassword(password);
  const existing = await users.findOne({ email });
  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: "admin", passwordHash } });
    await db.collection("sessions").deleteMany({ userId: existing._id });
    console.log(`✔ Updated ${email} in "${db.databaseName}": role set to admin, password reset.`);
  } else {
    await users.insertOne({ name, email, passwordHash, role: "admin", createdAt: new Date() });
    console.log(`✔ Created admin ${email} in "${db.databaseName}".`);
  }
} finally {
  await client.close();
}
