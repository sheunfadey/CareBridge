import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { CourseEnrolmentCta } from "@/features/payments/components/course-enrolment-cta";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPublishedCourseSyllabus } from "@/server/academy/queries";
import { courseDifficultyLabels } from "@/lib/validation/academy";
import { brand } from "@/config/brand";

export const instant = false;

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  const course = await getPublishedCourseSyllabus(slug);

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: course.title,
    description: course.summary ?? "CareBridge Academy course",
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  await connection();
  const [course, user] = await Promise.all([
    getPublishedCourseSyllabus(slug),
    getCurrentUser(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {courseDifficultyLabels[course.difficulty]}
              </Badge>
              {course.scholarshipEligible ? (
                <Badge variant="secondary">Scholarship eligible</Badge>
              ) : null}
              {course.certificateEnabled ? (
                <Badge variant="secondary">Certificate included</Badge>
              ) : null}
            </div>
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
                {course.title}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                {course.summary}
              </p>
            </div>
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
            </div>
            <div className="flex flex-wrap gap-3">
              <CourseEnrolmentCta
                courseId={course.id}
                priceMinorUnits={course.priceMinorUnits}
                currency={course.currency}
                isAuthenticated={Boolean(user)}
                returnTo={`/courses/${course.slug}`}
              />
              <Button size="lg" variant="outline" asChild>
                <Link href="/courses">Back to catalogue</Link>
              </Button>
            </div>
          </div>
          <Card className="p-6">
            <p className="font-heading font-semibold text-brand-strong">
              What you get
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 text-brand-green" />
                <span>Self-paced learning in your CareBridge dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 text-brand-green" />
                <span>Track progress lesson by lesson</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 text-brand-green" />
                <span>Certificate issued on completion if enabled</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheckIcon className="mt-0.5 size-4 text-brand-teal" />
                <span>Verifiable certificate at {brand.name}/verify-certificate</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              {course.priceMinorUnits === 0
                ? "This course is free to enrol."
                : `${course.currency} ${(
                    course.priceMinorUnits / 100
                  ).toFixed(2)} fee applies. Payment is verified on the server before enrolment.`}
            </p>
          </Card>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Course overview"
          title="About this course"
          description="Learning outcomes and prerequisites."
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card className="p-6">
            <p className="font-heading font-semibold text-brand-strong">
              Description
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {course.description}
            </p>
          </Card>
          <div className="space-y-6">
            <Card className="p-6">
              <p className="font-heading font-semibold text-brand-strong">
                Learning outcomes
              </p>
              {course.learningOutcomes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No outcomes listed.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {course.learningOutcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-sm">
                      <CheckCircle2Icon className="mt-0.5 size-4 text-brand-green" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-6">
              <p className="font-heading font-semibold text-brand-strong">
                Prerequisites
              </p>
              {course.prerequisites.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No prerequisites.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {course.prerequisites.map((prerequisite) => (
                    <li key={prerequisite} className="flex items-start gap-2 text-sm">
                      <BookOpenIcon className="mt-0.5 size-4 text-brand-teal" />
                      <span>{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="Syllabus"
          title="Course content"
          description="Preview lessons are open to browse; full content unlocks after enrolment."
        />
        <div className="mt-8 space-y-4">
          {course.modules.map((module) => (
            <Card key={module.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    Module {module.position}: {module.title}
                  </p>
                  {module.summary ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {module.summary}
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline">
                  {module.lessons.length} lesson
                  {module.lessons.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <ul className="mt-4 divide-y rounded-lg border">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-brand-sky text-brand-teal">
                        {lesson.position}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-brand-strong">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                    {lesson.isPreview ? (
                      <Badge variant="secondary">Preview</Badge>
                    ) : (
                      <Badge variant="outline">Enrol to access</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <CourseEnrolmentCta
            courseId={course.id}
            priceMinorUnits={course.priceMinorUnits}
            currency={course.currency}
            isAuthenticated={Boolean(user)}
            returnTo={`/courses/${course.slug}`}
            label={
              course.priceMinorUnits > 0
                ? "Buy this course"
                : "Enrol in this course"
            }
          />
        </div>
      </SiteSection>
    </>
  );
}
