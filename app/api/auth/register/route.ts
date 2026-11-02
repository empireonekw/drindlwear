import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isEmail, isNonEmptyString, isRecord } from "@/lib/api";
import {
  claimInitialAdminRole,
  createSession,
  ensureAuthConfigured,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    ensureAuthConfigured();
    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      !isNonEmptyString(body.name, 120) ||
      !isEmail(body.email) ||
      typeof body.password !== "string" ||
      body.password.length < 8 ||
      body.password.length > 128
    ) {
      return invalidRequest(
        "Name, valid email and a password of 8 to 128 characters are required.",
      );
    }

    const email = body.email.trim().toLowerCase();
    if (await UserModel.exists({ email })) {
      return invalidRequest("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(body.password);
    const role = (await claimInitialAdminRole()) ? "admin" : "customer";
    const user = await UserModel.create({
      name: body.name.trim(),
      email,
      passwordHash,
      role,
    });
    const response = NextResponse.json(
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
    setSessionCookie(
      response,
      await createSession({
        id: String(user._id),
        role: user.role as "customer" | "admin",
      }),
    );
    return response;
  } catch (error) {
    return apiError(error);
  }
}
