import type { ReactNode } from "react";

import { cn } from "cn";

import { FadeIn } from "@/components/site/hero-motion";

const tones = {
  peach: "from-portal-peach via-portal-cream to-portal-lavender",
  sky: "from-portal-sky via-portal-cream to-portal-lavender",
  mint: "from-portal-mint via-portal-cream to-portal-sky",
  lavender: "from-portal-lavender via-portal-cream to-portal-peach",
  rose: "from-portal-rose via-portal-cream to-portal-lavender",
} as const;

const accentText = {
  peach: "text-[#7b4a2c]",
  sky: "text-[#2b6385]",
  mint: "text-[#326946]",
  lavender: "text-[#52458f]",
  rose: "text-[#a94f60]",
} as const;

/**
 * Shared public marketing hero. Keeps every page on the same warm, rounded
 * surface as the refreshed home and course catalogue.
 */
export function SiteHero({
  eyebrow,
  title,
  highlight,
  description,
  actions,
  aside,
  tone = "peach",
  className,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br p-5 sm:p-8 lg:p-10 dark:from-brand-dark dark:via-brand-dark-surface dark:to-brand-navy",
        tones[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -right-20 -top-24 size-72 rounded-full border-[24px] border-white/30 dark:border-white/10"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/20 dark:bg-white/5"
      />

      <FadeIn
        className={cn(
          "relative grid gap-8",
          aside ? "lg:grid-cols-[1.05fr_0.95fr] lg:items-center" : "",
        )}
      >
        <div className="space-y-5">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm backdrop-blur-sm dark:bg-white/10 dark:shadow-none",
              accentText[tone],
              "dark:text-white/80",
            )}
          >
            {eyebrow}
          </span>
          <h1 className="font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-brand-strong sm:text-4xl lg:text-5xl">
            {title}
            {highlight ? (
              <span className="mt-1 block text-brand-navy/80 dark:text-white/85">
                {highlight}
              </span>
            ) : null}
          </h1>
          {description ? (
            <p className="max-w-xl text-base text-brand-navy/70 dark:text-foreground/75">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {aside ? <div className="space-y-3">{aside}</div> : null}
      </FadeIn>
    </div>
  );
}

/** Small white card used inside a hero's aside column or below it. */
export function SiteHeroCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-2xl)] bg-white/70 p-4 ring-1 ring-brand-navy/5 dark:bg-card/70">
      {icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-brand-navy dark:bg-white/10 dark:text-brand-strong">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="font-heading text-sm font-semibold text-brand-strong">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-brand-navy/65 dark:text-foreground/65">
          {body}
        </p>
      </div>
    </div>
  );
}
