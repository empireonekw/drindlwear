import mongoose from "mongoose";
import { config } from "dotenv";

import { categories, products } from "../lib/data";
import { connectToDatabase } from "../lib/mongodb";
import { CategoryModel, CounterModel, ProductModel } from "../lib/models";

config({ path: ".env.local" });

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seed() {
  await connectToDatabase();

  for (const name of categories) {
    await CategoryModel.updateOne(
      { name },
      {
        $setOnInsert: {
          name,
          slug: slugify(name),
          description: "",
        },
      },
      { upsert: true },
    );
  }

  for (const product of products) {
    await ProductModel.updateOne(
      { id: product.id },
      { $setOnInsert: product },
      { upsert: true },
    );
  }

  await CounterModel.updateOne(
    { _id: "products" },
    { $max: { seq: Math.max(...products.map((product) => product.id)) } },
    { upsert: true },
  );
  console.log(`Seeded ${products.length} products and ${categories.length} categories.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
