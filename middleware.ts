import { NextRequest, NextResponse } from "next/server";

/**
 * Guards every /api request before it reaches a route:
 *
 * - Requests that change something (POST, PUT, PATCH, DELETE) must come from
 *   this site's own pages. Another website can't make a visitor's browser
 *   sign in, sign out or create accounts (CSRF).
 * - Only the methods the API uses are accepted.
 * - API responses are never cached or indexed by search engines.
 */

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);
const SAFE_METHODS = new Set(["GET", "HEAD"]);

function deny(status: number, error: string) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}

/** The host this request was sent to, as the browser saw it. */
function requestHost(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host)
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function sameOrigin(request: NextRequest) {
  // Modern browsers say directly whether the request came from this site.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    return new URL(origin).host.toLowerCase() === requestHost(request);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (!ALLOWED_METHODS.has(request.method)) return deny(405, "Method not allowed.");
  if (!SAFE_METHODS.has(request.method) && !sameOrigin(request)) return deny(403, "Forbidden.");

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: "/api/:path*" };
