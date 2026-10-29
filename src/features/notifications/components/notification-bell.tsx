"use client";

import * as React from "react";
import Link from "next/link";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";
import type { NotificationItem } from "@/server/notifications/service";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";

type NotificationBellProps = {
  notifications: NotificationItem[];
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function relativeTime(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso);
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [locallyRead, setLocallyRead] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [readAll, setReadAll] = React.useState(false);
  const [now, setNow] = React.useState<number | null>(null);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  const items = notifications.map((item) =>
    item.read || readAll || locallyRead.has(item.id)
      ? { ...item, read: true }
      : item,
  );

  const unread = items.filter((item) => !item.read).length;

  const handleRead = (id: string) => {
    setLocallyRead((prev) => new Set(prev).add(id));
    startTransition(() => {
      void markNotificationReadAction(id);
    });
  };

  const handleReadAll = () => {
    setReadAll(true);
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0 ? `${unread} unread notifications` : "Notifications"
          }
        >
          <BellIcon />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-brand-coral text-[10px] font-semibold text-brand-navy">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium text-brand-navy">
            Notifications
          </span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={handleReadAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal underline-offset-4 hover:underline disabled:opacity-50"
            >
              <CheckCheckIcon className="size-3.5" aria-hidden="true" />
              Mark all read
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You have no notifications yet.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => {
              const content = (
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    {!item.read ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-brand-teal"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "text-sm",
                        item.read
                          ? "font-normal text-muted-foreground"
                          : "font-medium text-brand-navy",
                      )}
                    >
                      {item.title}
                    </span>
                  </span>
                  {item.body ? (
                    <span className="line-clamp-2 pl-3.5 text-xs text-muted-foreground">
                      {item.body}
                    </span>
                  ) : null}
                  <span className="pl-3.5 text-[11px] text-muted-foreground/70">
                    {now === null
                      ? formatShortDate(item.createdAt)
                      : relativeTime(item.createdAt, now)}
                  </span>
                </span>
              );

              return (
                <li
                  key={item.id}
                  className="border-b border-border last:border-b-0"
                >
                  {item.actionUrl ? (
                    <Link
                      href={item.actionUrl}
                      onClick={() => handleRead(item.id)}
                      className="block px-3 py-3 transition-colors hover:bg-muted"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRead(item.id)}
                      className="block w-full px-3 py-3 text-left transition-colors hover:bg-muted"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-border px-3 py-2">
          <Link
            href="/dashboard/notifications"
            className="text-xs font-medium text-brand-teal underline-offset-4 hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
