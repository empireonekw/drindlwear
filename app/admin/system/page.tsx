"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  Info,
  KeyRound,
  LayoutGrid,
  Lock,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Scan,
  Settings2,
  ShieldCheck,
  Siren,
  UploadCloud,
  Users,
  XCircle,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { Badge, Button, Card, Drawer, PageHeader, type Tone } from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Types from /api/admin/system

type Level = "ok" | "warn" | "error" | "idle" | "info";
type Check = { label: string; level: Level; detail: string };
type NodeState = { level: Level; metric: string; checks: Check[]; traffic?: number };
type ServerError = { at: string; group: string; status: number; message: string; path: string };
type Stats = {
  requestsPerMin: number;
  errors5m: number;
  rateLimited5m: number;
  slowestP95: number | null;
  memoryMb: number;
  uptimeSec: number;
  loopMs: number;
};
type Report = {
  generatedAt: string;
  startedAt: string;
  stats?: Stats;
  nodes: Record<string, NodeState>;
  errors: ServerError[];
};

// ---------------------------------------------------------------------------
// The map: where each part sits and what it connects to. Drawn at W×H and
// zoomed/panned inside its frame.

const NODE_W = 168;
const NODE_H = 44;
const COL_GAP = 218;
const columns = ["Visitors", "Network", "Gateway", "Pages & APIs", "Services"].map((title, index) => ({
  title,
  x: 24 + index * COL_GAP,
}));
const W = columns[columns.length - 1].x + NODE_W + 24;
const H = 410;
/** Rows: five per column, 70 px apart; single boxes sit on the middle row. */
const row = (index: number) => 52 + index * 70;

