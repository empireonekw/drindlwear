import "server-only";

import { AsyncLocalStorage } from "async_hooks";
import { monitorEventLoopDelay, type IntervalHistogram } from "perf_hooks";

import { fingerprint } from "./security";

/**
 * Live request metrics for the admin System page. Kept in this server's
 * memory (last 15 minutes), so they reset when the server restarts and each
 * server instance counts its own traffic.
 */

export type RouteGroup = "auth" | "uploads" | "images" | "products";

type Sample = { at: number; ms: number; status: number };
export type ServerError = { at: string; group: RouteGroup; status: number; message: string; path: string };

const KEEP_MS = 15 * 60 * 1000;
const store = globalThis as unknown as {
  dwMetrics?: { samples: Record<RouteGroup, Sample[]>; errors: ServerError[]; startedAt: number };
};
store.dwMetrics ??= { samples: { auth: [], uploads: [], images: [], products: [] }, errors: [], startedAt: Date.now() };
const metrics = store.dwMetrics;
// A dev server that was running before a group was added keeps its old object.
metrics.samples.products ??= [];

export const serverStartedAt = () => metrics.startedAt;

/** Error text safe to show in the admin: one line, no long stack, capped. */
const clean = (message: string) => message.split("\n")[0].replace(/mongodb(\+srv)?:\/\/\S+/gi, "mongodb://…").slice(0, 200);

export function recordError(group: RouteGroup, status: number, message: string, path: string) {
  metrics.errors.unshift({ at: new Date().toISOString(), group, status, message: clean(message), path });
  metrics.errors.length = Math.min(metrics.errors.length, 30);
}

function record(group: RouteGroup, ms: number, status: number) {
  const list = metrics.samples[group];
  const now = Date.now();
  list.push({ at: now, ms, status });
  while (list.length && list[0].at < now - KEEP_MS) list.shift();
}

/** Secret header value that marks the System page's own health-check requests. */
export const probeHeader = () => ({ "x-dw-probe": fingerprint("system-probe") });
const isProbe = (request: Request) => {
  const value = request.headers.get("x-dw-probe");
  try {
    return value !== null && value === fingerprint("system-probe");
  } catch {
    return false;
  }
};

/** The real cause behind a 500, noted by a route's catch block for the current request. */
const causeStore = new AsyncLocalStorage<{ cause?: string }>();
export function noteError(error: unknown) {
  const ctx = causeStore.getStore();
  if (ctx) ctx.cause = error instanceof Error ? error.message : String(error);
}

/**
 * Wraps a route handler so each request is timed and its status counted.
 * Server errors (500+) and crashes are kept in the recent errors list, with
 * the real cause when the route noted one.
 */
export function withMetrics<Args extends unknown[]>(group: RouteGroup, handler: (request: Request, ...rest: Args) => Promise<Response>) {
  return async (request: Request, ...rest: Args): Promise<Response> => {
    // Health checks from the System page are not counted as traffic.
    if (isProbe(request)) return handler(request, ...rest);
    const started = performance.now();
    const path = new URL(request.url).pathname;
    const ctx: { cause?: string } = {};
    try {
      const response = await causeStore.run(ctx, () => handler(request, ...rest));
      record(group, performance.now() - started, response.status);
      if (response.status >= 500) {
        const body = await response.clone().json().catch(() => null);
        const shown = (body as { error?: string } | null)?.error ?? `HTTP ${response.status}`;
        recordError(group, response.status, ctx.cause ?? shown, path);
      }
      return response;
    } catch (error) {
      record(group, performance.now() - started, 500);
      recordError(group, 500, error instanceof Error ? error.message : String(error), path);
      throw error;
    }
  };
}

export type GroupSummary = {
  perMin: number;
  total5m: number;
  errors5m: number;
  clientErrors5m: number;
  /** Requests refused with 429 (rate limited) in the last 5 minutes. */
  rateLimited5m: number;
  p95: number | null;
  lastRequestAt: string | null;
};

export function summarize(group: RouteGroup): GroupSummary {
  const now = Date.now();
  const list = metrics.samples[group];
  const lastMinute = list.filter((sample) => sample.at > now - 60_000);
  const last5 = list.filter((sample) => sample.at > now - 5 * 60_000);
  const sorted = last5.map((sample) => sample.ms).sort((a, b) => a - b);
  return {
    perMin: lastMinute.length,
    total5m: last5.length,
    errors5m: last5.filter((sample) => sample.status >= 500).length,
    clientErrors5m: last5.filter((sample) => sample.status >= 400 && sample.status < 500).length,
    rateLimited5m: last5.filter((sample) => sample.status === 429).length,
    p95: sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]) : null,
    lastRequestAt: list.length ? new Date(list[list.length - 1].at).toISOString() : null,
  };
}

export const recentErrors = () => metrics.errors.slice(0, 20);

// ---------------------------------------------------------------------------
// This server process: memory, uptime and how busy its event loop is.

const loopStore = globalThis as unknown as { dwLoop?: IntervalHistogram };
if (!loopStore.dwLoop) {
  loopStore.dwLoop = monitorEventLoopDelay({ resolution: 20 });
  loopStore.dwLoop.enable();
}

export type ProcessStats = { memoryMb: number; uptimeSec: number; loopMs: number };

/** Memory in use (RSS), seconds since start, and average event-loop delay. */
export function processStats(): ProcessStats {
  const loop = loopStore.dwLoop!;
  const loopMs = Number.isFinite(loop.mean) ? loop.mean / 1e6 : 0;
  loop.reset();
  return {
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    uptimeSec: Math.round(process.uptime()),
    loopMs: Math.round(loopMs),
  };
}
