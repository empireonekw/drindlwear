import "server-only";

import { Db, MongoClient } from "mongodb";

/**
 * One MongoClient per server process. In development Next.js reloads modules
 * on every change, so the client is kept on `globalThis` to avoid opening a
 * new connection pool each time.
 */
const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
  mongoIndexesPromise?: Promise<void>;
};

function clientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = new MongoClient(uri).connect().catch((error) => {
      // Let the next request try again instead of caching the failure.
      globalForMongo.mongoClientPromise = undefined;
      throw error;
    });
  }
  return globalForMongo.mongoClientPromise;
}

/**
 * The store's database: the one named in MONGODB_URI (".../Drindlewear?..."),
 * or MONGODB_DB when set, or "dirndl-wear".
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const database = db.databaseName === "test" && !process.env.MONGODB_DB ? client.db("dirndl-wear") : db;
  await ensureIndexes(database);
  return database;
}

/** Creates the auth indexes once per process. */
function ensureIndexes(db: Db) {
  if (!globalForMongo.mongoIndexesPromise) {
    globalForMongo.mongoIndexesPromise = Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      // Counting accounts created from one IP (stored as a keyed hash, never raw).
      db.collection("users").createIndex({ signupIpHash: 1, createdAt: 1 }, { sparse: true }),
      // Rate-limit counters expire on their own.
      db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
      // MongoDB removes sessions by itself once they expire.
      db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ])
      .then(() => undefined)
      .catch((error) => {
        globalForMongo.mongoIndexesPromise = undefined;
        throw error;
      });
  }
  return globalForMongo.mongoIndexesPromise;
}
