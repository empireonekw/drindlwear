import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, Locale, LOCALE_COOKIE, makeI18n } from "@/lib/i18n";

/** The visitor's shop language from the `dw_lang` cookie (German when unset). */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** `t`, `money` and `date` in the visitor's language, for server components. */
export function getI18n() {
  return makeI18n(getLocale());
}
