import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthPage } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account | Dirndl Wear" };

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthPage mode="register" />
    </Suspense>
  );
}
