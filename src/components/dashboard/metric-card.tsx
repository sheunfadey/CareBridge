"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

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
  href?: string;
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
  href,
  loading = false,
  empty = false,
  className,
}: MetricCardProps) {
  const card = (
    <Card
      className={cn(
        "h-full p-3 transition sm:p-3.5",
        href &&
          "group-hover:ring-brand-teal/40 group-hover:shadow-[0_2px_10px_rgb(15_23_42/0.08)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-sky text-brand-teal [&_svg]:size-3.5"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-2 h-6 w-20" />
          <Skeleton className="mt-1.5 h-3 w-28" />
        </>
      ) : (
        <>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="min-w-0 truncate font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
              {empty ? "—" : value}
            </p>
            {trend ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
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
            <div className="mt-1.5">
              <StatusBadge status={status.status} tone={status.tone} />
            </div>
          ) : null}
          <div className="mt-1 flex items-end justify-between gap-2">
            {hint ? (
              <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                {hint}
              </p>
            ) : (
              <span />
            )}
            {href ? (
              <ArrowUpRightIcon
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-teal"
              />
            ) : null}
          </div>
        </>
      )}
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {card}
    </Link>
  );
}
