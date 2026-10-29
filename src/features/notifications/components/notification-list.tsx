"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { NotificationItem } from "@/server/notifications/service";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";

const categoryLabels: Record<string, string> = {
  account: "Account",
  learning: "Learning",
  assessment: "Assessment",
  internship: "Internship",
  employment: "Employment",
  referral: "Referral",
  payment: "Payment",
  charity: "Charity",
  care_operations: "Care operations",
  platform: "Platform",
};

export function NotificationList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [locallyRead, setLocallyRead] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [readAll, setReadAll] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReadAll}
            disabled={pending}
          >
            <CheckCheckIcon aria-hidden="true" />
            Mark all read
          </Button>
        ) : null}
      </div>

      <ul className="divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
        {items.map((item) => (
          <li key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  item.read ? "bg-border" : "bg-brand-teal",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      item.read
                        ? "font-normal text-foreground"
                        : "font-semibold text-brand-navy",
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="rounded-full bg-brand-sky px-2 py-0.5 text-[11px] font-medium text-brand-teal">
                    {categoryLabels[item.category] ?? item.category}
                  </span>
                </div>
                {item.body ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.body}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/70">
                    {new Date(item.createdAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  {item.actionUrl ? (
                    <Link
                      href={item.actionUrl}
                      onClick={() => handleRead(item.id)}
                      className="text-xs font-medium text-brand-teal underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button
                      type="button"
                      onClick={() => handleRead(item.id)}
                      disabled={pending}
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
