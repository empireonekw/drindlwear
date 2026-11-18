"use client";

import { LOCALES } from "@/lib/i18n";

import { useI18n } from "./i18n";

/**
 * DE | EN switch. `compact` is the small pill in the desktop header; the
 * full version, with a "Language" label, sits in the phone menu drawer.
 */
export function LanguageSwitch({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const group = (
    <div
      role="group"
      aria-label={t("Language")}
      className={
        "inline-flex items-center rounded-full border border-[#e3d3cf] bg-white/70 p-[3px] " +
        (compact ? "" : "self-start")
      }
    >
      {LOCALES.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            aria-pressed={active}
            title={option.name}
            onClick={() => setLocale(option.value)}
            className={
              "rounded-full font-semibold tracking-[1.2px] transition-colors duration-200 " +
              (compact ? "px-2.5 py-1 text-[11px] " : "px-4 py-1.5 text-[12px] ") +
              (active ? "bg-[#781d2d] text-white" : "text-[#5b4c4c] hover:text-[#781d2d]")
            }
          >
            <span aria-hidden="true">{option.label}</span>
            <span className="sr-only">{option.name}</span>
          </button>
        );
      })}
    </div>
  );

  if (compact) return <div className={className}>{group}</div>;
  return (
    <div className={"flex items-center justify-between gap-4 " + className}>
      <span className="text-[12px] uppercase tracking-[1.6px] text-[#786565]">{t("Language")}</span>
      {group}
    </div>
  );
}
