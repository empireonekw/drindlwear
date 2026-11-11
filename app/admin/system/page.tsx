"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  HardDrive,
  Image as ImageIcon,
  Info,
  KeyRound,
  LayoutGrid,
  Lock,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Siren,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge, Button, Card, Drawer, PageHeader, tableClass, tdClass, thClass, type Tone } from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Types from /api/admin/system

type Level = "ok" | "warn" | "error" | "idle" | "info";
type Check = { label: string; level: Level; detail: string };
type NodeState = { level: Level; metric: string; checks: Check[]; traffic?: number };
type ServerError = { at: string; group: string; status: number; message: string; path: string };
type Report = { generatedAt: string; startedAt: string; nodes: Record<string, NodeState>; errors: ServerError[] };

// ---------------------------------------------------------------------------
// The map: where each part sits and what it connects to.

const W = 1180;
const H = 600;
const NODE_W = 210;
const NODE_H = 60;
const columns = [
  { title: "Visitors", x: 30 },
  { title: "Network", x: 255 },
  { title: "Gateway", x: 480 },
  { title: "Pages & APIs", x: 715 },
  { title: "Services", x: 950 },
];

type MapNode = { id: string; title: string; icon: LucideIcon; col: number; y: number; group?: string; about: string };
const mapNodes: MapNode[] = [
  {
    id: "visitors",
    title: "Visitors",
    icon: Users,
    col: 0,
    y: 270,
    about: "Everyone using the shop. Traffic is counted from the API requests the server answers.",
  },
  { id: "edge", title: "Host & network", icon: Cloud, col: 1, y: 270, about: "How requests reach the server: your host, CDN or proxy." },
  {
    id: "gateway",
    title: "Security gateway",
    icon: ShieldCheck,
    col: 2,
    y: 270,
    about: "middleware.ts and next.config.mjs: blocks requests from other websites and sends security headers.",
  },
  { id: "pages", title: "Shop pages", icon: LayoutGrid, col: 3, y: 50, about: "The storefront: homepage, collections and product pages." },
  { id: "admin", title: "Admin pages", icon: Lock, col: 3, y: 160, about: "This dashboard. Only admin accounts may open it." },
  {
    id: "auth",
    title: "/api/auth",
    icon: KeyRound,
    col: 3,
    y: 270,
    group: "auth",
    about: "Sign-up, sign-in, sign-out and the current-user check.",
  },
  {
    id: "uploads",
    title: "/api/admin/uploads",
    icon: UploadCloud,
    col: 3,
    y: 380,
    group: "uploads",
    about: "Product photo uploads from the admin.",
  },
  {
    id: "images",
    title: "/api/images",
    icon: ImageIcon,
    col: 3,
    y: 490,
    group: "images",
    about: "Serves product photos stored in MongoDB.",
  },
  { id: "security", title: "Rate limits", icon: Siren, col: 4, y: 50, about: "Limits on sign-in and sign-up attempts, and blocked IPs." },
  { id: "mongodb", title: "MongoDB", icon: Database, col: 4, y: 160, about: "The database: accounts, sessions, limits and photos." },
  { id: "storage", title: "Photo storage", icon: HardDrive, col: 4, y: 270, about: "Product photos in MongoDB GridFS." },
  {
    id: "browser",
    title: "Browser storage",
    icon: Monitor,
    col: 4,
    y: 380,
    about: "Products, cart, orders and settings are still kept in each visitor's browser.",
  },
  { id: "config", title: "Environment", icon: Settings2, col: 4, y: 490, about: "Secrets and settings from .env.local." },
];
const byId = Object.fromEntries(mapNodes.map((node) => [node.id, node]));

/** Each line: from → to. `via` decides whose traffic and health the line shows. */
const links: { from: string; to: string; via: string }[] = [
  { from: "visitors", to: "edge", via: "visitors" },
  { from: "edge", to: "gateway", via: "visitors" },
  { from: "gateway", to: "pages", via: "pages" },
  { from: "gateway", to: "admin", via: "admin" },
  { from: "gateway", to: "auth", via: "auth" },
  { from: "gateway", to: "uploads", via: "uploads" },
  { from: "gateway", to: "images", via: "images" },
  { from: "pages", to: "browser", via: "browser" },
  { from: "admin", to: "mongodb", via: "mongodb" },
  { from: "auth", to: "security", via: "security" },
  { from: "auth", to: "mongodb", via: "auth" },
  { from: "uploads", to: "storage", via: "uploads" },
  { from: "images", to: "storage", via: "images" },
];

