"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "cn";
import {
  AlertOctagonIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";

type AlertCardProps = {
  tone?: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

const toneConfig = {
  info: {
    icon: InfoIcon,
    wrapper: "border-brand-teal/20 bg-brand-sky",
    iconColor: "text-brand-teal",
  },
  success: {
    icon: CircleCheckIcon,
    wrapper: "border-brand-success/20 bg-brand-success/5",
    iconColor: "text-brand-success",
  },
  warning: {
    icon: TriangleAlertIcon,
    wrapper: "border-brand-warning/25 bg-brand-warning/5",
    iconColor: "text-brand-warning",
  },
  error: {
    icon: AlertOctagonIcon,
    wrapper: "border-brand-error/20 bg-brand-error/5",
    iconColor: "text-brand-error",
  },
} as const;

export function AlertCard({
  tone = "info",
  title,
  description,
  action,
  className,
}: AlertCardProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <Card className={cn("border p-4", config.wrapper, className)}>
      <div className="flex gap-3">
        <span
          className={cn("mt-0.5 shrink-0", config.iconColor)}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-brand-strong">
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </Card>
  );
}
