import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  isTrainerAccount,
  getCurrentUser,
} from "@/server/auth/current-user";
import { listNotifications } from "@/server/notifications/service";

/**
 * Chrome for the standalone trainer workspace. It reuses the dashboard shell
 * but swaps in trainer navigation, trainer shortcuts and its own account paths.
 */
export async function TrainerChrome({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=%2Ftrainer");
  }

  if (!isTrainerAccount(user)) {
    // Super administrators belong in the platform console, never in a tenant
    // workspace.
    redirect(user.isSuperAdmin ? "/dashboard/admin" : "/dashboard");
  }

  const primaryOrganisation = user.organisations[0];
  const notifications = await listNotifications(15);

  return (
    <DashboardShell
      user={{
        name: user.fullName ?? user.email,
        email: user.email,
        avatarUrl: user.avatarUrl ?? undefined,
        organisation: primaryOrganisation?.organisationName,
      }}
      isSuperAdmin={user.isSuperAdmin}
      permissions={Array.from(user.permissions)}
      notifications={notifications}
      activePortal="trainer"
      surface="trainer"
    >
      {children}
    </DashboardShell>
  );
}
