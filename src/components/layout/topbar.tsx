"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon, LogOutIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "cn";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { logoutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import type { NotificationItem } from "@/server/notifications/service";

type TopbarProps = {
  user?: {
    name: string;
    email: string;
    organisation?: string;
    avatarUrl?: string;
  };
  notifications?: NotificationItem[];
  isSuperAdmin?: boolean;
  permissions?: string[];
  className?: string;
};

export function Topbar({
  user,
  notifications = [],
  isSuperAdmin = false,
  permissions = [],
  className,
}: TopbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-2 backdrop-blur sm:gap-3 sm:px-4",
        className,
      )}
    >
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] max-w-[85vw] border-none bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Primary navigation for CareBridge
          </SheetDescription>
          <Sidebar
            isSuperAdmin={isSuperAdmin}
            permissions={permissions}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 lg:hidden"
        aria-label="CareBridge dashboard"
      >
        <LogoMark size={24} />
      </Link>

      <div className="hidden flex-1 items-center lg:flex">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Search CareBridge</span>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search courses, jobs, residents, transactions"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </label>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <NotificationBell notifications={notifications} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-8">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-brand-teal text-xs font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-medium text-brand-strong">
                  {user.name}
                </span>
                {user.organisation ? (
                  <span className="block text-[11px] text-muted-foreground">
                    {user.organisation}
                  </span>
                ) : null}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className="hidden size-4 text-muted-foreground sm:block"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium">{user.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Profile & settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/notifications">
                Notification preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-brand-error">
                  <LogOutIcon />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