// Colours: brand burgundy for live flow, status colours for health.
const levelColor: Record<Level, string> = { ok: "#1f8a55", warn: "#c58a1a", error: "#d4372c", idle: "#b9aead", info: "#8a7c7c" };
const levelTone: Record<Level, Tone> = { ok: "green", warn: "amber", error: "burgundy", idle: "grey", info: "neutral" };
const levelLabel: Record<Level, string> = { ok: "Working", warn: "Needs attention", error: "Error", idle: "Idle", info: "Info" };
const FLOW = "#781d2d";

function pathBetween(from: MapNode, to: MapNode) {
  const x1 = columns[from.col].x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = columns[to.col].x;
  const y2 = to.y + NODE_H / 2;
  const mid = x1 + (x2 - x1) / 2;
  if (Math.abs(y2 - y1) < 1) return `M ${x1} ${y1} H ${x2}`;
  const r = Math.min(12, Math.abs(y2 - y1) / 2);
  const down = y2 > y1 ? 1 : -1;
  return `M ${x1} ${y1} H ${mid - r} Q ${mid} ${y1} ${mid} ${y1 + r * down} V ${y2 - r * down} Q ${mid} ${y2} ${mid + r} ${y2} H ${x2}`;
}

const ago = (iso: string, now: number) => {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s ago` : seconds < 3600 ? `${Math.round(seconds / 60)} min ago` : `${Math.round(seconds / 3600)} h ago`;
};

// ---------------------------------------------------------------------------

export default function SystemPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [failure, setFailure] = useState("");
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  // The map is drawn at 1180×600 and scaled down to fit narrower screens (not below 60%; then it scrolls).
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.max(0.6, Math.min(1, (entry.contentRect.width - 16) / W))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/system", { cache: "no-store" });
      if (response.status === 403) throw new Error("Your admin session has ended. Sign in again to keep monitoring.");
      if (!response.ok) throw new Error(`The health check itself failed (HTTP ${response.status}).`);
      setReport(await response.json());
      setFailure("");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [live, load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nodes = report?.nodes ?? {};
  const stateOf = (id: string): NodeState => nodes[id] ?? { level: "idle", metric: report ? "–" : "Checking…", checks: [] };
  const issues = useMemo(
    () =>
      mapNodes
        .flatMap((node) =>
          (nodes[node.id]?.checks ?? [])
            .filter((check) => check.level === "error" || check.level === "warn")
            .map((check) => ({ node, check })),
        )
        .sort((a, b) => (a.check.level === "error" ? -1 : 1) - (b.check.level === "error" ? -1 : 1)),
    [nodes],
  );
  const errorCount = issues.filter((issue) => issue.check.level === "error").length;
  const overall: Level = failure ? "error" : !report ? "idle" : errorCount ? "error" : issues.length ? "warn" : "ok";
  const open = selected ? byId[selected] : null;
  const openState = selected ? stateOf(selected) : null;
  const openErrors = open?.group ? (report?.errors ?? []).filter((error) => error.group === open.group) : [];

  return (
    <>
      <PageHeader
        title="System"
        description="A live map of how a request travels through the store. Red marks where something is failing."
        actions={
          <>
            <span className="inline-flex items-center gap-2 text-[13px] text-taupe">
              <span className={"h-2 w-2 rounded-full " + (live ? "animate-pulse bg-[#1f8a55]" : "bg-[#b9aead]")} aria-hidden="true" />
              {report ? `Updated ${ago(report.generatedAt, now)}` : "Checking…"}
            </span>
            <Button size="sm" onClick={() => setLive((value) => !value)} aria-pressed={!live}>
              {live ? <Pause size={15} /> : <Play size={15} />} {live ? "Pause" : "Resume"}
            </Button>
            <Button size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Check now
            </Button>
          </>
        }
      />

      {/* Status summary */}
      <div
        className={
          "mb-5 flex flex-wrap items-start gap-4 rounded-2xl border p-5 " +
          (overall === "ok"
            ? "border-[#cfe8d9] bg-[#f1f9f4]"
            : overall === "error"
              ? "border-[#f0c8c4] bg-[#fdf2f1]"
              : overall === "warn"
                ? "border-[#f1dfb6] bg-[#fdf8ec]"
                : "border-[#eadfdc] bg-white")
        }
        role="status"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white" style={{ color: levelColor[overall] }}>
          {overall === "ok" ? (
            <CheckCircle2 size={22} />
          ) : overall === "error" ? (
            <AlertOctagon size={22} />
          ) : overall === "warn" ? (
            <AlertTriangle size={22} />
          ) : (
            <RefreshCw size={20} className="animate-spin" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[16px] font-semibold text-charcoal">
            {failure
              ? "Health check failed"
              : !report
                ? "Running health checks…"
                : overall === "ok"
                  ? "All systems working"
                  : `${errorCount ? `${errorCount} error${errorCount === 1 ? "" : "s"}` : ""}${errorCount && issues.length - errorCount ? " and " : ""}${issues.length - errorCount ? `${issues.length - errorCount} warning${issues.length - errorCount === 1 ? "" : "s"}` : ""} found`}
          </p>
          {failure && <p className="m-0 mt-1 text-[14px] text-[#9b1c2e]">{failure}</p>}
          {issues.length > 0 && (
            <ul className="m-0 mt-2 grid list-none gap-1.5 p-0">
              {issues.map(({ node, check }) => (
                <li key={`${node.id}-${check.label}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(node.id)}
                    className="text-left text-[14px] text-charcoal hover:text-burgundy"
                  >
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ background: levelColor[check.level] }}
                      aria-hidden="true"
                    />
                    <strong className="font-medium">{node.title}</strong> · {check.label}:{" "}
                    <span className="text-taupe">{check.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {report && overall === "ok" && (
            <p className="m-0 mt-1 text-[14px] text-taupe">
              Every check passed. Server running since {new Date(report.startedAt).toLocaleString("en-GB")}.
            </p>
          )}
        </div>
      </div>

      {/* Flow map */}
      <Card title="Request flow" description="Dots move where requests are flowing right now. Click any box for details." padded={false}>
        <div ref={frame} className="overflow-x-auto py-2">
          <div className="mx-auto" style={{ width: W * scale, height: H * scale }}>
            <div
              className="relative origin-top-left"
              style={{
                width: W,
                height: H,
                transform: `scale(${scale})`,
                backgroundImage: "radial-gradient(rgb(120 29 45 / 10%) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Column titles */}
              {columns.map((column) => (
                <p
                  key={column.title}
                  className="absolute top-3 m-0 text-[11px] font-semibold uppercase tracking-[1.6px] text-taupe"
                  style={{ left: column.x, width: NODE_W, textAlign: "center" }}
                >
                  {column.title}
                </p>
              ))}

              <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
                {links.map((link) => {
                  const from = byId[link.from];
                  const to = byId[link.to];
                  const state = stateOf(link.via);
                  const target = stateOf(link.to);
                  const level: Level =
                    target.level === "error" || state.level === "error"
                      ? "error"
                      : target.level === "warn" || state.level === "warn"
                        ? "warn"
                        : state.level;
                  const idle = level === "idle" || level === "info";
                  const color = level === "error" || level === "warn" ? levelColor[level] : idle ? "#cfc3bf" : FLOW;
                  const traffic = state.traffic ?? (level === "ok" ? 1 : 0);
                  const dots = level === "error" ? 2 : idle ? 0 : Math.min(4, 1 + Math.floor(traffic / 10));
                  const duration = Math.max(1.2, 3.2 - Math.min(traffic, 40) / 20);
                  const id = `flow-${link.from}-${link.to}`;
                  const d = pathBetween(from, to);
                  return (
                    <g key={id}>
                      <path
                        id={id}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeOpacity={idle ? 1 : 0.35}
                        strokeWidth={idle ? 1.5 : 2}
                        strokeDasharray={idle ? "5 5" : level === "error" ? "6 4" : undefined}
                      />
                      {Array.from({ length: dots }, (_, index) => (
                        <circle key={index} r={4} fill={color} stroke="#fff" strokeWidth={1.5} className="motion-reduce:hidden">
                          <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${(index * duration) / dots}s`}>
                            <mpath href={`#${id}`} />
                          </animateMotion>
                        </circle>
                      ))}
                      {/* Connection points */}
                      <circle cx={columns[from.col].x + NODE_W} cy={from.y + NODE_H / 2} r={3.5} fill={color} />
                      <circle cx={columns[to.col].x} cy={to.y + NODE_H / 2} r={3.5} fill={color} />
                    </g>
                  );
                })}
              </svg>

              {/* Boxes */}
              {mapNodes.map((node) => {
                const state = stateOf(node.id);
                const Icon = node.icon;
                const bad = state.level === "error";
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelected(node.id)}
                    className={
                      "absolute flex items-center gap-3 rounded-xl border bg-white px-3 text-left shadow-[0_2px_8px_rgb(33_28_29_/_5%)] transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(33_28_29_/_10%)] " +
                      (bad ? "border-[#e8a39d] ring-4 ring-[#d4372c]/10" : state.level === "warn" ? "border-[#ecd29a]" : "border-[#eadfdc]")
                    }
                    style={{ left: columns[node.col].x, top: node.y, width: NODE_W, height: NODE_H }}
                    aria-label={`${node.title}: ${levelLabel[state.level]}. ${state.metric}`}
                  >
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                      style={{
                        background: bad
                          ? "#fdecea"
                          : state.level === "warn"
                            ? "#fbf0dc"
                            : state.level === "idle" || state.level === "info"
                              ? "#f1ecea"
                              : "#f6eeec",
                        color: bad
                          ? "#d4372c"
                          : state.level === "warn"
                            ? "#8a5a0b"
                            : state.level === "idle" || state.level === "info"
                              ? "#8a7c7c"
                              : FLOW,
                      }}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-charcoal">{node.title}</span>
                      <span className="block truncate text-[11.5px] text-taupe">{state.metric || levelLabel[state.level]}</span>
                    </span>
                    <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
                      {(bad || state.level === "warn") && (
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
                          style={{ background: levelColor[state.level] }}
                        />
                      )}
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: levelColor[state.level] }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[#f1e8e5] px-5 py-3.5 text-[12px] text-taupe">
          {(["ok", "warn", "error", "idle"] as Level[]).map((level) => (
            <span key={level} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: levelColor[level] }} aria-hidden="true" />
              {levelLabel[level]}
            </span>
          ))}
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: FLOW, boxShadow: `0 0 0 1px ${FLOW}` }}
              aria-hidden="true"
            />
            Moving dots = live requests
          </span>
        </div>
      </Card>

      {/* Recent server errors */}
      <Card
        title="Recent server errors"
        description="The last failures on this server, newest first. Kept in memory for 15 minutes."
        className="mt-5"
        padded={false}
      >
        {report?.errors.length ? (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Where</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>What went wrong</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((error, index) => (
                  <tr key={`${error.at}-${index}`}>
                    <td className={tdClass + " whitespace-nowrap text-taupe"}>{ago(error.at, now)}</td>
                    <td className={tdClass}>
                      <code className="text-[12px]">{error.path}</code>
                    </td>
                    <td className={tdClass}>
                      <Badge tone="burgundy">{error.status}</Badge>
                    </td>
                    <td className={tdClass + " text-[13px]"}>{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="m-0 flex items-center gap-2 px-5 py-6 text-[14px] text-taupe">
            <CheckCircle2 size={17} className="text-[#1f8a55]" aria-hidden="true" /> No server errors recorded.
          </p>
        )}
      </Card>

      {/* Details */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setSelected(null)}
        title={open?.title ?? ""}
        subtitle={openState && <Badge tone={levelTone[openState.level]}>{levelLabel[openState.level]}</Badge>}
      >
        {open && openState && (
          <div className="grid gap-5">
            <p className="m-0 text-[14px] text-taupe">{open.about}</p>
            {openState.metric && (
              <div className="rounded-2xl border border-[#eadfdc] bg-white px-4 py-3 text-[15px] font-semibold text-charcoal">
                {openState.metric}
              </div>
            )}
            <Card title="Checks" padded={false}>
              {openState.checks.length ? (
                <ul className="m-0 list-none p-0">
                  {openState.checks.map((check) => (
                    <li key={check.label} className="flex gap-3 border-b border-[#f3ebe8] px-5 py-3.5 last:border-b-0">
                      <span className="mt-0.5 flex-none" style={{ color: levelColor[check.level] }}>
                        {check.level === "ok" ? (
                          <CheckCircle2 size={17} />
                        ) : check.level === "error" ? (
                          <AlertOctagon size={17} />
                        ) : check.level === "warn" ? (
                          <AlertTriangle size={17} />
                        ) : (
                          <Info size={17} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium text-charcoal">{check.label}</span>
                        <span className="block text-[13px] text-taupe">{check.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 px-5 py-4 text-[14px] text-taupe">No checks yet.</p>
              )}
            </Card>
            {open.group && (
              <Card title="Recent errors here" padded={false}>
                {openErrors.length ? (
                  <ul className="m-0 list-none p-0">
                    {openErrors.map((error, index) => (
                      <li key={`${error.at}-${index}`} className="border-b border-[#f3ebe8] px-5 py-3 text-[13px] last:border-b-0">
                        <span className="flex items-center justify-between gap-3">
                          <code className="text-[12px]">{error.path}</code>
                          <span className="text-taupe">{ago(error.at, now)}</span>
                        </span>
                        <span className="mt-1 block text-[#9b1c2e]">
                          {error.status}: {error.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 px-5 py-4 text-[14px] text-taupe">None in the last 15 minutes.</p>
                )}
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
