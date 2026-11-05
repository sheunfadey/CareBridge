"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { cn } from "cn";

type StatusCardProps = {
  title: string;
  status?: { status: string; tone?: StatusTone };
  records: { label: string; value: ReactNode }[];
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function StatusCard({
  title,
  status,
  records,
  loading = false,
  error = false,
  empty = false,
  emptyMessage = "No status records to show yet.",
  className,
}: StatusCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          {title}
        </h2>
        {status ? <StatusBadge status={status.status} tone={status.tone} /> : null}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3" role="status" aria-label={`Loading ${title}`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState compact />
        ) : empty ? (
          <EmptyState compact title={emptyMessage} />
        ) : (
          <dl className="divide-y divide-border">
            {records.map((record) => (
              <div
                key={record.label}
                className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                <dt className="text-sm text-muted-foreground">{record.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-brand-strong">
                  {record.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Card>
  );
}
