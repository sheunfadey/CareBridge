"use client";

import { Card } from "@/components/ui/card";
import { cn } from "cn";

export type ActivityItem = {
  id: string;
  title: string;
  meta?: string;
  time?: string;
  tone?: "teal" | "green" | "coral" | "slate";
};

const dotTone: Record<NonNullable<ActivityItem["tone"]>, string> = {
  teal: "bg-brand-teal",
  green: "bg-brand-success",
  coral: "bg-brand-coral",
  slate: "bg-brand-slate",
};

export function RecentActivityCard({
  title = "Recent activity",
  items,
  className,
}: {
  title?: string;
  items: ActivityItem[];
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <h2 className="font-heading text-base font-semibold text-brand-strong">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No activity recorded yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  dotTone[item.tone ?? "teal"],
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brand-strong">{item.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {item.meta ? <span>{item.meta}</span> : null}
                  {item.meta && item.time ? <span aria-hidden="true">·</span> : null}
                  {item.time ? (
                    <time className="tabular-nums">{item.time}</time>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
