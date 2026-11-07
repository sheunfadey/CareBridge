"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  Building2Icon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "cn";

import { Sidebar } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/dashboard/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const learnerShortcuts = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Academy", href: "/dashboard/academy", icon: GraduationCapIcon },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquareIcon },
  { label: "Alerts", href: "/dashboard/notifications", icon: BellIcon },
] as const;

const superAdminShortcuts = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboardIcon },
  { label: "Organisations", href: "/dashboard/admin/organisations", icon: Building2Icon },
  { label: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
  { label: "Alerts", href: "/dashboard/notifications", icon: BellIcon },
] as const;

export function MobileNav({
  isSuperAdmin = false,
  permissions = [],
  unreadNotifications = 0,
}: {
  isSuperAdmin?: boolean;
  permissions?: string[];
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const shortcuts = isSuperAdmin ? superAdminShortcuts : learnerShortcuts;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5">
        {shortcuts.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition",
                active
                  ? "text-brand-teal"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Alerts" && unreadNotifications > 0 ? (
                <span className="absolute right-[22%] top-1.5 flex size-4 items-center justify-center rounded-full bg-brand-coral text-[9px] font-semibold text-brand-ink">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </Link>
          );
        })}

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] max-w-[85vw] border-none bg-sidebar p-0"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Primary navigation for CareBridge
            </SheetDescription>
            <Sidebar
              isSuperAdmin={isSuperAdmin}
              permissions={permissions}
              onNavigate={() => setMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
