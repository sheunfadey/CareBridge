import "server-only";

import { redirect } from "next/navigation";

import type { PermissionKey } from "@/lib/permissions/registry";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";

/**
 * Resolves the current user for a page that requires a permission. Redirects
 * unauthenticated users to sign in, and users without the permission back to
 * the dashboard. RLS remains the authoritative control; this only prevents
 * rendering a page the user cannot use.
 */
export async function requirePermissionPage(
  redirectTo: string,
  permission: PermissionKey,
) {
  return requireAnyPermissionPage(redirectTo, [permission]);
}

export async function requireAnyPermissionPage(
  redirectTo: string,
  permissions: PermissionKey[],
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!permissions.some((permission) => userHasPermission(user, permission))) {
    redirect("/dashboard");
  }

  return user;
}
