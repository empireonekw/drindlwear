"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { I18n, Locale, LOCALE_COOKIE, makeI18n } from "@/lib/i18n";

type I18nState = I18n & {
  /** Switches the whole shop to `next` and remembers it for a year. */
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nState | null>(null);

/**
 * Provides the shop language to client components. The server reads the
 * `dw_lang` cookie and passes the language in, so the first render already
 * matches. Switching rewrites the cookie and refreshes the server-rendered
 * parts; client parts update at once.
 */
export function I18nProvider({ locale: initial, children }: { locale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const router = useRouter();

  const value = useMemo<I18nState>(
    () => ({
      ...makeI18n(locale),
      setLocale: (next) => {
        if (next === locale) return;
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        document.documentElement.lang = next;
        setLocaleState(next);
        router.refresh();
      },
    }),
    [locale, router],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The current language with `t`, `money` and `date` helpers. */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("I18nProvider missing");
  return context;
}
