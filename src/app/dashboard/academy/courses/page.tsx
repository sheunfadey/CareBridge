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
  title: "All Courses",
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

  const enrolmentByCourse = new Map(
    learning.map((course) => [course.courseId, course]),
  );
  const active = learning.filter((course) => course.status === "active");
  const completed = learning.filter((course) => course.status === "completed");

  // Courses that are not in the public catalogue (for example an employer's
  // private training) still belong in "All courses" for the learner enrolled in
  // them.
  const catalogueIds = new Set(catalogue.courses.map((course) => course.id));
  const enrolledOutsideCatalogue = learning.filter(
    (course) => !catalogueIds.has(course.courseId),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Academy"
        title="All Courses"
        description="Every published course, with the ones you have joined tagged as enrolled."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "All Courses" },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/dashboard/academy/learning">Open My Progress</Link>
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
        <SectionHeading title="All courses" />
        {catalogue.unavailable && enrolledOutsideCatalogue.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              Courses are temporarily unavailable. Try again shortly.
            </p>
          </div>
        ) : catalogue.courses.length === 0 &&
          enrolledOutsideCatalogue.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
            <BookOpenCheckIcon className="mx-auto size-8 text-portal-mint-strong" />
            <p className="mt-2 font-heading font-semibold text-brand-strong">
              No published courses yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              New courses will appear here when they are published.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogue.courses.map((course) => {
              const enrolment = enrolmentByCourse.get(course.id);
              const isEnrolled = Boolean(enrolment);
              const isCompleted = enrolment?.status === "completed";

              return (
                <article
                  key={course.id}
                  className="group relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
                >
                  <Link
                    href={`/dashboard/academy/courses/${course.slug}`}
                    aria-label={`Open ${course.title}`}
                    tabIndex={-1}
                    className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-portal-sky/40">
                    {course.coverImageUrl ? (
                      <img
                        src={course.coverImageUrl}
                        alt={`${course.title} cover`}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-portal-sky-strong">
                        <BookOpenCheckIcon className="size-7" aria-hidden="true" />
                        <span className="text-[11px] font-medium">
                          Course image
                        </span>
                      </span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm">
                      {course.category ?? "Course"}
                    </span>
                    {isEnrolled ? (
                      <span className="absolute right-3 top-3 rounded-full bg-portal-mint px-2.5 py-1 text-[11px] font-semibold text-portal-mint-strong shadow-sm">
                        {isCompleted ? "Completed" : "Enrolled"}
                      </span>
                    ) : null}
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
                        <Link
                          href={
                            isEnrolled
                              ? `/dashboard/academy/learning/${course.id}`
                              : `/dashboard/academy/courses/${course.slug}`
                          }
                        >
                          {isEnrolled ? "Continue course" : "View course"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {enrolledOutsideCatalogue.map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index + catalogue.courses.length}
                badgeLabel="Enrolled"
              />
            ))}
          </div>
        )}
      </PortalSection>
    </div>
  );
}
