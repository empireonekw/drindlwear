import { NextRequest, NextResponse } from "next/server";

import { apiError, invalidRequest, isEmail, isRecord } from "@/lib/api";
import {
  createSession,
  ensureAuthConfigured,
  setSessionCookie,
  verifyPassword,
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
      !isEmail(body.email) ||
      typeof body.password !== "string" ||
      body.password.length === 0
    ) {
      return invalidRequest("Valid email and password are required.");
    }

    const user = await UserModel.findOne({
      email: body.email.trim().toLowerCase(),
    }).select("+passwordHash");
    const valid =
      user && (await verifyPassword(body.password, user.passwordHash as string));
    if (!user || !valid) {
      return invalidRequest("Email or password is incorrect.", 401);
    }

    const response = NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
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
