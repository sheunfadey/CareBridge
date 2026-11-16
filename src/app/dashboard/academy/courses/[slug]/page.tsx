import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseEnrolmentCta } from "@/features/payments/components/course-enrolment-cta";
import { PortalSection } from "@/features/portal/components/portal-ui";
import { courseDifficultyLabels } from "@/lib/validation/academy";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getEnrolment,
  getPublishedCourseSyllabus,
} from "@/server/academy/queries";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseSyllabus(slug);
  return { title: course?.title ?? "Course" };
}

export default async function StudentCoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/academy/courses/${slug}`);
  }

  const course = await getPublishedCourseSyllabus(slug);
  if (!course) {
    notFound();
  }

  const enrolment = await getEnrolment(course.id, user.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-5">
      <PageHeader
        eyebrow="My Courses"
        title={course.title}
        description={course.summary ?? "Course details and syllabus."}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "My Courses", href: "/dashboard/academy/courses" },
          { label: course.title },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/dashboard/academy/courses">Back to My Courses</Link>
          </Button>
        }
      />

      <PortalSection>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 ring-1 ring-foreground/10">
          <div
            role="img"
            aria-label={course.title}
            className="relative h-36 bg-portal-sky bg-cover bg-center sm:h-48"
            style={
              course.coverImageUrl
                ? { backgroundImage: `url("${course.coverImageUrl}")` }
                : undefined
            }
          >
            <span className="absolute inset-0 bg-gradient-to-t from-brand-navy/50 via-brand-navy/5 to-transparent" />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {course.category ? (
                <Badge className="bg-white/90 text-brand-navy">
                  {course.category}
                </Badge>
              ) : null}
              <Badge className="bg-white/90 text-brand-navy">
                {courseDifficultyLabels[course.difficulty]}
              </Badge>
              {course.certificateEnabled ? (
                <Badge className="bg-white/90 text-brand-navy">
                  Certificate included
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-4" />
                {course.estimatedMinutes} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <LayersIcon className="size-4" />
                {course.moduleCount} module
                {course.moduleCount === 1 ? "" : "s"} · {course.totalLessons}{" "}
                lesson{course.totalLessons === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCapIcon className="size-4" />
                {course.providerName}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="size-4" />
                {course.scholarshipEligible
                  ? "Scholarship eligible"
                  : "Self-paced"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {enrolment ? (
                <Button className="rounded-full" asChild>
                  <Link href={`/dashboard/academy/learning/${course.id}`}>
                    {enrolment.status === "completed"
                      ? "Review in My Classroom"
                      : "Continue in My Classroom"}
                  </Link>
                </Button>
              ) : (
                <CourseEnrolmentCta
                  courseId={course.id}
                  priceMinorUnits={course.priceMinorUnits}
                  currency={course.currency}
                  isAuthenticated
                  returnTo={`/dashboard/academy/courses/${course.slug}`}
                />
              )}
            </div>

            {course.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            ) : null}
          </div>
        </div>
      </PortalSection>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Learning outcomes
          </h2>
          {course.learningOutcomes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No outcomes listed.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2 text-sm">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-portal-mint-strong" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Prerequisites
          </h2>
          {course.prerequisites.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No prerequisites.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {course.prerequisites.map((prerequisite) => (
                <li key={prerequisite} className="flex items-start gap-2 text-sm">
                  <BookOpenIcon className="mt-0.5 size-4 shrink-0 text-portal-sky-strong" />
                  <span>{prerequisite}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PortalSection delay={0.05}>
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Syllabus
          </h2>
          <div className="mt-3 space-y-3">
            {course.modules.map((module) => (
              <div
                key={module.id}
                className="rounded-xl bg-brand-navy/5 p-3"
              >
                <p className="text-sm font-medium text-brand-strong">
                  Module {module.position}: {module.title}
                </p>
                {module.summary ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {module.summary}
                  </p>
                ) : null}
                <ul className="mt-2 space-y-1">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
                    >
                      <span>
                        {lesson.position}. {lesson.title}
                      </span>
                      <span className="shrink-0">
                        {lesson.estimatedMinutes} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </PortalSection>
    </div>
  );
}
