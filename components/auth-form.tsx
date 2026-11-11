"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { AuthUser, useStore } from "./store";

type Mode = "login" | "register";
type FieldErrors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "acceptTerms", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only same-site paths, so `?next=` can't send people to another website. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/account/")
    ? value
    : "/account";
}

const passwordRules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "A letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
];

/** 0–4: how strong the password looks. */
function strength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  if (!passwordRules.every((rule) => rule.test(password))) score = Math.min(score, 1);
  return Math.max(1, score);
}
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-[#c4554d]", "bg-[#d39b4a]", "bg-[#9b3345]", "bg-[#781d2d]"];

export function AuthPage({ mode }: { mode: Mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { user, authReady, signIn } = useStore();

  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: go straight on.
  useEffect(() => {
    if (authReady && user) router.replace(next);
  }, [authReady, user, next, router]);

  const set = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (isRegister && values.name.trim().length < 2) found.name = "Please enter your full name.";
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = "Please enter a valid email address.";
    if (isRegister && values.phone.trim() && !/^\+?[\d\s-]{7,20}$/.test(values.phone.trim())) {
      found.phone = "Please enter a valid phone number.";
    }
    if (!values.password) found.password = "Please enter your password.";
    else if (isRegister && !passwordRules.every((rule) => rule.test(values.password))) {
      found.password = "Use at least 8 characters with a letter and a number.";
    }
    if (isRegister && values.confirm !== values.password) found.confirm = "Passwords don't match.";
    if (isRegister && !acceptTerms) found.acceptTerms = "Please accept the privacy policy to continue.";
    return found;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Hidden from people; only bots fill it in.
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    setFormError("");
    const found = validate();
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(`auth-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(isRegister ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? {
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password,
                acceptTerms,
                website,
              }
            : { email: values.email, password: values.password },
        ),
      });
      const data = (await response.json().catch(() => ({}))) as {
        user?: AuthUser;
        error?: string;
        field?: keyof FieldErrors;
      };
      if (!response.ok || !data.user) {
        const message = data.error ?? "Something went wrong. Please try again.";
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
      router.replace(next);
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const score = strength(values.password);
  const nextQuery = next !== "/account" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto grid max-w-[1080px] overflow-hidden bg-white shadow-[0_24px_60px_rgb(74_20_32_/_12%)] md:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <aside
          className="relative hidden min-h-[640px] bg-cover bg-center md:block"
          style={{ backgroundImage: `url(${isRegister ? "/images/asset-06.webp" : "/images/asset-03.webp"})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#4a1420]/55 via-[#781d2d]/70 to-[#4a1420]/95" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <img
              src="/brand/dirndl-wear-logo1.png"
              alt="Dirndl Wear"
              className="h-14 w-36 object-contain object-left brightness-0 invert"
            />
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[3px] text-[#f1dada]">
                {isRegister ? "Join Dirndl Wear" : "Welcome back"}
              </p>
              <h2 className="mb-6 font-serif text-[34px] leading-tight">
                {isRegister ? "Your wardrobe of tradition starts here." : "Good to see you again."}
              </h2>
              <ul className="space-y-4 text-sm text-[#fbecec]">
                {[
                  { icon: Package, text: "Track your orders in one place" },
                  { icon: Heart, text: "Keep your wishlist on every device" },
                  { icon: Truck, text: "Faster checkout with saved details" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/30 bg-white/10">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="px-6 py-9 sm:px-12 sm:py-12">
          <div
            role="tablist"
            aria-label="Account"
            className="mb-8 grid grid-cols-2 border-b border-[#eadfdc] text-[12px] uppercase tracking-[1.6px]"
          >
            {(
              [
                ["login", "Sign in", "/account/login"],
                ["register", "Create account", "/account/register"],
              ] as const
            ).map(([tab, label, href]) => (
              <Link
                key={tab}
                role="tab"
                aria-selected={mode === tab}
                href={href + nextQuery}
                replace
                className={
                  "-mb-px border-b-2 pb-3 text-center transition-colors " +
                  (mode === tab
                    ? "border-[#781d2d] font-semibold text-[#781d2d]"
                    : "border-transparent text-[#786565] hover:text-[#781d2d]")
                }
              >
                {label}
              </Link>
            ))}
          </div>

          <h1 className="font-serif text-[32px] leading-tight text-[#211c1d]">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </h1>
          <p className="mb-7 mt-2 text-sm text-[#786565]">
            {isRegister
              ? "It only takes a minute. We'll never share your details."
              : "Enter your email and password to continue."}
          </p>

          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 border border-[#e8c3c3] bg-[#fbf0f0] px-4 py-3 text-sm text-[#781d2d]"
            >
              <AlertCircle size={18} className="mt-px flex-none" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <form noValidate onSubmit={submit} className="space-y-5">
            {isRegister && (
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="auth-website">Leave this field empty</label>
                <input id="auth-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
            )}
            {isRegister && (
              <Field
                id="auth-name"
                label="Full name"
                icon={UserRound}
                error={errors.name}
                input={{
                  name: "name",
                  autoComplete: "name",
                  value: values.name,
                  onChange: set("name"),
                  placeholder: "e.g. Ayesha Khan",
                }}
              />
            )}
            <Field
              id="auth-email"
              label="Email address"
              icon={Mail}
              error={errors.email}
              input={{
                name: "email",
                type: "email",
                autoComplete: "email",
                inputMode: "email",
                value: values.email,
                onChange: set("email"),
                placeholder: "you@example.com",
              }}
            />
            {isRegister && (
              <Field
                id="auth-phone"
                label="Phone number"
                optional
                icon={Phone}
                error={errors.phone}
                input={{
                  name: "phone",
                  type: "tel",
                  autoComplete: "tel",
                  value: values.phone,
                  onChange: set("phone"),
                  placeholder: "+92 300 1234567",
                }}
              />
            )}

            <Field
              id="auth-password"
              label="Password"
              icon={Lock}
              error={errors.password}
              input={{
                name: "password",
                type: showPassword ? "text" : "password",
                autoComplete: isRegister ? "new-password" : "current-password",
                value: values.password,
                onChange: set("password"),
                onKeyUp: (event) => setCapsLock(event.getModifierState("CapsLock")),
                onBlur: () => setCapsLock(false),
                placeholder: isRegister ? "Create a password" : "Your password",
              }}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="flex h-full items-center px-3 text-[#786565] transition-colors hover:text-[#781d2d]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              hint={capsLock ? <span className="text-[#b5642a]">Caps Lock is on.</span> : undefined}
            />

            {isRegister && values.password && (
              <div className="-mt-2" aria-live="polite">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className={
                        "h-1 flex-1 rounded-full transition-colors " +
                        (bar <= score ? strengthColors[score] : "bg-[#eadfdc]")
                      }
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[#786565]">
                  Password strength: <strong className="text-[#211c1d]">{strengthLabels[score]}</strong>
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {passwordRules.map((rule) => {
                    const ok = rule.test(values.password);
                    return (
                      <li key={rule.label} className={"flex items-center gap-1 " + (ok ? "text-[#1f6b44]" : "text-[#786565]")}>
                        <Check size={13} className={ok ? "opacity-100" : "opacity-30"} aria-hidden="true" />
                        {rule.label}
                        <span className="sr-only">{ok ? "(done)" : "(missing)"}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {isRegister && (
              <Field
                id="auth-confirm"
                label="Confirm password"
                icon={Lock}
                error={errors.confirm}
                input={{
                  name: "confirm",
                  type: showPassword ? "text" : "password",
                  autoComplete: "new-password",
                  value: values.confirm,
                  onChange: set("confirm"),
                  placeholder: "Type it again",
                }}
                trailing={
                  values.confirm && values.confirm === values.password ? (
                    <span className="flex h-full items-center px-3 text-[#1f6b44]" aria-label="Passwords match">
                      <Check size={18} />
                    </span>
                  ) : undefined
                }
              />
            )}

            {isRegister && (
              <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[#4a3f40]">
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
                    className="mt-0.5 h-4 w-4 flex-none accent-[#781d2d]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/pages/privacy-policy" className="text-[#781d2d] underline underline-offset-2">
                      privacy policy
                    </Link>{" "}
                    and want to create an account.
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p id="auth-acceptTerms-error" className="mt-1.5 text-xs text-[#a32232]">
                    {errors.acceptTerms}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 bg-[#781d2d] px-6 py-4 text-[12px] font-semibold uppercase tracking-[2px] text-white transition-all hover:bg-[#9b3345] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#d9b6b6] disabled:cursor-wait disabled:opacity-75 motion-safe:hover:-translate-y-0.5"
            >
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting
                ? isRegister
                  ? "Creating account…"
                  : "Signing in…"
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#786565]">
            {isRegister ? "Already have an account? " : "New to Dirndl Wear? "}
            <Link
              href={(isRegister ? "/account/login" : "/account/register") + nextQuery}
              replace
              className="font-semibold text-[#781d2d] underline-offset-4 hover:underline"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>

          <p className="mt-8 flex items-center justify-center gap-2 border-t border-[#f0e7e4] pt-5 text-xs text-[#786565]">
            <ShieldCheck size={15} className="text-[#781d2d]" aria-hidden="true" />
            Your password is encrypted and never stored in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  optional,
  input,
  trailing,
  hint,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  optional?: boolean;
  input: React.InputHTMLAttributes<HTMLInputElement>;
  trailing?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  const describedBy = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex justify-between text-[12px] font-semibold uppercase tracking-[1.2px] text-[#4a3f40]">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal text-[#998a8a]">Optional</span>}
      </label>
      <div
        className={
          "flex h-[50px] items-center border bg-white transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_rgb(120_29_45_/_12%)] " +
          (error ? "border-[#a32232]" : "border-[#dcd0cd] focus-within:border-[#781d2d] hover:border-[#c7b5b1]")
        }
      >
        <Icon size={17} aria-hidden={true} className={"ml-3.5 flex-none " + (error ? "text-[#a32232]" : "text-[#a99594]")} />
        <input
          id={id}
          {...input}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? describedBy : undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#211c1d] outline-none placeholder:text-[#b9abaa]"
        />
        {trailing}
      </div>
      {(error || hint) && (
        <p id={describedBy} className={"mt-1.5 text-xs " + (error ? "text-[#a32232]" : "")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
