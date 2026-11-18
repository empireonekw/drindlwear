"use client";

import { useI18n } from "./i18n";

/** Screen-reader text for a loading skeleton ("Loading the product…"), in the shop's language. */
export function LoadingLabel({ label }: { label: string }) {
  const { t } = useI18n();
  return <span className="sr-only">{t("Loading {what}…", { what: t(label) })}</span>;
}
