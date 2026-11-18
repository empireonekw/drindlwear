import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthPage } from "@/components/auth-form";
import { getI18n } from "@/lib/server/i18n";

export function generateMetadata(): Metadata {
  return { title: getI18n().t("Create account | Dirndl Wear") };
}

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthPage mode="register" />
    </Suspense>
  );
}
