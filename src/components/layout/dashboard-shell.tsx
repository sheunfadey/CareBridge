import type { ComponentProps, ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

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
          className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-3 pb-24 sm:px-4 sm:py-4 md:px-5 lg:px-7 lg:py-5 lg:pb-7"
        >
          <div className="w-full overflow-x-hidden">{children}</div>
        </main>
      </div>

      <MobileNav
        isSuperAdmin={isSuperAdmin}
        permissions={permissions}
        unreadNotifications={
          notifications?.filter((notification) => !notification.read).length ??
          0
        }
      />
    </div>
  );
}
