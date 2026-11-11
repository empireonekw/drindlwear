import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { getCurrentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | Dirndl Wear" };

/**
 * Every /admin page goes through this check on the server: signed-out
 * visitors are sent to sign in, and signed-in customers are turned away.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/account/login?next=/admin");

  if (user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf5f2] px-4">
        <div className="w-full max-w-[460px] bg-white px-8 py-12 text-center shadow-[0_24px_60px_rgb(74_20_32_/_12%)]">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#781d2d] text-white">
            <ShieldAlert size={28} aria-hidden="true" />
          </span>
          <h1 className="font-serif text-[30px] text-[#211c1d]">Admins only</h1>
          <p className="mx-auto mb-8 mt-3 max-w-[320px] text-sm leading-relaxed text-[#786565]">
            You&apos;re signed in as <strong className="text-[#211c1d]">{user.email}</strong>, which
            doesn&apos;t have access to the store dashboard.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="bg-[#781d2d] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[1.8px] text-white transition-colors hover:bg-[#9b3345]"
            >
              Back to the shop
            </Link>
            <Link
              href="/account"
              className="border border-[#781d2d] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#781d2d] transition-colors hover:bg-[#781d2d] hover:text-white"
            >
              My account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <AdminShell adminName={user.name}>{children}</AdminShell>;
}
