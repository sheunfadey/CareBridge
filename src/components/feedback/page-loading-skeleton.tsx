import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

type PageLoadingSkeletonProps = {
  className?: string;
  cards?: number;
  rows?: number;
};

export function PageLoadingSkeleton({
  className,
  cards = 4,
  rows = 6,
}: PageLoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className={cn("space-y-6", className)}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl bg-card p-5 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-7 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading</span>
    </div>
  );
}
