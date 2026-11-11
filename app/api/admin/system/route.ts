import { getAdmin } from "@/lib/server/auth";
import { IMAGE_BUCKET } from "@/lib/server/images";
import { probeHeader, recentErrors, serverStartedAt, summarize, type GroupSummary } from "@/lib/server/metrics";
import { getDb } from "@/lib/server/mongodb";
import { jsonError, jsonOk } from "@/lib/server/security";

export const dynamic = "force-dynamic";

type Level = "ok" | "warn" | "error" | "idle" | "info";
type Check = { label: string; level: Level; detail: string };
/** `traffic` = requests per minute, used to set how many dots move on the map. */
type NodeState = { level: Level; metric: string; checks: Check[]; traffic?: number };

/** Worst level wins: error > warn > ok > info > idle. */
const rank: Record<Level, number> = { idle: 0, info: 1, ok: 2, warn: 3, error: 4 };
const worst = (checks: Check[], fallback: Level = "ok"): Level =>
  checks.reduce<Level>((level, check) => (rank[check.level] > rank[level] ? check.level : level), checks.length ? "idle" : fallback);

const ms = (value: number) => `${Math.round(value)} ms`;

async function timed(url: string, init: RequestInit = {}, timeoutMs = 15000) {
  const started = performance.now();
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(timeoutMs), ...init, headers: { ...probeHeader(), ...(init.headers ?? {}) } });
    return { ok: true as const, status: response.status, ms: performance.now() - started, headers: response.headers };
  } catch (error) {
    return { ok: false as const, status: 0, ms: performance.now() - started, error: error instanceof Error ? error.message : String(error), headers: new Headers() };
  }
}

/** Live traffic checks for one API group. */
function trafficChecks(summary: GroupSummary): Check[] {
  const checks: Check[] = [];
  if (summary.errors5m) {
    checks.push({ label: "Server errors", level: "error", detail: `${summary.errors5m} failed request${summary.errors5m === 1 ? "" : "s"} in the last 5 minutes. See recent errors below.` });
  }
  if (summary.p95 !== null) {
    checks.push({
      label: "Response time",
      level: summary.p95 > 2000 ? "warn" : "ok",
      detail: `95% of requests answered within ${ms(summary.p95)} (last 5 min).`,
    });
  }
  if (summary.clientErrors5m) {
    checks.push({ label: "Refused requests", level: "info", detail: `${summary.clientErrors5m} refused (wrong password, rate limit, bad input…). This is normal.` });
  }
  return checks;
}
const trafficMetric = (summary: GroupSummary) =>
  summary.total5m ? `${summary.perMin}/min · p95 ${summary.p95 ?? "–"} ms` : "No traffic";

// Probe results are reused for a few seconds so several open admin tabs don't hammer the server.
const cache = globalThis as unknown as { dwProbe?: { at: number; data: Record<string, NodeState> } };

