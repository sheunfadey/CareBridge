import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  getCurrentUser,
  isTrainerAccount,
} from "@/server/auth/current-user";
import { listNotifications } from "@/server/notifications/service";

/**
 * Async server component that resolves the authenticated user and renders the
 * dashboard chrome. Kept separate from the layout so the dynamic cookie access
 * can sit behind a Suspense boundary (required by Cache Components).
 *
 * Trainer accounts cannot use the personal dashboard at all; every dashboard
 * route sends them to their own workspace.
 */
export async function DashboardChrome({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (user && isTrainerAccount(user)) {
    redirect("/trainer");
  }

  const primaryOrganisation = user?.organisations[0];
  const notifications = user ? await listNotifications(15) : [];

  return (
    <DashboardShell
      user={
        user
          ? {
              name: user.fullName ?? user.email,
              email: user.email,
              avatarUrl: user.avatarUrl ?? undefined,
              organisation: primaryOrganisation?.organisationName,
            }
          : undefined
      }
      isSuperAdmin={user?.isSuperAdmin ?? false}
      permissions={user ? Array.from(user.permissions) : []}
      notifications={notifications}
      activePortal={user?.activePortal ?? "student"}
    >
      {children}
    </DashboardShell>
  );
}
