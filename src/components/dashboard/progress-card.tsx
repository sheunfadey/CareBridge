"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function ProgressCard({
  title,
  value,
  caption,
  loading = false,
}: {
  title: string;
  value: number;
  caption?: string;
  loading?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-brand-strong">{title}</p>
        {loading ? (
          <Skeleton className="h-4 w-10" />
        ) : (
          <span className="text-sm font-semibold tabular-nums text-brand-teal">
            {clamped}%
          </span>
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-2 w-full rounded-full" />
        ) : (
          <Progress
            value={clamped}
            aria-label={`${title}: ${clamped} percent complete`}
          />
        )}
      </div>
      {caption ? (
        <p className="mt-2.5 text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </Card>
  );
}