async function runProbes(origin: string): Promise<Record<string, NodeState>> {
  const [home, collection, product, crossSite, adminGuard, me, image] = await Promise.all([
    timed(`${origin}/`),
    timed(`${origin}/collections/all`),
    timed(`${origin}/product/1`),
    timed(`${origin}/api/auth/logout`, { method: "POST", headers: { origin: "https://probe.invalid", "sec-fetch-site": "cross-site" } }, 8000),
    timed(`${origin}/admin`, {}, 15000),
    timed(`${origin}/api/auth/me`, {}, 8000),
    timed(`${origin}/api/images/000000000000000000000000`, {}, 8000),
  ]);

  const pageCheck = (label: string, result: Awaited<ReturnType<typeof timed>>): Check =>
    !result.ok
      ? { label, level: "error", detail: `Did not respond: ${result.error}` }
      : result.status !== 200
        ? { label, level: "error", detail: `Returned HTTP ${result.status} instead of 200.` }
        : { label, level: result.ms > 4000 ? "warn" : "ok", detail: `Loaded in ${ms(result.ms)}${result.ms > 4000 ? " (slow)" : ""}.` };
  const pages = [pageCheck("Homepage", home), pageCheck("Collection page", collection), pageCheck("Product page", product)];

  const csp = home.headers.get("content-security-policy");
  const gateway: Check[] = [
    !crossSite.ok
      ? { label: "Blocks other websites", level: "error", detail: `Gateway did not respond: ${crossSite.error}` }
      : crossSite.status === 403
        ? { label: "Blocks other websites", level: "ok", detail: "A request pretending to come from another site was refused (403)." }
        : { label: "Blocks other websites", level: "error", detail: `A cross-site request was NOT blocked (got ${crossSite.status}). Check middleware.ts.` },
    csp && home.headers.get("x-frame-options") === "DENY"
      ? { label: "Security headers", level: "ok", detail: "Content-Security-Policy and frame protection are sent." }
      : { label: "Security headers", level: "warn", detail: "Security headers are missing from pages. Check next.config.mjs." },
  ];

  const location = adminGuard.headers.get("location") ?? "";
  const admin: Check[] = [
    !adminGuard.ok
      ? { label: "Admin lock", level: "error", detail: `Admin pages did not respond: ${adminGuard.error}` }
      : adminGuard.status >= 300 && adminGuard.status < 400 && location.includes("/account/login")
        ? { label: "Admin lock", level: "ok", detail: "Signed-out visitors are sent to sign in." }
        : { label: "Admin lock", level: "error", detail: `Admin pages answered ${adminGuard.status} to a signed-out visitor. They must redirect to sign in.` },
  ];

  const authProbe: Check = !me.ok
    ? { label: "Health check", level: "error", detail: `Account API did not respond: ${me.error}` }
    : me.status === 200
      ? { label: "Health check", level: "ok", detail: `Answered in ${ms(me.ms)}.` }
      : { label: "Health check", level: "error", detail: `Account API returned ${me.status}. MongoDB may be unreachable.` };
  const imageProbe: Check = !image.ok
    ? { label: "Health check", level: "error", detail: `Photo API did not respond: ${image.error}` }
    : image.status === 404
      ? { label: "Health check", level: "ok", detail: `Answered in ${ms(image.ms)}.` }
      : { label: "Health check", level: "warn", detail: `Unexpected HTTP ${image.status} for a missing photo.` };

  const slowest = Math.max(home.ms, collection.ms, product.ms);
  return {
    pages: { level: worst(pages), metric: `3 pages checked · slowest ${ms(slowest)}`, checks: pages },
    gateway: { level: worst(gateway), metric: worst(gateway) === "ok" ? "Blocking attacks" : "Needs attention", checks: gateway },
    admin: { level: worst(admin), metric: worst(admin) === "ok" ? "Locked to admins" : "Not protected!", checks: admin },
    authProbe: { level: authProbe.level, metric: "", checks: [authProbe] },
    imageProbe: { level: imageProbe.level, metric: "", checks: [imageProbe] },
  };
}

