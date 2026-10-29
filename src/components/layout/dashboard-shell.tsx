import type { ComponentProps, ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type DashboardShellProps = {
  children: ReactNode;
  user?: ComponentProps<typeof Topbar>["user"];
  isSuperAdmin?: boolean;
  permissions?: string[];
  notifications?: ComponentProps<typeof Topbar>["notifications"];
};

export function DashboardShell({
  children,
  user,
  isSuperAdmin = false,
  permissions = [],
  notifications,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <Sidebar isSuperAdmin={isSuperAdmin} permissions={permissions} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          isSuperAdmin={isSuperAdmin}
          permissions={permissions}
          notifications={notifications}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8"
        >
          <div className="w-full overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
