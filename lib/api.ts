import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (
    message === "MONGODB_URI is not configured." ||
    message.startsWith("AUTH_SECRET must") ||
    message.startsWith("ADMIN_SETUP_KEY must") ||
    message.startsWith("Cloudinary is not configured.")
  ) {
    return NextResponse.json(
      { error: message },
      { status: 503 },
    );
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "MongooseServerSelectionError" ||
      error.name === "MongoNetworkError")
  ) {
    console.error("MongoDB is unavailable:", error);
    return NextResponse.json(
      { error: "Database is unavailable. Check MONGODB_URI and connectivity." },
      { status: 503 },
    );
  }

  if (error instanceof SyntaxError) {
    return invalidRequest("Request body must contain valid JSON.");
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    return invalidRequest("A record with the same unique value already exists.", 409);
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "ValidationError" || error.name === "CastError")
  ) {
    return invalidRequest("Request data failed validation.");
  }

  console.error("API request failed:", error);
  return NextResponse.json(
    { error: "An unexpected server error occurred." },
    { status: 500 },
  );
}

export function invalidRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(
  value: unknown,
  maxLength = 500,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

export function isEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function isPhone(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.trim().length > 24 ||
    !/^\+?[0-9\s().-]+$/.test(value.trim())
  ) {
    return false;
  }
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
