"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { useI18n } from "./i18n";
import { AuthUser, useStore } from "./store";

type Mode = "login" | "register";
type FieldName = "name" | "email" | "phone" | "password" | "confirm" | "acceptTerms";
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only same-site paths, so `?next=` can't send people to another website. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/account/")
    ? value
    : "/account";
}

/** Must match passwordProblem() in lib/server/auth.ts. */
const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

const countryCodes = [
  { code: "DE", dial: "+49", placeholder: "1512 3456789" },
  { code: "AT", dial: "+43", placeholder: "664 1234567" },
  { code: "CH", dial: "+41", placeholder: "78 123 45 67" },
  { code: "GB", dial: "+44", placeholder: "7400 123456" },
  { code: "US", dial: "+1", placeholder: "201 555 0123" },
  { code: "PK", dial: "+92", placeholder: "300 1234567" },
  { code: "AE", dial: "+971", placeholder: "50 123 4567" },
  { code: "SA", dial: "+966", placeholder: "50 123 4567" },
];

/**
 * Server messages arrive in English; most are translated as they are. The
 * sign-in lockout carries a number of minutes, so it is rebuilt here.
 */
function translateServerError(message: string, t: (text: string, vars?: Record<string, string | number>) => string) {
  const lockout = message.match(/^Too many failed attempts\. Please wait (\d+) minutes?/);
  if (lockout) return t("Too many failed attempts. Please wait {minutes} min and try again.", { minutes: lockout[1] });
  return t(message);
}

// Shared look for every text input.
const inputClass =
  "h-[54px] w-full rounded-xl border bg-white px-5 text-[16px] text-[#211c1d] outline-none transition-[border-color,box-shadow] placeholder:text-[#b3a5a4] focus:border-[#781d2d] focus:shadow-[0_0_0_4px_rgb(120_29_45_/_10%)]";
const borderFor = (error?: string) => (error ? " border-[#781d2d]" : " border-[#e3d8d5] hover:border-[#cdbdb9]");

