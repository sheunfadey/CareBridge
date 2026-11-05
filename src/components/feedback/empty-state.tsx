import type { ReactNode } from "react";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-sky text-brand-teal",
          compact ? "size-9" : "size-12",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} />
      </span>
      <p className={cn("font-heading font-semibold text-brand-strong", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description ? (
        <p className={cn("max-w-md text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
