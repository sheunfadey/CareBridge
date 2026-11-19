"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { BookOpenIcon, GraduationCapIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MyLearningCourse } from "@/server/academy/queries";

export function AcademyCourseCard({
  course,
  index = 0,
  badgeLabel,
}: {
  course: MyLearningCourse;
  index?: number;
  /** Optional chip label, e.g. "Enrolled" when shown in the catalogue. */
  badgeLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const progress =
    course.totalLessons === 0
      ? course.status === "completed"
        ? 100
        : 0
      : Math.round((course.completedLessons * 100) / course.totalLessons);
  const completed = course.status === "completed";

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.4)] ring-1 ring-foreground/10"
    >
      <Link
        href={`/dashboard/academy/learning/${course.courseId}`}
        aria-label={`Open ${course.title}`}
        tabIndex={-1}
        className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-portal-lavender/50">
        {course.coverImageUrl ? (
          <>
            <img
              src={course.coverImageUrl}
              alt={`${course.title} cover`}
              loading="lazy"
              className="h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0 motion-reduce:transition-none"
            />
            <img
              src={course.coverImageUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 text-portal-lavender-strong">
            <BookOpenIcon className="size-7" aria-hidden="true" />
            <span className="text-[11px] font-medium">Course image</span>
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold capitalize text-brand-navy shadow-sm">
          {badgeLabel ?? (completed ? "Completed" : "In progress")}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm">
          {progress}%
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-heading text-base font-semibold text-brand-strong">
            {course.title}
          </h3>
          {completed && course.certificateId ? (
            <GraduationCapIcon className="mt-0.5 size-5 shrink-0 text-portal-mint-strong" />
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {course.summary ?? "Continue where you left off."}
        </p>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={
                completed
                  ? "h-full rounded-full bg-portal-mint-strong"
                  : "h-full rounded-full bg-portal-lavender-strong"
              }
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {course.completedLessons} of {course.totalLessons} lessons ·{" "}
            {course.estimatedMinutes} min course
          </p>
        </div>

        <div className="relative z-20 mt-auto flex flex-wrap gap-2 pt-4">
          <Button className="flex-1 rounded-full" size="sm" asChild>
            <Link href={`/dashboard/academy/learning/${course.courseId}`}>
              {completed ? "Review course" : "Continue learning"}
            </Link>
          </Button>
          {completed && course.certificateCode ? (
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link href={`/verify-certificate/${course.certificateCode}`}>
                <ShieldCheckIcon />
                Certificate
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
