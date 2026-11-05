"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold text-brand-strong">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
      {footer ? (
        <div className="text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  );
}

export function FormFieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <p className="text-xs font-medium text-brand-error" role="alert">
      {messages[0]}
    </p>
  );
}

export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-brand-error/20 bg-brand-error/5 text-brand-error",
    success: "border-brand-success/20 bg-brand-success/5 text-brand-success",
    info: "border-brand-teal/20 bg-brand-sky text-brand-strong",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone])}
    >
      {children}
    </div>
  );
}
