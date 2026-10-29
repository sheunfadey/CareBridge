import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, type CurrentUser } from "@/server/auth/current-user";

/**
 * Resolves the current user for a platform-administration page. Redirects
 * unauthenticated users to sign in, and non-super-admins back to the dashboard
 * (without revealing that platform administration exists).
 */
export async function requireSuperAdminPage(
  redirectTo: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!user.isSuperAdmin) {
    redirect("/dashboard");
  }

  return user;
}
