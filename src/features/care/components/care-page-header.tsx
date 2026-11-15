import type { ReactNode } from "react";
import { HeartHandshakeIcon } from "lucide-react";

import { cn } from "cn";

/**
 * Shared care-workspace hero. Mirrors the PageHeader contract so care pages can
 * adopt the portal language without changing their data flow.
 */
export function CarePageHeader({
  title,
  description,
  eyebrow = "Care operations",
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[2rem] bg-portal-mint p-4 sm:p-5",
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-portal-mint-strong">
          <HeartHandshakeIcon className="size-3.5" />
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
