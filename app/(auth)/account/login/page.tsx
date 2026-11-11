import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthPage } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in | Dirndl Wear" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage mode="login" />
    </Suspense>
  );
}
