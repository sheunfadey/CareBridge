"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "cn";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
  trend?: { value: number; label?: string };
  status?: { status: string; tone?: StatusTone };
  loading?: boolean;
  empty?: boolean;
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon,
  hint,
  trend,
  status,
  loading = false,
  empty = false,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-brand-sky text-brand-teal [&_svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-32" />
        </>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-heading text-2xl font-semibold tabular-nums text-brand-strong">
              {empty ? "—" : value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                  trend.value >= 0
                    ? "bg-brand-success/10 text-brand-success"
                    : "bg-brand-error/10 text-brand-error",
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%
              </span>
            ) : null}
          </div>
          {status ? (
            <div className="mt-2">
              <StatusBadge status={status.status} tone={status.tone} />
            </div>
          ) : null}
          {hint ? (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </>
      )}
    </Card>
  );
}
