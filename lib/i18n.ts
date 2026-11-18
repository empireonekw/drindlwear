import { de } from "./i18n-de";

/**
 * Shop languages. German is the default; visitors can switch to English with
 * the DE / EN switch in the header. The choice is kept in the `dw_lang`
 * cookie, so the server renders the right language from the first byte and
 * page addresses stay the same in both languages.
 *
 * Text is written in English in the code and wrapped in `t("…")`. The German
 * version is looked up in lib/i18n-de.ts by that English text. Anything
 * without a German entry shows in English rather than breaking, so a missing
 * translation is never an error, just untranslated.
 *
 * The admin dashboard is the shop owner's tool and stays in English.
 */

export type Locale = "de" | "en";

export const LOCALES: { value: Locale; label: string; name: string }[] = [
  { value: "de", label: "DE", name: "Deutsch" },
  { value: "en", label: "EN", name: "English" },
];

export const DEFAULT_LOCALE: Locale = "de";
export const LOCALE_COOKIE = "dw_lang";

export const isLocale = (value: unknown): value is Locale => value === "de" || value === "en";

/** Values filled into `{name}` placeholders. */
export type Vars = Record<string, string | number>;

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match)) : text;

/** The text in `locale`. `text` is the English original; `{name}` placeholders are filled from `vars`. */
export function translate(locale: Locale, text: string, vars?: Vars) {
  return fill(locale === "de" ? (de[text] ?? text) : text, vars);
}

// Prices are in euros with cents. Numbers are formatted by hand around
// Intl's digit grouping, so Node and every browser print exactly the same
// thing (a mismatch would break hydration).
const germanNumber = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const englishNumber = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "149,90 €" in German, "€149.90" in English. */
export function formatMoney(locale: Locale, amount: number) {
  const sign = amount < 0 ? "−" : "";
  const value = Math.abs(amount);
  return locale === "de" ? `${sign}${germanNumber.format(value)} €` : `${sign}€${englishNumber.format(value)}`;
}

const dateFormats: Record<Locale, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }),
};

/** "18. November 2026" / "18 November 2026". Accepts a Date or an ISO / yyyy-mm-dd string. */
export function formatDate(locale: Locale, value: Date | string) {
  const date = typeof value === "string" ? new Date(value.length === 10 ? `${value}T12:00:00Z` : value) : value;
  return Number.isNaN(date.getTime()) ? String(value) : dateFormats[locale].format(date);
}

/** Everything a component needs to show text in one language. */
export type I18n = {
  locale: Locale;
  t: (text: string, vars?: Vars) => string;
  money: (amount: number) => string;
  date: (value: Date | string) => string;
};

export function makeI18n(locale: Locale): I18n {
  return {
    locale,
    t: (text, vars) => translate(locale, text, vars),
    money: (amount) => formatMoney(locale, amount),
    date: (value) => formatDate(locale, value),
  };
}
