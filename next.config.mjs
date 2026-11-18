const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy: the browser only loads scripts, styles, images and
 * connections from this site, refuses to run plugins, and won't let other
 * sites put these pages in a frame. Next.js needs inline scripts to start the
 * page, and the dev server also needs eval and a websocket for hot reload.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Tells browsers to use HTTPS only, for two years. Only sent in production.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  // scripts/deploy.sh builds into .next-build while the live site keeps serving .next.
  // NEXT_DIST_DIR also lets a second dev server use its own folder: two dev servers
  // compiling into the same .next-dev break each other (React "Invalid hook call").
  distDir: process.env.NEXT_DIST_DIR || (isDev ? ".next-dev" : ".next"),
  // Don't advertise the framework in an "X-Powered-By: Next.js" header.
  poweredByHeader: false,
  // Never ship source maps to browsers in production.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/(admin|account)(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
