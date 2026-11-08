"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "cn";

import { HillCrestLogo } from "@/components/brand/carebridge-logo";
import { primaryNav, superAdminNav } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (
    LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>
  )[name];
  const Resolved = Icon ?? LucideIcons.Circle;
  return <Resolved aria-hidden="true" className={className} />;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/dashboard/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  isSuperAdmin?: boolean;
  permissions?: string[];
};

export function Sidebar({
  className,
  onNavigate,
  isSuperAdmin = false,
  permissions = [],
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = isSuperAdmin ? superAdminNav : primaryNav;
  const visibleGroups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.superAdminOnly || isSuperAdmin) &&
          (!item.permissions ||
            isSuperAdmin ||
            item.permissions.some((permission) =>
              permissions.includes(permission),
            )),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const activeGroupLabel = visibleGroups.find((group) =>
    group.items.some((item) => isActivePath(pathname, item.href)),
  )?.label;

  const [collapsedGroups, setCollapsedGroups] = React.useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(
      visibleGroups.map((group) => [
        group.label,
        group.label !== activeGroupLabel,
      ]),
    ),
  );

  const previousActiveGroup = React.useRef(activeGroupLabel);

  React.useEffect(() => {
    const previous = previousActiveGroup.current;
    previousActiveGroup.current = activeGroupLabel;

    setCollapsedGroups((prev) => {
      const next = { ...prev };
      if (previous && previous !== activeGroupLabel) next[previous] = true;
      if (activeGroupLabel) next[activeGroupLabel] = false;
      return next;
    });
  }, [activeGroupLabel]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col gap-6 overflow-y-auto bg-sidebar px-2 py-4 text-sidebar-foreground sm:px-3 sm:py-5",
        className,
      )}
    >
      <div className="px-2">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <HillCrestLogo size="sm" tone="onDark" />
        </Link>
      </div>

      <div className="flex-1 space-y-5">
        {visibleGroups.map((group) => {
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
                {group.items.map((item: NavItem) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition",
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
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/70">
        <p className="font-medium text-sidebar-foreground">Demo environment</p>
        <p className="mt-1 leading-relaxed">
          Sample data only. No live payments or real resident records.
        </p>
      </div>
    </nav>
  );
}
