import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  ClockIcon,
  LayersIcon,
  ListChecksIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { trainingProgrammes } from "@/config/site-content";
import { brand } from "@/config/brand";
import { getPublishedCourses } from "@/server/academy/queries";
import { courseDifficultyLabels } from "@/lib/validation/academy";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse the HillCrest Academy catalogue. Enrol in published courses, track your progress and earn verifiable certificates.",
};

const programmeFeatures = [
  {
    icon: LayersIcon,
    title: "Built from modules",
    body: "Every programme is organised into modules and lessons so you always know what comes next.",
  },
  {
    icon: ListChecksIcon,
    title: "Checked as you learn",
    body: "Work through lessons in order and track completion as you build your knowledge.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Finished with a certificate",
    body: "Complete all required lessons to earn a verifiable HillCrest Academy certificate.",
  },
] as const;

export const instant = false;

export default async function CoursesPage() {
  const { courses, unavailable } = await getPublishedCourses();

  return (
    <>
      <SiteSection className="relative overflow-hidden">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-portal-sky via-portal-cream to-portal-lavender p-5 sm:p-8 lg:p-10">
          <span
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-72 rounded-full border-[24px] border-white/30"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/20"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2b6385]">
                <BookOpenIcon className="size-3.5" aria-hidden="true" />
                Academy catalogue
              </span>
              <h1 className="font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-brand-strong sm:text-4xl lg:text-5xl">
                Courses for every stage of care work.
                <span className="mt-1 block text-brand-navy/80">
                  Start where you are.
                </span>
              </h1>
              <p className="max-w-xl text-base text-brand-navy/70 dark:text-foreground/70">
                Enrol in published {brand.name} Academy courses, work through the
                syllabus at your own pace and earn a verifiable certificate when
                you complete all required lessons.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                  asChild
                >
                  <Link href="/register">Create an account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-brand-navy/15 bg-white/60"
                  asChild
                >
                  <Link href="/dashboard/academy">Go to Academy</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {programmeFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-3 rounded-[var(--radius-2xl)] bg-white/70 p-4 ring-1 ring-brand-navy/5 dark:bg-card/70"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-brand-navy dark:bg-white/10 dark:text-brand-strong"
                  >
                    <feature.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-strong">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-navy/65 dark:text-foreground/65">
                      {feature.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Published courses"
          title="Available courses"
          description="Free, scholarship-eligible foundation training is available now. Each course shows its difficulty, duration and provider."
        />
        {unavailable ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Courses could not be loaded right now. Try again shortly.
          </p>
        ) : courses.length === 0 ? (
          <Card className="mt-8 p-6 text-center">
            <BookOpenIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 font-heading font-semibold text-brand-strong">
              No published courses yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon for new courses, or speak to a training provider.
            </p>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {courses.map((course) => (
              <article
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/85 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-portal-lavender/50">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={`${course.title} cover`}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-portal-lavender-strong">
                      <BookOpenIcon className="size-7" aria-hidden="true" />
                      <span className="text-[11px] font-medium">Course image</span>
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm">
                    {course.category ?? "Course"}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm">
                    {course.priceMinorUnits === 0
                      ? "Free"
                      : `${course.currency} ${(course.priceMinorUnits / 100).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex-1 space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      {courseDifficultyLabels[course.difficulty]}
                    </Badge>
                    {course.scholarshipEligible ? (
                      <Badge variant="secondary">Scholarship eligible</Badge>
                    ) : null}
                    {course.certificateEnabled ? (
                      <Badge variant="secondary">Certificate</Badge>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-heading text-base font-semibold text-brand-strong">
                      {course.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {course.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="size-3.5" />
                      {course.estimatedMinutes} min
                    </span>
                    <span className="flex items-center gap-1.5">
                      <LayersIcon className="size-3.5" />
                      {course.moduleCount} module
                      {course.moduleCount === 1 ? "" : "s"}
                    </span>
                    <span>{course.providerName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm font-medium text-brand-strong">
                    {course.priceMinorUnits === 0
                      ? "Free to enrol"
                      : `${course.currency} ${(course.priceMinorUnits / 100).toFixed(2)}`}
                  </p>
                  <Button size="sm" className="rounded-full" asChild>
                    <Link href={`/courses/${course.slug}`}>View course</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SiteSection>

      <SiteSection>
        <SectionHeading
          eyebrow="Programme categories"
          title="Pathways we cover"
          description="These are the broad care pathways supported by the platform. Enrol in a specific published course to begin learning."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trainingProgrammes.map((programme) => (
            <div
              key={programme.title}
              className="rounded-[var(--radius-2xl)] bg-card/85 p-6 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
              >
                <BookOpenIcon className="size-5" />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold text-brand-strong">
                {programme.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {programme.summary}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {programme.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-full bg-brand-sky px-2.5 py-1 text-xs font-medium text-brand-teal"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection tone="sky">
        <SectionHeading
          eyebrow="Choosing a programme"
          title="Not sure where to begin?"
          description="Foundation training covers the core principles of care and is the usual starting point. Specialist programmes build on that foundation, and your placement is matched to the stage you have reached."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/caregiver-training">Caregiver training overview</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/internships">Internship opportunities</Link>
          </Button>
        </div>
      </SiteSection>

      <SiteSection>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <SectionHeading
            align="center"
            eyebrow="Enrol"
            title="Choose a programme and begin"
            description="Create an account to enrol in a programme, work through the modules at your own pace and record your progress as you go."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create an account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/caregiver-training">About the training pathway</Link>
            </Button>
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <SparklesIcon className="size-4 text-brand-green" aria-hidden="true" />
            Scholarships are available through the HillCrest charity programme.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