export function AuthPage({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { user, authReady, signIn } = useStore();
  const { t } = useI18n();

  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [country, setCountry] = useState(countryCodes[0]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /** Where to go once signed in. The admin has no shopper profile, so they go to the dashboard. */
  const destination = (signedIn: AuthUser) => (signedIn.role === "admin" && next === "/account" ? "/admin" : next);

  // Already signed in: go straight on.
  useEffect(() => {
    if (authReady && user) router.replace(destination(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user, next, router]);

  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (isRegister && values.name.trim().length < 2) found.name = t("Please enter your full name.");
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = t("Please enter a valid email address.");
    if (isRegister && values.phone.trim() && !/^[\d\s-]{6,15}$/.test(values.phone.trim())) {
      found.phone = t("Please enter a valid phone number.");
    }
    if (!values.password) found.password = t("Please enter your password.");
    else if (isRegister && !passwordRules.every((rule) => rule.test(values.password))) {
      found.password = t("Your password doesn't meet the requirements yet.");
    }
    if (isRegister && values.confirm !== values.password) found.confirm = t("Passwords don't match.");
    if (isRegister && !acceptTerms) found.acceptTerms = t("Please accept the Terms and Privacy Policy.");
    return found;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    // Hidden from people; only bots fill it in.
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    const found = validate();
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`auth-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const phone = values.phone.trim() ? `${country.dial} ${values.phone.trim()}` : "";
      const response = await fetch(isRegister ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { name: values.name, email: values.email, phone, password: values.password, acceptTerms, website }
            : { email: values.email, password: values.password },
        ),
      });
      const data = (await response.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
        field?: FieldName;
      };
      if (!response.ok || !data.user) {
        const message = data.error ? translateServerError(data.error, t) : t("Something went wrong. Please try again.");
        if (data.field) {
          setErrors({ [data.field]: message });
          document.getElementById(`auth-${data.field}`)?.focus();
        } else {
          setFormError(message);
        }
        return;
      }
      signIn(data.user);
      // Drop pages cached while signed out (e.g. the /admin redirect).
      router.refresh();
      router.replace(destination(data.user));
    } catch {
      setFormError(t("We couldn't reach the server. Check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const nextQuery = next !== "/account" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className={"mx-auto w-full " + (isRegister ? "max-w-[760px]" : "max-w-[520px]")}>
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" aria-label={t("Dirndl Wear home")}>
          <img
            src="/brand/dirndl-wear-wordmark.png"
            alt={t("Dirndl Wear — Traditional Dresses")}
            width={220}
            height={41}
            className="h-auto w-[180px] sm:w-[220px]"
          />
        </Link>
        <Link
          href="/"
          className="group flex items-center gap-2 text-[15px] text-[#786565] transition-colors hover:text-[#781d2d]"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {t("Back to store")}
        </Link>
      </header>
      <div className="rounded-2xl border border-[#eadfdc] bg-white px-6 py-9 shadow-[0_1px_2px_rgb(33_28_29_/_4%),0_20px_50px_rgb(74_20_32_/_7%)] sm:px-10 sm:py-11">
        <h1 className="font-serif text-[36px] font-medium leading-tight text-[#211c1d] sm:text-[44px]">
          {isRegister ? t("Create your account") : t("Welcome back")}
        </h1>
        <p className="mb-8 mt-2.5 text-[16px] text-[#786565]">
          {isRegister
            ? t("Track orders, save your wishlist and check out faster.")
            : t("Sign in to track your orders and check out faster.")}
        </p>

        {formError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-[#ecc8c8] bg-[#fcf2f2] px-4 py-3 text-sm text-[#781d2d]"
          >
            <AlertCircle size={18} className="mt-px flex-none" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <form noValidate onSubmit={submit}>
          {isRegister && (
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="auth-website">{t("Leave this field empty")}</label>
              <input id="auth-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
          )}

          <div className={"grid gap-x-5 gap-y-6" + (isRegister ? " sm:grid-cols-2" : "")}>
            {isRegister && (
              <Field id="auth-name" label={t("Full name")} error={errors.name}>
                {(describedBy) => (
                  <input
                    id="auth-name"
                    name="name"
                    autoComplete="name"
                    placeholder={t("Anna Müller")}
                    value={values.name}
                    onChange={set("name")}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={describedBy}
                    className={inputClass + borderFor(errors.name)}
                  />
                )}
              </Field>
            )}

            <Field id="auth-email" label={t("Email")} error={errors.email}>
              {(describedBy) => (
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t("you@example.com")}
                  value={values.email}
                  onChange={set("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={describedBy}
                  className={inputClass + borderFor(errors.email)}
                />
              )}
            </Field>

            {isRegister && (
              <Field id="auth-phone" label={t("Phone number")} optional error={errors.phone} wide>
                {(describedBy) => (
                  <div className="flex gap-2.5">
                    <div className="relative flex-none">
                      <label htmlFor="auth-country" className="sr-only">
                        {t("Country code")}
                      </label>
                      <select
                        id="auth-country"
                        value={country.code}
                        onChange={(event) =>
                          setCountry(countryCodes.find((entry) => entry.code === event.target.value) ?? countryCodes[0])
                        }
                        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
                      >
                        {countryCodes.map((entry) => (
                          <option key={entry.code} value={entry.code}>
                            {entry.code} {entry.dial}
                          </option>
                        ))}
                      </select>
                      <div
                        aria-hidden="true"
                        className="flex h-[54px] w-[132px] items-center gap-2.5 rounded-xl border border-[#e3d8d5] bg-white px-4 transition-[border-color,box-shadow] peer-hover:border-[#cdbdb9] peer-focus-visible:border-[#781d2d] peer-focus-visible:shadow-[0_0_0_4px_rgb(120_29_45_/_10%)] sm:w-[150px]"
                      >
                        <span className="rounded-md bg-[#f6eeec] px-1.5 py-0.5 text-[13px] font-semibold text-[#781d2d]">
                          {country.code}
                        </span>
                        <span className="text-[16px] text-[#211c1d]">{country.dial}</span>
                        <ChevronDown size={16} className="ml-auto text-[#786565]" />
                      </div>
                    </div>
                    <input
                      id="auth-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder={country.placeholder}
                      value={values.phone}
                      onChange={set("phone")}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={describedBy}
                      className={inputClass + borderFor(errors.phone) + " min-w-0 flex-1"}
                    />
                  </div>
                )}
              </Field>
            )}

            <Field
              id="auth-password"
              label={t("Password")}
              error={errors.password}
              hint={capsLock ? t("Caps Lock is on.") : undefined}
            >
              {(describedBy) => (
                <PasswordInput
                  id="auth-password"
                  name="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? t("Create a strong password") : t("Your password")}
                  value={values.password}
                  onChange={set("password")}
                  shown={showPassword}
                  onToggle={() => setShowPassword((shown) => !shown)}
                  error={errors.password}
                  describedBy={describedBy}
                  onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                />
              )}
            </Field>

            {isRegister && (
              <Field id="auth-confirm" label={t("Confirm password")} error={errors.confirm}>
                {(describedBy) => (
                  <PasswordInput
                    id="auth-confirm"
                    name="confirm"
                    autoComplete="new-password"
                    placeholder={t("Repeat password")}
                    value={values.confirm}
                    onChange={set("confirm")}
                    shown={showConfirm}
                    onToggle={() => setShowConfirm((shown) => !shown)}
                    error={errors.confirm}
                    describedBy={describedBy}
                  />
                )}
              </Field>
            )}
          </div>

          {isRegister && (
            <ul className="mt-4 grid gap-x-5 gap-y-2.5 sm:grid-cols-2" aria-label={t("Password requirements")}>
              {[
                ...passwordRules.map((rule) => ({ label: rule.label, ok: rule.test(values.password) })),
                { label: "Passwords match", ok: Boolean(values.confirm) && values.confirm === values.password },
                // Labels stay in English as keys and are translated when shown.
              ].map((rule) => (
                <li key={rule.label} className="flex items-center gap-2.5 text-[14px]">
                  <span
                    className={
                      "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full transition-colors " +
                      (rule.ok ? "bg-[#781d2d] text-white" : "bg-[#ebe4e2]")
                    }
                    aria-hidden="true"
                  >
                    {rule.ok && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className={rule.ok ? "text-[#211c1d]" : "text-[#786565]"}>{t(rule.label)}</span>
                  <span className="sr-only">{rule.ok ? t("(met)") : t("(not met yet)")}</span>
                </li>
              ))}
            </ul>
          )}

          {isRegister && (
            <div className="mt-7">
              <label className="flex cursor-pointer items-center gap-3.5 text-[16px] text-[#211c1d]">
                <input
                  id="auth-acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => {
                    setAcceptTerms(event.target.checked);
                    setErrors((current) => ({ ...current, acceptTerms: undefined }));
                  }}
                  aria-invalid={Boolean(errors.acceptTerms)}
                  aria-describedby={errors.acceptTerms ? "auth-acceptTerms-error" : undefined}
                  className="h-[19px] w-[19px] flex-none cursor-pointer rounded accent-[#781d2d]"
                />
                <span>
                  {t("I agree to the")}{" "}
                  <Link
                    href="/pages/legal-notice"
                    className="font-medium text-[#211c1d] hover:text-[#781d2d] hover:underline"
                  >
                    {t("Terms of Service")}
                  </Link>{" "}
                  {t("and")}{" "}
                  <Link
                    href="/pages/privacy-policy"
                    className="font-medium text-[#211c1d] hover:text-[#781d2d] hover:underline"
                  >
                    {t("Privacy Policy")}
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p id="auth-acceptTerms-error" className="mt-2 text-[13px] text-[#781d2d]">
                  {errors.acceptTerms}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#781d2d] text-[16px] font-medium text-white shadow-[0_8px_20px_rgb(120_29_45_/_22%)] transition-[background-color,transform,box-shadow] hover:bg-[#5e1622] hover:shadow-[0_10px_24px_rgb(120_29_45_/_28%)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#d9b6b6] active:translate-y-px disabled:cursor-wait disabled:opacity-75"
          >
            {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {submitting
              ? isRegister
                ? t("Creating account…")
                : t("Signing in…")
              : isRegister
                ? t("Create account")
                : t("Sign in")}
          </button>
        </form>

        <div className="my-7 flex items-center gap-4 text-[13px] uppercase tracking-[1.5px] text-[#a99594]">
          <span className="h-px flex-1 bg-[#eee6e3]" />
          {t("or")}
          <span className="h-px flex-1 bg-[#eee6e3]" />
        </div>

        <Link
          href={(isRegister ? "/account/login" : "/account/register") + nextQuery}
          replace
          className="flex h-[54px] w-full items-center justify-center rounded-full border border-[#e3d8d5] text-[16px] text-[#211c1d] transition-colors hover:border-[#781d2d] hover:text-[#781d2d]"
        >
          {isRegister ? t("I already have an account") : t("Create a new account")}
        </Link>

        <p className="mt-7 flex items-center justify-center gap-2 text-center text-[13px] text-[#786565]">
          <ShieldCheck size={15} className="flex-none text-[#781d2d]" aria-hidden="true" />
          {t("Your password is encrypted and never stored in plain text.")}
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  /** Span both columns on the two-column sign-up grid. */
  wide?: boolean;
  children: (describedBy: string | undefined) => React.ReactNode;
}) {
  const messageId = useId();
  const { t } = useI18n();
  const message = error ?? hint;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-2.5 flex items-baseline justify-between text-[16px] font-medium text-[#211c1d]">
        {label}
        {optional && <span className="text-[13px] font-normal text-[#a99594]">{t("Optional")}</span>}
      </label>
      {children(message ? messageId : undefined)}
      {message && (
        <p id={messageId} className={"mt-2 text-[13px] " + (error ? "text-[#781d2d]" : "text-[#b5642a]")}>
          {message}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  shown,
  onToggle,
  error,
  describedBy,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  shown: boolean;
  onToggle: () => void;
  error?: string;
  describedBy?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="relative">
      <input
        {...input}
        type={shown ? "text" : "password"}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={inputClass + borderFor(error) + " pr-14"}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={shown ? t("Hide password") : t("Show password")}
        aria-pressed={shown}
        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#786565] transition-colors hover:bg-[#f6eeec] hover:text-[#781d2d]"
      >
        {shown ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
