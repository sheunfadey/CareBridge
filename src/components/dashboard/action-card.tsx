"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type ActionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
};

export function ActionCard({
  title,
  description,
  icon: Icon,
  actionLabel = "Continue",
  onAction,
  disabled = false,
  className,
}: ActionCardProps) {
  const handleClick = () => {
    if (onAction) {
      onAction();
      return;
    }
    toast.info("This action is wired up in a later build phase.");
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition hover:ring-brand-teal/30",
        className,
      )}
    >
      <div className="space-y-2">
        {Icon ? (
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
          >
            <Icon className="size-5" />
          </span>
        ) : null}
        <p className="font-heading font-semibold text-brand-navy">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        className="self-start"
      >
        {actionLabel}
      </Button>
    </div>
  );
}
