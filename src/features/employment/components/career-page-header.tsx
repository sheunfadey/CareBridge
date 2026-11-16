import type { ReactNode } from "react";
import { BriefcaseIcon, GraduationCapIcon } from "lucide-react";

import { cn } from "cn";

const tones = {
  peach: {
    panel: "bg-portal-peach",
    badge: "bg-white/80 text-[#7b4a2c]",
  },
  lavender: {
    panel: "bg-portal-lavender",
    badge: "bg-white/80 text-[#52458f]",
  },
  sky: {
    panel: "bg-portal-sky",
    badge: "bg-white/80 text-[#2b6385]",
  },
} as const;

/**
 * Shared hero for jobs, internships and placements. Mirrors PageHeader's
 * contract so pages can adopt the portal language without changing data flow.
 */
export function CareerPageHeader({
  title,
  description,
  eyebrow = "Career",
  icon = "briefcase",
  tone = "peach",
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: "briefcase" | "graduation";
  tone?: keyof typeof tones;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  className?: string;
}) {
  const palette = tones[tone];
  const Icon = icon === "graduation" ? GraduationCapIcon : BriefcaseIcon;

  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[2rem] p-4 sm:p-5",
        palette.panel,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -right-10 -top-14 size-44 rounded-full border-[14px] border-white/25"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-20 right-24 size-40 rounded-full bg-white/15"
      />
      <div className="relative">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
            palette.badge,
          )}
        >
          <Icon className="size-3.5" />
          {eyebrow}
        </span>
        <h1 className="mt-3 font-heading text-xl font-semibold tracking-[-0.03em] text-brand-strong sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-brand-navy/70 sm:text-base dark:text-foreground/70">
            {description}
          </p>
        ) : null}
        {actions ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
