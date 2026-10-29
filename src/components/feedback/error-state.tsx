import type { ReactNode } from "react";
import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content. Check your connection and try again.",
  action,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-brand-error/20 bg-brand-error/5 text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-error/10 text-brand-error",
          compact ? "size-9" : "size-12",
        )}
      >
        <TriangleAlertIcon className={compact ? "size-4" : "size-5"} />
      </span>
      <p className={cn("font-heading font-semibold text-brand-navy", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      <p className={cn("max-w-md text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        {description}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
