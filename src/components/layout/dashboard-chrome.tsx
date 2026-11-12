import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { listNotifications } from "@/server/notifications/service";

/**
 * Async server component that resolves the authenticated user and renders the
 * dashboard chrome. Kept separate from the layout so the dynamic cookie access
 * can sit behind a Suspense boundary (required by Cache Components).
 */
export async function DashboardChrome({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
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
    >
      {children}
    </DashboardShell>
  );
}
