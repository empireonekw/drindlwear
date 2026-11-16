import { redirect } from "next/navigation";

import { getCurrentUser, toPublicUser } from "@/lib/server/auth";

import { AccountView } from "./account-view";

export const dynamic = "force-dynamic";

/**
 * Checks the session on the server before anything is shown: signed-out
 * visitors go straight to sign-up (no loading screen), and signed-in
 * customers get their account page at once.
 */
export default async function AccountPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/account/register");
  // There is one admin and no shopper profile for them: send them to the dashboard.
  if (user.role === "admin") redirect("/admin");
  return <AccountView initialUser={toPublicUser(user)} />;
}
