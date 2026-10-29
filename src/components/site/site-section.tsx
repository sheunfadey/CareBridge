import type { ReactNode } from "react";

import { cn } from "cn";

export function SiteSection({
  children,
  className,
  tone = "default",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "ivory" | "sky" | "navy";
  id?: string;
}) {
  const toneClass = {
    default: "bg-background",
    ivory: "surface-ivory",
    sky: "bg-gradient-to-br from-brand-sky/70 via-white to-brand-ivory",
    navy: "bg-brand-navy text-white",
  }[tone];

  return (
    <section id={id} className={cn(toneClass, className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "onDark";
}) {
  const isDark = tone === "onDark";
  return (
    <div
      className={cn(
        "max-w-2xl space-y-3",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isDark ? "text-brand-teal" : "text-brand-teal",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-heading text-3xl font-semibold leading-tight sm:text-4xl",
          isDark ? "text-white" : "text-brand-navy",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-base",
            isDark ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
