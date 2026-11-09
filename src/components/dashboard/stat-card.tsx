"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  caption?: string;
  loading?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  caption,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("h-full p-3 sm:p-3.5", className)}>
      <div className="flex items-center gap-2.5">
        {Icon ? (
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-sky text-brand-teal"
          >
            <Icon className="size-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-5 w-16" />
          ) : (
            <p className="truncate font-heading text-base font-semibold tabular-nums text-brand-strong sm:text-lg">
              {value}
            </p>
          )}
        </div>
      </div>
      {caption ? (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {caption}
        </p>
      ) : null}
    </Card>
  );
}
