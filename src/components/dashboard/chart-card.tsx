"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { cn } from "cn";

type ChartCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function ChartCard({
  title,
  description,
  actions,
  children,
  loading = false,
  error = false,
  empty = false,
  emptyMessage = "No data to display for this period yet.",
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3" role="status" aria-label={`Loading ${title}`}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : error ? (
          <ErrorState compact />
        ) : empty ? (
          <EmptyState compact title={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