type MapNode = { id: string; title: string; icon: LucideIcon; col: number; y: number; group?: string; about: string };
const mapNodes: MapNode[] = [
  {
    id: "visitors",
    title: "Visitors",
    icon: Users,
    col: 0,
    y: row(2),
    about: "Everyone using the shop. Traffic is counted from the API requests the server answers.",
  },
  { id: "edge", title: "Host & network", icon: Cloud, col: 1, y: row(2), about: "How requests reach the server: your host, CDN or proxy." },
  {
    id: "gateway",
    title: "Security gateway",
    icon: ShieldCheck,
    col: 2,
    y: row(2),
    about: "middleware.ts and next.config.mjs: blocks requests from other websites and sends security headers.",
  },
  { id: "pages", title: "Shop pages", icon: LayoutGrid, col: 3, y: row(0), about: "The storefront: homepage, collections and product pages." },
  { id: "admin", title: "Admin pages", icon: Lock, col: 3, y: row(1), about: "This dashboard. Only admin accounts may open it." },
  { id: "auth", title: "/api/auth", icon: KeyRound, col: 3, y: row(2), group: "auth", about: "Sign-up, sign-in, sign-out and the current-user check." },
  { id: "uploads", title: "/api/admin/uploads", icon: UploadCloud, col: 3, y: row(3), group: "uploads", about: "Product photo uploads from the admin." },
  { id: "images", title: "/api/images", icon: ImageIcon, col: 3, y: row(4), group: "images", about: "Serves product photos stored in MongoDB." },
  { id: "security", title: "Rate limits", icon: Siren, col: 4, y: row(0), about: "Limits on sign-in and sign-up attempts, and blocked IPs." },
  { id: "mongodb", title: "MongoDB", icon: Database, col: 4, y: row(1), about: "The database: accounts, sessions, limits and photos." },
  { id: "storage", title: "Photo storage", icon: HardDrive, col: 4, y: row(2), about: "Product photos in MongoDB GridFS." },
  {
    id: "browser",
    title: "Browser storage",
    icon: Monitor,
    col: 4,
    y: row(3),
    about: "Cart, orders and settings are still kept in each visitor's browser. Products are stored in MongoDB.",
  },
  { id: "config", title: "Environment", icon: Settings2, col: 4, y: row(4), about: "Secrets and settings from .env.local." },
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
const legend: { level: Level; label: string }[] = [
  { level: "ok", label: "Healthy" },
  { level: "warn", label: "Warning (too fast / slow)" },
  { level: "error", label: "Error (failing)" },
  { level: "idle", label: "Idle (no traffic)" },
];
const FLOW = "#781d2d";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
const COLLAPSED_KEY = "dw-admin-system-map-collapsed";

function pathBetween(from: MapNode, to: MapNode) {
  const x1 = columns[from.col].x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = columns[to.col].x;
  const y2 = to.y + NODE_H / 2;
  const mid = x1 + (x2 - x1) / 2;
  if (Math.abs(y2 - y1) < 1) return `M ${x1} ${y1} H ${x2}`;
  const r = Math.min(10, Math.abs(y2 - y1) / 2);
  const down = y2 > y1 ? 1 : -1;
  return `M ${x1} ${y1} H ${mid - r} Q ${mid} ${y1} ${mid} ${y1 + r * down} V ${y2 - r * down} Q ${mid} ${y2} ${mid + r} ${y2} H ${x2}`;
}

const ago = (iso: string, now: number) => {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s ago` : seconds < 3600 ? `${Math.round(seconds / 60)} min ago` : `${Math.round(seconds / 3600)} h ago`;
};

const uptime = (seconds: number) => {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
};

// ---------------------------------------------------------------------------
// Small pieces

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  /** Colour for the icon. */
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eadfdc] bg-white px-5 py-4 shadow-[0_1px_3px_rgb(33_28_29_/_4%)]">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 truncate text-[13px] text-taupe">{label}</p>
        <Icon size={17} strokeWidth={1.8} className="flex-none" style={{ color: color ?? "#786565" }} aria-hidden="true" />
      </div>
      <p className="m-0 mt-2 truncate text-[26px] font-semibold leading-tight text-charcoal [font-variant-numeric:tabular-nums]">{value}</p>
      {hint && <p className="m-0 mt-1 truncate text-[12px] text-taupe">{hint}</p>}
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal transition-colors hover:bg-[#f6eeec] hover:text-burgundy"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------

export default function SystemPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [failure, setFailure] = useState("");
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Map view: collapsed (minimized), full screen (maximized), zoom and pan.
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const frame = useRef<HTMLDivElement>(null);
  /** While true the map re-fits when its frame changes size; any zoom or drag turns it off. */
  const autoFit = useRef(true);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Storage blocked: start expanded.
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        // Not remembered; fine.
      }
      return !value;
    });
    setMaximized(false);
  };

  const fit = useCallback(() => {
    const element = frame.current;
    if (!element) return;
    const { width, height } = element.getBoundingClientRect();
    if (!width || !height) return;
    const zoom = clampZoom(Math.min((width - 32) / W, (height - 32) / H));
    setView({ zoom, x: (width - W * zoom) / 2, y: (height - H * zoom) / 2 });
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    autoFit.current = true;
    fit();
    const observer = new ResizeObserver(() => {
      if (autoFit.current) fit();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit, collapsed, maximized]);

  /** Zooms by `factor` around a point in the frame (its centre by default). */
  const zoomBy = useCallback((factor: number, point?: { x: number; y: number }) => {
    const element = frame.current;
    if (!element) return;
    autoFit.current = false;
    const rect = element.getBoundingClientRect();
    const px = point?.x ?? rect.width / 2;
    const py = point?.y ?? rect.height / 2;
    setView((current) => {
      const zoom = clampZoom(current.zoom * factor);
      const ratio = zoom / current.zoom;
      return { zoom, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio };
    });
  }, []);

  // Ctrl/⌘ + scroll zooms the map. Needs a non-passive listener to stop the page zooming.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * 0.0015), { x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoomBy, collapsed, maximized]);

  // Escape leaves full screen (unless the details drawer is open; it closes first).
  useEffect(() => {
    if (!maximized) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !selected) setMaximized(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [maximized, selected]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    drag.current = { startX: event.clientX, startY: event.clientY, x: view.x, y: view.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    autoFit.current = false;
    setView((current) => ({ ...current, x: start.x + event.clientX - start.startX, y: start.y + event.clientY - start.startY }));
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  // Data
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/system", { cache: "no-store" });
      if (response.status === 403) throw new Error("Your admin session has ended. Sign in again to keep monitoring.");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `The health check itself failed (HTTP ${response.status}).`);
      }
      const data = (await response.json().catch(() => null)) as Report | null;
      if (!data?.nodes) throw new Error("The health check sent back an unreadable answer. The dev server may still be compiling.");
      setReport(data);
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
  const warnCount = issues.length - errorCount;
  const overall: Level = failure ? "error" : !report ? "idle" : errorCount ? "error" : issues.length ? "warn" : "ok";
  const open = selected ? byId[selected] : null;
  const openState = selected ? stateOf(selected) : null;
  const openErrors = open?.group ? (report?.errors ?? []).filter((error) => error.group === open.group) : [];
  const stats = report?.stats;

  /** Boxes and lines touching the hovered box stay bright; the rest fade. */
  const connected = useMemo(() => {
    if (!hovered) return null;
    const ids = new Set([hovered]);
    links.forEach((link) => {
      if (link.from === hovered) ids.add(link.to);
      if (link.to === hovered) ids.add(link.from);
    });
    return ids;
  }, [hovered]);

  const overallText = failure
    ? "Check failed"
    : !report
      ? "Checking…"
      : overall === "ok"
        ? "Healthy"
        : errorCount
          ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
          : `${warnCount} warning${warnCount === 1 ? "" : "s"}`;

  return (
    <>
      <PageHeader
        title="System Health"
        description="A live map of the site. Every page area, API and service. Green is healthy, amber means calls are coming in too fast or slowly, red means something is failing. Updates every 5 seconds."
        actions={
          <>
            <Button size="sm" onClick={() => setLive((value) => !value)} aria-pressed={!live}>
              {live ? <Pause size={15} /> : <Play size={15} />} {live ? "Pause" : "Resume"}
            </Button>
            <Button size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Check now
            </Button>
          </>
        }
      />

      {/* Live status and legend */}
      <div className="-mt-3 mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="m-0 inline-flex items-center gap-2 text-[14px] text-charcoal" role="status">
          <span className={"h-2 w-2 rounded-full " + (live ? "animate-pulse bg-[#1f8a55]" : "bg-[#b9aead]")} aria-hidden="true" />
          {live ? "Live" : "Paused"} · {report ? `updated ${ago(report.generatedAt, now)}` : "checking…"}
        </p>
        <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-[12.5px] text-taupe">
          {legend.map((item) => (
            <li key={item.level} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: levelColor[item.level] }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
          <li className="inline-flex items-center gap-2">
            <svg width="26" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="26" y2="4" stroke={FLOW} strokeOpacity="0.35" strokeWidth="2" />
              <circle cx="15" cy="4" r="3" fill={FLOW} />
            </svg>
            Moving dots = live requests
          </li>
        </ul>
      </div>

      {/* Headline numbers */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat
          label="Overall"
          value={<span style={{ color: overall === "ok" || overall === "idle" ? undefined : levelColor[overall] }}>{overallText}</span>}
          icon={Activity}
          color={levelColor[overall === "idle" ? "info" : overall]}
        />
        <Stat label="Requests / min" value={stats?.requestsPerMin ?? "–"} icon={Gauge} />
        <Stat
          label="Server errors (5 min)"
          value={stats?.errors5m ?? "–"}
          icon={XCircle}
          color={stats?.errors5m ? levelColor.error : levelColor.ok}
        />
        <Stat
          label="Rate-limited (5 min)"
          value={stats?.rateLimited5m ?? "–"}
          icon={ShieldCheck}
          color={stats?.rateLimited5m ? levelColor.warn : levelColor.ok}
        />
        <Stat
          label="Slowest p95"
          value={stats?.slowestP95 != null ? `${stats.slowestP95} ms` : "–"}
          icon={Clock}
          color={stats?.slowestP95 != null && stats.slowestP95 > 2000 ? levelColor.warn : undefined}
        />
        <Stat
          label="Server"
          value={stats ? `${stats.memoryMb} MB` : "–"}
          hint={stats ? `up ${uptime(stats.uptimeSec)} · loop ${stats.loopMs} ms` : undefined}
          icon={Cpu}
        />
      </div>

      {/* Flow map: minimizable and maximizable */}
      <section
        className={
          maximized
            ? "fixed inset-0 z-[60] flex flex-col bg-[#fbf5f2] p-3 sm:p-5"
            : "min-w-0 rounded-2xl border border-[#eadfdc] bg-white"
        }
        aria-label="Request flow map"
      >
        <header
          className={
            "flex flex-wrap items-center justify-between gap-3 " +
            (maximized ? "pb-3" : collapsed ? "px-5 py-4" : "border-b border-[#f1e8e5] px-5 py-4")
          }
        >
          <div className="min-w-0">
            <h2 className="m-0 text-[15px] font-semibold text-charcoal">Request flow</h2>
            <p className="m-0 mt-0.5 text-[13px] text-taupe">
              {collapsed
                ? `${mapNodes.length} parts · ${
                    errorCount || warnCount
                      ? [errorCount && `${errorCount} error${errorCount === 1 ? "" : "s"}`, warnCount && `${warnCount} warning${warnCount === 1 ? "" : "s"}`]
                          .filter(Boolean)
                          .join(", ")
                      : "all healthy"
                  }`
                : "How a request travels through the store. Dots move where requests are flowing right now."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!maximized && (
              <Button size="sm" onClick={toggleCollapsed} aria-expanded={!collapsed}>
                <ChevronDown size={15} className={"transition-transform " + (collapsed ? "" : "rotate-180")} />
                {collapsed ? "Expand" : "Minimize"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setCollapsed(false);
                setMaximized((value) => !value);
              }}
            >
              {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {maximized ? "Exit full screen" : "Maximize"}
            </Button>
          </div>
        </header>

        {!collapsed && (
          <div
            ref={frame}
            className={
              "relative touch-none select-none overflow-hidden " +
              (maximized ? "min-h-0 flex-1 rounded-2xl border border-[#eadfdc] bg-white" : "h-[440px] rounded-b-2xl max-sm:h-[340px]") +
              (dragging ? " cursor-grabbing" : " cursor-grab")
            }
            style={{
              backgroundImage: "radial-gradient(rgb(120 29 45 / 12%) 1px, transparent 1px)",
              backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
              backgroundPosition: `${view.x}px ${view.y}px`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
            >
              {/* Column titles */}
              {columns.map((column) => (
                <p
                  key={column.title}
                  className="absolute top-2 m-0 text-[10.5px] font-semibold uppercase tracking-[1.4px] text-taupe"
                  style={{ left: column.x, width: NODE_W, textAlign: "center" }}
                >
                  {column.title}
                </p>
              ))}

              <svg width={W} height={H} className="absolute inset-0 overflow-visible" aria-hidden="true">
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
                  const lit = connected ? connected.has(link.from) && connected.has(link.to) : null;
                  return (
                    <g key={id} style={{ opacity: lit === false ? 0.15 : 1, transition: "opacity 150ms" }}>
                      <path
                        id={id}
                        d={pathBetween(from, to)}
                        fill="none"
                        stroke={color}
                        strokeOpacity={idle ? 1 : lit ? 0.8 : 0.35}
                        strokeWidth={lit ? 2.5 : idle ? 1.5 : 2}
                        strokeDasharray={idle ? "5 5" : level === "error" ? "6 4" : undefined}
                      />
                      {Array.from({ length: dots }, (_, index) => (
                        <circle key={index} r={3.5} fill={color} stroke="#fff" strokeWidth={1.25} className="motion-reduce:hidden">
                          <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${(index * duration) / dots}s`}>
                            <mpath href={`#${id}`} />
                          </animateMotion>
                        </circle>
                      ))}
                      <circle cx={columns[from.col].x + NODE_W} cy={from.y + NODE_H / 2} r={3} fill={color} />
                      <circle cx={columns[to.col].x} cy={to.y + NODE_H / 2} r={3} fill={color} />
                    </g>
                  );
                })}
              </svg>

              {/* Boxes */}
              {mapNodes.map((node) => {
                const state = stateOf(node.id);
                const Icon = node.icon;
                const bad = state.level === "error";
                const quiet = state.level === "idle" || state.level === "info";
                const faded = connected ? !connected.has(node.id) : false;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelected(node.id)}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(node.id)}
                    onBlur={() => setHovered(null)}
                    className={
                      "absolute flex items-center gap-2 rounded-lg border bg-white px-2 text-left shadow-[0_1px_4px_rgb(33_28_29_/_6%)] transition-[box-shadow,opacity,border-color] hover:shadow-[0_6px_16px_rgb(33_28_29_/_12%)] " +
                      (bad
                        ? "border-[#e8a39d] ring-[3px] ring-[#d4372c]/10"
                        : state.level === "warn"
                          ? "border-[#ecd29a]"
                          : hovered === node.id
                            ? "border-burgundy/40"
                            : "border-[#eadfdc]")
                    }
                    style={{ left: columns[node.col].x, top: node.y, width: NODE_W, height: NODE_H, opacity: faded ? 0.4 : 1 }}
                    aria-label={`${node.title}: ${levelLabel[state.level]}. ${state.metric}`}
                  >
                    <span
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-md"
                      style={{
                        background: bad ? "#fdecea" : state.level === "warn" ? "#fbf0dc" : quiet ? "#f1ecea" : "#f6eeec",
                        color: bad ? "#d4372c" : state.level === "warn" ? "#8a5a0b" : quiet ? "#8a7c7c" : FLOW,
                      }}
                    >
                      <Icon size={14} strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1 pr-2.5">
                      <span className="block truncate text-[12px] font-semibold leading-tight text-charcoal">{node.title}</span>
                      <span className="block truncate text-[10.5px] leading-tight text-taupe">{state.metric || levelLabel[state.level]}</span>
                    </span>
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      {(bad || state.level === "warn") && (
                        <span
                          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
                          style={{ background: levelColor[state.level] }}
                        />
                      )}
                      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: levelColor[state.level] }} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Zoom toolbar */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl border border-[#eadfdc] bg-white/95 p-0.5 shadow-[0_2px_8px_rgb(33_28_29_/_8%)] backdrop-blur">
                <ToolButton label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
                  <ZoomOut size={16} />
                </ToolButton>
                <span className="w-12 text-center text-[12.5px] text-charcoal [font-variant-numeric:tabular-nums]">
                  {Math.round(view.zoom * 100)}%
                </span>
                <ToolButton label="Zoom in" onClick={() => zoomBy(1.2)}>
                  <ZoomIn size={16} />
                </ToolButton>
                <span className="mx-0.5 h-5 w-px bg-[#eadfdc]" aria-hidden="true" />
                <ToolButton
                  label="Fit to screen"
                  onClick={() => {
                    autoFit.current = true;
                    fit();
                  }}
                >
                  <Scan size={16} />
                </ToolButton>
                <ToolButton label={maximized ? "Exit full screen" : "Full screen"} onClick={() => setMaximized((value) => !value)}>
                  {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </ToolButton>
              </div>
              <span className="rounded-lg bg-white/90 px-2.5 py-1.5 text-[12px] text-taupe max-md:hidden">
                Hover a box to see its connections · Drag to move · Ctrl + scroll to zoom
              </span>
            </div>
          </div>
        )}
      </section>
      {!collapsed && !maximized && (
        <p className="m-0 mt-2 px-1 text-[13px] text-taupe">Click any box to see its traffic, errors and what&apos;s wrong. Hover a box to highlight its connections.</p>
      )}

      {/* Issues and error log */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Needs attention">
          {failure ? (
            <p className="m-0 flex items-start gap-2 text-[14px] text-[#9b1c2e]">
              <AlertOctagon size={17} className="mt-0.5 flex-none" aria-hidden="true" /> {failure}
            </p>
          ) : !report ? (
            <p className="m-0 text-[14px] text-taupe">Running health checks…</p>
          ) : issues.length ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {issues.map(({ node, check }) => (
                <li key={`${node.id}-${check.label}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(node.id)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-[14px] text-charcoal hover:bg-[#fbf5f2]"
                  >
                    <span className="mt-0.5 flex-none" style={{ color: levelColor[check.level] }}>
                      {check.level === "error" ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
                    </span>
                    <span className="min-w-0">
                      <strong className="font-medium">{node.title}</strong> · {check.label}
                      <span className="block text-[13px] text-taupe">{check.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[15px] text-[#1f8a55]">Everything is running normally.</p>
          )}
        </Card>

        <Card title="Server error log" description="Errors the server logged since it started (newest first, last 20). Cleared on restart.">
          {report?.errors.length ? (
            <ul className="m-0 grid max-h-[320px] list-none gap-0 overflow-y-auto p-0">
              {report.errors.map((error, index) => (
                <li key={`${error.at}-${index}`} className="border-b border-[#f3ebe8] py-2.5 text-[13px] first:pt-0 last:border-b-0 last:pb-0">
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge tone="burgundy">{error.status}</Badge>
                      <code className="truncate text-[12px]">{error.path}</code>
                    </span>
                    <span className="flex-none text-taupe">{ago(error.at, now)}</span>
                  </span>
                  <span className="mt-1 block text-charcoal">{error.message}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[15px] text-taupe">No errors logged.</p>
          )}
        </Card>
      </div>

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
