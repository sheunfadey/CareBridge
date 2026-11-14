"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { switchPortalAction } from "@/features/portal/actions";
import type { PortalMode } from "@/types/database";

const tileTones = {
  peach: {
    card: "bg-portal-peach",
    icon: "bg-white/55 text-portal-peach-strong",
    label: "text-[#7b4a2c] dark:text-[#f3c6a6]",
    hint: "text-[#8d634c] dark:text-[#d9b498]",
  },
  lavender: {
    card: "bg-portal-lavender",
    icon: "bg-white/55 text-portal-lavender-strong",
    label: "text-[#52458f] dark:text-[#c9bdf7]",
    hint: "text-[#71679f] dark:text-[#a99ed6]",
  },
  sky: {
    card: "bg-portal-sky",
    icon: "bg-white/55 text-portal-sky-strong",
    label: "text-[#2b6385] dark:text-[#a9d6ee]",
    hint: "text-[#537f99] dark:text-[#8bb4cb]",
  },
  mint: {
    card: "bg-portal-mint",
    icon: "bg-white/55 text-portal-mint-strong",
    label: "text-[#326946] dark:text-[#a8d8b7]",
    hint: "text-[#5c846a] dark:text-[#8bb59a]",
  },
} as const;

export type TileTone = keyof typeof tileTones;

export function WelcomeHero({
  name,
  email,
  avatarUrl,
  portal,
  subtitle,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  portal: PortalMode;
  subtitle: string;
}) {
  const reduceMotion = useReducedMotion();
  const initials = (name.trim() || email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const otherPortal: PortalMode = portal === "student" ? "caregiver" : "student";

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-14 shrink-0 shadow-sm" size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-brand-navy text-base font-semibold text-white">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="truncate font-heading text-2xl font-semibold tracking-[-0.02em] text-brand-strong sm:text-3xl">
            {name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <form action={switchPortalAction} className="shrink-0">
        <input type="hidden" name="portal" value={otherPortal} />
        <Button
          type="submit"
          variant="outline"
          className="w-full rounded-full border-brand-navy/15 bg-card/70 sm:w-auto"
        >
          Switch to {otherPortal === "student" ? "student" : "caregiver"} portal
          <ArrowUpRightIcon aria-hidden="true" />
        </Button>
      </form>
    </motion.header>
  );
}

export function PortalSection({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeading({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-brand-strong">
        {title}
      </h2>
      {actionHref ? (
        <Link
          href={actionHref}
          className="text-xs font-semibold text-brand-blue hover:underline"
        >
          {actionLabel ?? "View all"}
        </Link>
      ) : null}
    </div>
  );
}

export function OverviewTile({
  label,
  value,
  hint,
  icon,
  tone,
  index = 0,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  tone: TileTone;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const palette = tileTones[tone];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className={cn(
        "relative min-h-[135px] overflow-hidden rounded-[var(--radius-2xl)] p-4 shadow-[0_8px_24px_-18px_rgb(16_43_92/0.5)]",
        palette.card,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -right-6 -top-7 size-24 rounded-full border-[10px] border-white/25"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -right-1 size-20 rounded-full bg-white/15"
      />
      <span
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl",
          palette.icon,
        )}
      >
        {icon}
      </span>
      <p className={cn("relative mt-4 text-sm font-medium", palette.label)}>
        {label}
      </p>
      <p className="relative mt-0.5 font-heading text-2xl font-semibold tracking-[-0.03em] text-portal-ink">
        {value}
      </p>
      <p className={cn("relative mt-0.5 text-xs", palette.hint)}>{hint}</p>
    </motion.div>
  );
}

export function ProgressChart({
  points,
  label = "Progress performance",
}: {
  points: { key: string; label: string; lessons: number }[];
  label?: string;
}) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(...points.map((point) => point.lessons), 1);
  const hasData = points.some((point) => point.lessons > 0);

  return (
    <div className="rounded-[var(--radius-2xl)] border border-border/60 bg-card/80 p-4 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-[-0.01em] text-brand-strong">
            {label}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lessons completed over the last 6 months
          </p>
        </div>
        <span className="rounded-full bg-portal-peach/60 px-3 py-1 text-[11px] font-semibold text-[#7b4a2c] dark:text-[#f3c6a6]">
          Monthly
        </span>
      </div>

      {hasData ? (
        <div className="mt-5">
          <div className="relative flex h-36 items-end gap-2 sm:h-44 sm:gap-4">
            <span className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-brand-navy/10" />
            <span className="pointer-events-none absolute inset-x-0 top-2/4 border-t border-dashed border-brand-navy/10" />
            <span className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-brand-navy/10" />
            {points.map((point, index) => (
              <div
                key={point.key}
                className="relative flex h-full flex-1 items-end justify-center"
              >
                <motion.div
                  initial={reduceMotion ? false : { scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.08 * index,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    height:
                      point.lessons === 0
                        ? "0%"
                        : `${Math.max((point.lessons / max) * 100, 6)}%`,
                    transformOrigin: "bottom",
                  }}
                  className={cn(
                    "relative w-full max-w-10 rounded-t-xl",
                    index === points.length - 1
                      ? "bg-portal-peach-strong"
                      : "bg-portal-lavender-strong/75",
                  )}
                >
                  {point.lessons > 0 ? (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-brand-strong">
                      {point.lessons}
                    </span>
                  ) : null}
                </motion.div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 sm:gap-4">
            {points.map((point) => (
              <span
                key={point.key}
                className="flex-1 text-center text-[11px] font-medium text-muted-foreground"
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl bg-portal-lavender/35 px-4 py-8 text-center">
          <p className="text-sm font-medium text-brand-strong">
            Your progress will appear here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete a lesson to start building your learning history.
          </p>
        </div>
      )}
    </div>
  );
}

export function CourseCard({
  course,
}: {
  course: {
    courseId: string;
    title: string;
    summary: string | null;
    coverImageUrl: string | null;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
  };
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.4)] ring-1 ring-foreground/10"
    >
      <div
        role="img"
        aria-label={course.title}
        className="relative h-28 bg-portal-peach bg-cover bg-center sm:h-32"
        style={
          course.coverImageUrl
            ? { backgroundImage: `url("${course.coverImageUrl}")` }
            : undefined
        }
      >
        <span className="absolute inset-0 bg-gradient-to-t from-brand-navy/35 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy">
          {course.progressPercent}% complete
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold text-brand-strong">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {course.summary ?? "Continue where you left off."}
        </p>
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${course.progressPercent}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-portal-peach-strong"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {course.completedLessons} of {course.totalLessons} lessons
          </p>
        </div>
        <Button className="mt-4 w-full rounded-full" size="sm" asChild>
          <Link href={`/dashboard/academy/learning/${course.courseId}`}>
            Continue learning
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}
