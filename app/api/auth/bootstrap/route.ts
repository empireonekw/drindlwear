import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isEmail, isNonEmptyString, isRecord } from "@/lib/api";
import { ensureAuthConfigured, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CounterModel, UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const setupKey = process.env.ADMIN_SETUP_KEY;
    const suppliedKey = request.headers.get("x-admin-setup-key") ?? "";
    if (!setupKey || Buffer.byteLength(setupKey) < 24) {
      return invalidRequest("Admin bootstrap is not configured.", 503);
    }
    const expected = Buffer.from(setupKey);
    const supplied = Buffer.from(suppliedKey);
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return invalidRequest("Invalid setup key.", 401);
    }

    await connectToDatabase();
    ensureAuthConfigured();
    await CounterModel.updateOne(
      { _id: "admin-bootstrap" },
      { $setOnInsert: { seq: 0 } },
      { upsert: true },
    );
    const lock = await CounterModel.findOneAndUpdate(
      { _id: "admin-bootstrap", seq: 0 },
      { $set: { seq: 1 } },
      { new: true },
    );
    if (!lock) return invalidRequest("Admin bootstrap has already been used.", 409);

    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      !isNonEmptyString(body.name, 120) ||
      !isEmail(body.email) ||
      typeof body.password !== "string" ||
      body.password.length < 12 ||
      body.password.length > 128
    ) {
      await CounterModel.updateOne({ _id: "admin-bootstrap" }, { $set: { seq: 0 } });
      return invalidRequest(
        "Name, valid email and a password of 12 to 128 characters are required.",
      );
    }
    if (await UserModel.exists({ role: "admin" })) {
      return invalidRequest("An admin account already exists.", 409);
    }

    try {
      await UserModel.create({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        passwordHash: await hashPassword(body.password),
        role: "admin",
      });
    } catch (error) {
      await CounterModel.updateOne(
        { _id: "admin-bootstrap", seq: 1 },
        { $set: { seq: 0 } },
      );
      throw error;
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
