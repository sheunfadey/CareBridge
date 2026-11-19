"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "cn";

import { HillCrestLogo } from "@/components/brand/carebridge-logo";
import {
  caregiverNav,
  studentNav,
  superAdminNav,
  trainerNav,
} from "@/config/navigation";
import type { NavGroup, NavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import type { PortalMode } from "@/types/database";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (
    LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>
  )[name];
  const Resolved = Icon ?? LucideIcons.Circle;
  return <Resolved aria-hidden="true" className={className} />;
}

function isActivePath(pathname: string, href: string) {
  if (
    href === "/dashboard" ||
    href === "/dashboard/admin" ||
    href === "/dashboard/overview" ||
    href === "/trainer"
  ) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <NavIcon
          name={item.icon}
          className={cn(
            "size-4 shrink-0",
            active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {item.badge}
          </Badge>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Collapsible navigation groups. The component is keyed on the current path,
 * so every navigation or refresh mounts it with all groups closed except the
 * group that owns the active page.
 */
function NavGroups({
  groups,
  activeGroupLabel,
  defaultOpenGroups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  activeGroupLabel: string | undefined;
  defaultOpenGroups: string[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      groups.map((group) => [
        group.label,
        group.label !== activeGroupLabel &&
          !defaultOpenGroups.includes(group.label),
      ]),
    ),
  );

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {groups.map((group) => {
        const collapsed =
          collapsedGroups[group.label] ?? group.label !== activeGroupLabel;
        const groupId = `nav-group-${group.label.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <div key={group.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={!collapsed}
              aria-controls={groupId}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/60 transition hover:text-sidebar-foreground"
            >
              {group.label}
              <ChevronDownIcon
                aria-hidden="true"
                className={cn(
                  "size-3.5 transition-transform",
                  collapsed && "-rotate-90",
                )}
              />
            </button>
            <ul id={groupId} hidden={collapsed} className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  isSuperAdmin?: boolean;
  permissions?: string[];
  activePortal?: PortalMode;
  /** The standalone trainer workspace renders its own navigation. */
  surface?: "portal" | "trainer";
  organisationAdmin?: boolean;
};

export function Sidebar({
  className,
  onNavigate,
  isSuperAdmin = false,
  permissions = [],
  activePortal = "student",
  surface = "portal",
  organisationAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();
  const isTrainerSurface = surface === "trainer";

  const navigation = isTrainerSurface
    ? trainerNav
    : isSuperAdmin
      ? superAdminNav
      : activePortal === "caregiver"
        ? caregiverNav
        : studentNav;
  const defaultOpenGroups = isTrainerSurface
    ? ["Course Studio", "Learner performance", "Communication"]
    : isSuperAdmin
      ? []
      : activePortal === "caregiver"
        ? ["Care work", "Teaching", "Work", "Organisation", "Communication"]
        : ["Academy", "Career", "Communication"];
  const homeHref = isTrainerSurface ? "/trainer" : "/dashboard";
  const sidebarLabel = isTrainerSurface
    ? "Trainer studio"
    : pathname.startsWith("/dashboard/care-homes")
      ? "Care workspace"
      : pathname.startsWith("/dashboard/organisation")
        ? "Organisation"
        : organisationAdmin
          ? "Organisation admin"
          : `${activePortal} portal`;

  const canSee = React.useCallback(
    (item: NavItem) =>
      (!item.superAdminOnly || isSuperAdmin) &&
      (!item.permissions ||
        isSuperAdmin ||
        item.permissions.some((permission) => permissions.includes(permission))),
    [isSuperAdmin, permissions],
  );

  const pinnedItems = React.useMemo(
    () => navigation.pinned.filter(canSee),
    [navigation, canSee],
  );

  const visibleGroups = React.useMemo(
    () =>
      navigation.groups
        .map((group) => ({
          ...group,
          items: group.items.filter(canSee),
        }))
        .filter((group) => group.items.length > 0),
    [navigation, canSee],
  );

  const activeGroupLabel = visibleGroups.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.href)),
  )?.label;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-sidebar px-2 py-4 text-sidebar-foreground sm:px-3 sm:py-5",
        className,
      )}
    >
      <div className="shrink-0 px-2">
        <Link
          href={homeHref}
          onClick={onNavigate}
          className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <HillCrestLogo size="sm" tone="onDark" />
        </Link>
        {!isSuperAdmin || isTrainerSurface ? (
          <p className="mt-2 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
            {sidebarLabel}
          </p>
        ) : null}
      </div>

      {pinnedItems.length > 0 ? (
        <div className="shrink-0 pb-2">
          <ul className="space-y-0.5">
            {pinnedItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4 border-t border-sidebar-border/60 pt-3">
          <NavGroups
            key={`${pathname}-${activePortal}`}
            groups={visibleGroups}
            activeGroupLabel={activeGroupLabel}
            defaultOpenGroups={defaultOpenGroups}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="shrink-0 rounded-lg bg-sidebar-accent/50 px-3 py-2.5 text-[11px] text-sidebar-foreground/70">
        <p className="font-medium text-sidebar-foreground">Demo environment</p>
        <p className="mt-0.5 leading-relaxed">
          Sample data only. No live payments or real resident records.
        </p>
      </div>
    </nav>
  );
}
