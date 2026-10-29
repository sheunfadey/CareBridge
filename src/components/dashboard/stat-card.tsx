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
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
          >
            <Icon className="size-4.5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 h-5 w-16" />
          ) : (
            <p className="font-heading text-lg font-semibold tabular-nums text-brand-navy">
              {value}
            </p>
          )}
        </div>
      </div>
      {caption ? (
        <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </Card>
  );
}