async function handleGET(request: Request) {
  const admin = await getAdmin().catch(() => null);
  if (!admin) return jsonError(403, "Admins only.");

  const origin = process.env.INTERNAL_BASE_URL || new URL(request.url).origin;
  const nodes: Record<string, NodeState> = {};

  // Health checks (cached 8 s).
  if (!cache.dwProbe || Date.now() - cache.dwProbe.at > 8000) {
    cache.dwProbe = { at: Date.now(), data: await runProbes(origin) };
  }
  const probes = cache.dwProbe.data;
  nodes.pages = probes.pages;
  nodes.gateway = probes.gateway;
  nodes.admin = probes.admin;

  // Live API traffic.
  const auth = summarize("auth");
  const uploads = summarize("uploads");
  const images = summarize("images");
  const authChecks = [...probes.authProbe.checks, ...trafficChecks(auth)];
  nodes.auth = { level: worst(authChecks), metric: trafficMetric(auth), checks: authChecks, traffic: auth.perMin };
  const uploadChecks = trafficChecks(uploads);
  nodes.uploads = { traffic: uploads.perMin, level: uploads.total5m ? worst(uploadChecks) : "idle", metric: trafficMetric(uploads), checks: uploadChecks.length ? uploadChecks : [{ label: "Traffic", level: "idle", detail: "No uploads in the last 5 minutes." }] };
  const imageChecks = [...probes.imageProbe.checks, ...trafficChecks(images)];
  nodes.images = { level: worst(imageChecks), metric: trafficMetric(images), checks: imageChecks, traffic: images.perMin };
  nodes.browser = {
    level: "info",
    metric: "Kept in each browser",
    checks: [{ label: "Not on the server yet", level: "info", detail: "Products, cart, orders and settings are preview data saved in each visitor's browser. Moving them to MongoDB is the next big step." }],
  };

  // Visitors and edge.
  const perMin = auth.perMin + uploads.perMin + images.perMin;
  nodes.visitors = { traffic: perMin, level: perMin ? "ok" : "idle", metric: `${perMin} API requests/min`, checks: [{ label: "Live traffic", level: perMin ? "ok" : "idle", detail: `${auth.total5m + uploads.total5m + images.total5m} API requests in the last 5 minutes.` }] };
  const production = process.env.NODE_ENV === "production";
  // Next.js itself adds x-forwarded-for with the local address, so only a non-local value means a real proxy.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const viaProxy = forwarded && !["::1", "127.0.0.1", "::ffff:127.0.0.1"].includes(forwarded);
  const host = request.headers.get("cf-ray") ? "Cloudflare" : request.headers.get("x-vercel-id") ? "Vercel" : viaProxy ? "Proxy" : production ? "Direct" : "Local dev server";
  const trusted = process.env.TRUSTED_IP_HEADER?.trim();
  const edgeChecks: Check[] = [
    { label: "Host", level: "ok", detail: `Requests arrive via: ${host}.` },
    trusted
      ? { label: "Real visitor IP", level: "ok", detail: `IP limits trust the ${trusted} header.` }
      : { label: "Real visitor IP", level: production ? "warn" : "info", detail: production ? "TRUSTED_IP_HEADER is not set, so visitors can fake their IP and dodge per-IP limits." : "TRUSTED_IP_HEADER is not set. Fine locally; set it when you go live." },
  ];
  nodes.edge = { level: worst(edgeChecks), metric: host, checks: edgeChecks };

  // Services.
  const dbChecks: Check[] = [];
  let dbMetric = "Unreachable";
  let storageNode: NodeState = { level: "error", metric: "Unknown", checks: [{ label: "Photo storage", level: "error", detail: "Needs MongoDB." }] };
  let securityNode: NodeState = { level: "error", metric: "Unknown", checks: [{ label: "Rate limits", level: "error", detail: "Needs MongoDB." }] };
  try {
    const db = await getDb();
    const started = performance.now();
    await db.command({ ping: 1 });
    const ping = performance.now() - started;
    dbMetric = `Connected · ping ${ms(ping)}`;
    dbChecks.push({ label: "Connection", level: ping > 500 ? "warn" : "ok", detail: `Database “${db.databaseName}” answered a ping in ${ms(ping)}.` });

    const [users, admins, sessions, files, sizeAgg, limits, blocked] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ role: "admin" }),
      db.collection("sessions").countDocuments({ expiresAt: { $gt: new Date() } }),
      db.collection(`${IMAGE_BUCKET}.files`).countDocuments(),
      db.collection(`${IMAGE_BUCKET}.files`).aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$length" } } }]).toArray(),
      db.collection("rate_limits").countDocuments({ expiresAt: { $gt: new Date() } }),
      db.collection<{ _id: string }>("rate_limits").countDocuments({ _id: { $regex: "^ip-block:" }, expiresAt: { $gt: new Date() } }),
    ]);
    dbChecks.push({ label: "Accounts", level: admins ? "ok" : "warn", detail: `${users} accounts (${admins} admin${admins === 1 ? "" : "s"}), ${sessions} signed in right now.${admins ? "" : " No admin account: run npm run seed:admin."}` });
    const mb = (sizeAgg[0]?.total ?? 0) / 1024 / 1024;
    storageNode = { level: "ok", metric: `${files} photo${files === 1 ? "" : "s"} · ${mb.toFixed(1)} MB`, checks: [{ label: "Product photos", level: "ok", detail: `${files} photos stored in MongoDB (GridFS), ${mb.toFixed(2)} MB in total.` }] };
    securityNode = {
      level: "ok",
      metric: blocked ? `${blocked} IP${blocked === 1 ? "" : "s"} blocked now` : `${limits} active limits`,
      checks: [
        { label: "Rate limits", level: "ok", detail: `${limits} active limit counters.` },
        { label: "Blocked IPs", level: blocked ? "info" : "ok", detail: blocked ? `${blocked} IP address${blocked === 1 ? " is" : "es are"} blocked for trying too many emails.` : "No IPs blocked right now." },
      ],
    };
  } catch (error) {
    dbChecks.push({ label: "Connection", level: "error", detail: `Cannot reach MongoDB: ${error instanceof Error ? error.message.replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://…").slice(0, 160) : "unknown error"}` });
  }
  nodes.mongodb = { level: worst(dbChecks), metric: dbMetric, checks: dbChecks };
  nodes.storage = storageNode;
  nodes.security = securityNode;

  const secret = process.env.AUTH_SECRET ?? "";
  const configChecks: Check[] = [
    process.env.MONGODB_URI ? { label: "MONGODB_URI", level: "ok", detail: "Set." } : { label: "MONGODB_URI", level: "error", detail: "Missing: the store can't reach its database." },
    secret.length >= 32 ? { label: "AUTH_SECRET", level: "ok", detail: "Set and long enough." } : { label: "AUTH_SECRET", level: "error", detail: "Missing or shorter than 32 characters: rate limits can't work safely." },
    process.env.ADMIN_EMAIL ? { label: "ADMIN_EMAIL", level: "ok", detail: "Set (used by npm run seed:admin)." } : { label: "ADMIN_EMAIL", level: "warn", detail: "Not set: the admin seed script can't run." },
    { label: "Mode", level: production ? "ok" : "info", detail: production ? "Production build." : "Development server (slower, extra logging)." },
  ];
  nodes.config = { level: worst(configChecks), metric: production ? "Production" : "Development", checks: configChecks };

  return jsonOk({
    generatedAt: new Date().toISOString(),
    startedAt: new Date(serverStartedAt()).toISOString(),
    nodes,
    errors: recentErrors(),
  });
}

export const GET = handleGET;
