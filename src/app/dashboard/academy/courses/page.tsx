import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenCheckIcon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AcademyCourseCard } from "@/features/academy/components/academy-course-card";
import { PortalSection, SectionHeading } from "@/features/portal/components/portal-ui";
import { courseDifficultyLabels } from "@/lib/validation/academy";
import { getCurrentUser } from "@/server/auth/current-user";
import { getMyLearning, getPublishedCourses } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "My Courses",
};

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/courses");
  }

  const [learning, catalogue] = await Promise.all([
    getMyLearning(user.id),
    getPublishedCourses(),
  ]);

  const enrolledIds = new Set(learning.map((course) => course.courseId));
  const active = learning.filter((course) => course.status === "active");
  const completed = learning.filter((course) => course.status === "completed");
  const available = catalogue.courses.filter(
    (course) => !enrolledIds.has(course.id),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Academy"
        title="My Courses"
        description="Your enrolled courses and every course available to you, all inside your student account."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "My Courses" },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/dashboard/academy/learning">Open My Classroom</Link>
          </Button>
        }
      />

      {active.length > 0 ? (
        <PortalSection>
          <SectionHeading
            title="Continue learning"
            actionHref="/dashboard/academy/learning"
            actionLabel="Open classroom"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index}
              />
            ))}
          </div>
        </PortalSection>
      ) : null}

      {completed.length > 0 ? (
        <PortalSection delay={0.05}>
          <SectionHeading title="Completed courses" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {completed.map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index}
              />
            ))}
          </div>
        </PortalSection>
      ) : null}

      <PortalSection delay={0.1}>
        <SectionHeading title="Available courses" />
        {catalogue.unavailable ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              Courses are temporarily unavailable. Try again shortly.
            </p>
          </div>
        ) : available.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
            <BookOpenCheckIcon className="mx-auto size-8 text-portal-mint-strong" />
            <p className="mt-2 font-heading font-semibold text-brand-strong">
              You are enrolled in every published course
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              New courses will appear here when they are published.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((course) => (
              <article
                key={course.id}
                className="relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <Link
                  href={`/dashboard/academy/courses/${course.slug}`}
                  aria-label={`Open ${course.title}`}
                  tabIndex={-1}
                  className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div
                  role="img"
                  aria-label={course.title}
                  className="relative h-24 bg-portal-sky bg-cover bg-center sm:h-28"
                  style={
                    course.coverImageUrl
                      ? { backgroundImage: `url("${course.coverImageUrl}")` }
                      : undefined
                  }
                >
                  <span className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy">
                    {course.category ?? "Course"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <h2 className="line-clamp-2 font-heading text-sm font-semibold text-brand-strong">
                    {course.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {course.summary ?? "Open the course to see the syllabus."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/5 px-2 py-1">
                      <ClockIcon className="size-3" />
                      {course.estimatedMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/5 px-2 py-1">
                      <LayersIcon className="size-3" />
                      {course.moduleCount} module
                      {course.moduleCount === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/5 px-2 py-1">
                      <GraduationCapIcon className="size-3" />
                      {courseDifficultyLabels[course.difficulty]}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {course.programmeTitle} · {course.providerName}
                  </p>
                  <div className="relative z-20 mt-auto pt-3">
                    <Button size="sm" className="w-full rounded-full" asChild>
                      <Link href={`/dashboard/academy/courses/${course.slug}`}>
                        View course
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </PortalSection>
    </div>
  );
}
