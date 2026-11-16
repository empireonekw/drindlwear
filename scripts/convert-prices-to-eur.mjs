/**
 * One-off: converts the catalogue's prices from rupees to euros by dividing
 * by 100 (Rs 14,990 → €149.90), for `price` and `oldPrice`.
 *
 * Run with:  npm run convert:eur
 *
 * Runs only once per database: it records "prices-eur" in the `meta`
 * collection and refuses to run again, so prices are never divided twice.
 */

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✖ MONGODB_URI is not set in .env.local.");
  process.exit(1);
}

const toEuros = (value) => Math.round(value) / 100;

const client = await new MongoClient(uri).connect();
try {
  // Same database choice as lib/server/mongodb.ts.
  let db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  if (db.databaseName === "test" && !process.env.MONGODB_DB) db = client.db("dirndl-wear");

  const meta = db.collection("meta");
  const done = await meta.findOne({ _id: "prices-eur" });
  if (done) {
    console.log(`✔ Prices in "${db.databaseName}" were already converted on ${done.at.toISOString()}. Nothing changed.`);
    process.exit(0);
  }

  const catalog = db.collection("catalog");
  const products = await catalog.find({}, { projection: { id: 1, name: 1, price: 1, oldPrice: 1 } }).toArray();
  for (const product of products) {
    const set = { price: toEuros(product.price), updatedAt: new Date() };
    if (typeof product.oldPrice === "number") set.oldPrice = toEuros(product.oldPrice);
    await catalog.updateOne({ _id: product._id }, { $set: set });
    console.log(`  #${product.id} ${product.name}: ${product.price} → €${set.price.toFixed(2)}`);
  }
  await meta.insertOne({ _id: "prices-eur", at: new Date(), count: products.length });
  console.log(`✔ Converted ${products.length} product(s) in "${db.databaseName}" to euros.`);
} finally {
  await client.close();
}
