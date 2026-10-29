import { Loader2Icon } from "lucide-react";
import { cn } from "cn";

type InlineLoadingIndicatorProps = {
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function InlineLoadingIndicator({
  label,
  size = "md",
  className,
}: InlineLoadingIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground",
        className,
      )}
    >
      <Loader2Icon
        aria-hidden="true"
        className={cn(
          "animate-spin text-brand-teal",
          size === "sm" ? "size-3.5" : "size-4",
        )}
      />
      {label ? (
        <span className={size === "sm" ? "text-xs" : "text-sm"}>{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  );
}
