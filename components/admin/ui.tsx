"use client";

/**
 * Admin UI kit: the building blocks every admin page uses, in the brand
 * palette (burgundy, ivory, taupe, charcoal). Keep new admin screens on these
 * so the dashboard stays consistent.
 */

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, AlertCircle, type LucideIcon } from "lucide-react";

import type { OrderStatus } from "@/components/store";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

// ---------------------------------------------------------------------------
// Layout

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 font-serif text-[34px] font-medium leading-tight text-charcoal max-sm:text-[28px]">{title}</h1>
        {description && <p className="m-0 mt-1.5 max-w-[60ch] text-[14px] text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx("min-w-0 rounded-2xl border border-[#eadfdc] bg-white", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1e8e5] px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="m-0 text-[15px] font-semibold text-charcoal">{title}</h2>}
            {description && <p className="m-0 mt-0.5 text-[13px] text-taupe">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "burgundy",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: "burgundy" | "green" | "amber" | "taupe";
}) {
  const tones = {
    burgundy: "bg-[#f6eeec] text-burgundy",
    green: "bg-[#e3f1e8] text-[#1f6b44]",
    amber: "bg-[#fbf0dc] text-[#8a5a0b]",
    taupe: "bg-[#f1ecea] text-taupe",
  };
  return (
    <div className="flex min-w-0 items-start gap-4 rounded-2xl border border-[#eadfdc] bg-white p-5">
      <span className={cx("flex h-11 w-11 flex-none items-center justify-center rounded-xl", tones[tone])}>
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[13px] text-taupe">{label}</p>
        <p className="m-0 mt-0.5 truncate text-[26px] font-semibold leading-tight text-charcoal [font-variant-numeric:tabular-nums]">
          {value}
        </p>
        {hint && <p className="m-0 mt-1 text-[12px] text-taupe">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eeec] text-burgundy">
        <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="m-0 text-[16px] font-semibold text-charcoal">{title}</p>
      {text && <p className="m-0 mt-1.5 max-w-[46ch] text-[14px] text-taupe">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges

export type Tone = "neutral" | "burgundy" | "amber" | "blue" | "green" | "grey";

const toneClass: Record<Tone, string> = {
  neutral: "bg-[#f1ecea] text-[#5b4c4c]",
  burgundy: "bg-[#f6e6e8] text-burgundy",
  amber: "bg-[#fbf0dc] text-[#8a5a0b]",
  blue: "bg-[#e6eef8] text-[#2c5282]",
  green: "bg-[#e3f1e8] text-[#1f6b44]",
  grey: "bg-[#ede9e8] text-[#6b6262]",
};

export function Badge({ tone = "neutral", children, dot = true }: { tone?: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium", toneClass[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export const orderStatusTone: Record<OrderStatus, Tone> = {
  New: "burgundy",
  Processing: "amber",
  Shipped: "blue",
  Delivered: "green",
  Cancelled: "grey",
};

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge tone="grey">Sold out</Badge>;
  if (stock <= 3) return <Badge tone="amber">Low · {stock}</Badge>;
  return <Badge tone="green">In stock · {stock}</Badge>;
}

// ---------------------------------------------------------------------------
// Buttons

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variantClass: Record<Variant, string> = {
  primary: "bg-burgundy text-white hover:bg-burgundy-dark shadow-[0_6px_16px_rgb(120_29_45_/_18%)]",
  secondary: "border border-[#dcd0cd] bg-white text-charcoal hover:border-burgundy hover:text-burgundy",
  ghost: "text-charcoal hover:bg-[#f6eeec] hover:text-burgundy",
  danger: "border border-[#e8c3c3] bg-white text-[#9b1c2e] hover:bg-[#fcf0f0]",
};
const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const sizeClass = { sm: "h-9 px-3", md: "h-11 px-4" };

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button type="button" {...props} className={cx(buttonBase, sizeClass[size], variantClass[variant], className)} />;
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonBase, sizeClass[size], variantClass[variant], className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Form fields

export const inputClass =
  "h-11 w-full rounded-xl border border-[#dcd0cd] bg-white px-3.5 text-[14px] text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-[#a99594] hover:border-[#cdbdb9] focus:border-burgundy focus:shadow-[0_0_0_3px_rgb(120_29_45_/_10%)] focus-visible:![outline:none]";
export const textareaClass = inputClass.replace("h-11", "min-h-[110px] py-3");

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-charcoal">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p className={cx("m-0 mt-1.5 text-[12px]", error ? "text-[#9b1c2e]" : "text-taupe")}>{error ?? hint}</p>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-taupe" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass + " pl-10"}
      />
    </div>
  );
}

/** A row of filter tabs with counts, e.g. order statuses. */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex h-9 flex-none items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors",
              active ? "bg-charcoal text-white" : "text-taupe hover:bg-[#f1ecea] hover:text-charcoal",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cx("rounded-full px-1.5 text-[11px]", active ? "bg-white/20" : "bg-[#ebe4e2] text-charcoal")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlays

function useOverlay(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  // Pages usually pass a new onClose function on every render (every
  // keystroke in a form). Keep the latest one in a ref so the effect below runs
  // only when the overlay opens or closes, and doesn't move focus back to the
  // first field while someone is typing.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")?.focus({ preventScroll: true });
    }, 60);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);
  return panel;
}

/** Side panel that slides in from the right. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useOverlay(open, onClose);
  const titleId = useId();
  return (
    <div
      className={cx("fixed inset-0 z-[80]", open ? "visible" : "invisible [transition:visibility_0s_300ms]")}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cx("absolute inset-0 bg-[rgb(33_28_29_/_45%)] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "absolute bottom-0 right-0 top-0 flex w-full flex-col bg-[#fbf5f2] shadow-[-20px_0_50px_rgb(33_28_29_/_18%)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          wide ? "max-w-[760px]" : "max-w-[520px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#eadfdc] bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="m-0 font-serif text-[26px] font-medium leading-tight text-charcoal">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-[13px] text-taupe">{subtitle}</div>}
          </div>
          <button
            type="button"
            data-close
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-taupe transition-colors hover:bg-[#f6eeec] hover:text-burgundy"
          >
            <X size={19} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2.5 border-t border-[#eadfdc] bg-white px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

/** Small centred confirmation, used before deleting things. */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panel = useOverlay(open, onCancel);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgb(33_28_29_/_45%)]" onClick={onCancel} />
      <div ref={panel} role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_30px_60px_rgb(33_28_29_/_25%)]">
        <h2 id={titleId} className="m-0 text-[18px] font-semibold text-charcoal">
          {title}
        </h2>
        <p className="m-0 mt-2 text-[14px] text-taupe">{text}</p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts

type Toast = { id: number; text: string; tone: "success" | "error" };
const ToastContext = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-[360px] items-center gap-3 rounded-xl bg-charcoal px-4 py-3 text-[14px] text-white shadow-[0_14px_34px_rgb(33_28_29_/_30%)] motion-safe:animate-announce-in"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 size={18} className="flex-none text-[#7fd3a4]" aria-hidden="true" />
            ) : (
              <AlertCircle size={18} className="flex-none text-[#f0a7b3]" aria-hidden="true" />
            )}
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Table helpers

export const tableClass = "w-full min-w-[720px] border-collapse text-left text-[14px]";
export const thClass = "border-b border-[#eadfdc] bg-[#fdfaf8] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.6px] text-taupe";
export const tdClass = "border-b border-[#f3ebe8] px-5 py-3.5 align-middle text-charcoal";
