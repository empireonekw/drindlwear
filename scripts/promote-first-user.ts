import { config } from "dotenv";
import mongoose from "mongoose";

import { connectToDatabase } from "../lib/mongodb";
import { UserModel } from "../lib/models";

config({ path: ".env.local" });
config();

async function promoteFirstUser() {
  await connectToDatabase();

  if (await UserModel.exists({ role: "admin" })) {
    console.log("An admin account already exists; no account was changed.");
    return;
  }

  const firstUser = await UserModel.findOne()
    .sort({ createdAt: 1, _id: 1 })
    .select("_id role")
    .lean();
  if (!firstUser) {
    throw new Error("No user account exists to promote.");
  }

  const promoted = await UserModel.findOneAndUpdate(
    { _id: firstUser._id, role: firstUser.role },
    { $set: { role: "admin" } },
    { returnDocument: "after" },
  )
    .select("_id")
    .lean();

  if (!promoted) {
    throw new Error("The first account changed during promotion; no change was made.");
  }

  console.log("The first registered account is now an admin.");
}

promoteFirstUser()
  .catch((error: unknown) => {
    console.error("Could not promote the first user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
