import type { ReactNode } from "react";
import { SparklesIcon } from "lucide-react";

import { cn } from "cn";

const tones = {
  peach: "bg-portal-peach",
  lavender: "bg-portal-lavender",
  sky: "bg-portal-sky",
  mint: "bg-portal-mint",
  rose: "bg-portal-rose",
} as const;

const badgeTones = {
  peach: "text-[#7b4a2c]",
  lavender: "text-[#52458f]",
  sky: "text-[#2b6385]",
  mint: "text-[#326946]",
  rose: "text-[#a94f60]",
} as const;

/**
 * Shared hero for utility, account and communication pages.
 */
export function PortalPageHeader({
  title,
  description,
  eyebrow,
  actions,
  tone = "lavender",
  icon,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  tone?: keyof typeof tones;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[2rem] p-4 sm:p-5",
        tones[tone],
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
        {eyebrow ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
              badgeTones[tone],
            )}
          >
            {icon ?? <SparklesIcon className="size-3.5" />}
            {eyebrow}
          </span>
        ) : null}
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
