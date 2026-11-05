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
    "Browse the CareBridge Academy catalogue. Enrol in published courses, track your progress and earn verifiable certificates.",
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
    body: "Complete all required lessons to earn a verifiable CareBridge Academy certificate.",
  },
] as const;

export const instant = false;

export default async function CoursesPage() {
  const { courses, unavailable } = await getPublishedCourses();

  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-sky px-3 py-1 text-xs font-medium text-brand-teal">
              <BookOpenIcon className="size-3.5" aria-hidden="true" />
              Academy catalogue
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight text-brand-strong sm:text-5xl">
              Courses for every stage of care work
              <span className="text-gradient-care block">
                Start where you are.
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Enrol in published {brand.name} Academy courses, work through the
              syllabus at your own pace and earn a verifiable certificate when
              you complete all required lessons.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Create an account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard/academy">Go to Academy</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {programmeFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/10"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
                >
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              </div>
            ))}
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
              <div
                key={course.id}
                className="flex flex-col rounded-xl bg-card shadow-card ring-1 ring-foreground/10"
              >
                <div className="flex-1 space-y-4 p-6">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <p className="font-heading text-lg font-semibold text-brand-strong">
                      {course.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
                <div className="flex items-center justify-between border-t px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    {course.priceMinorUnits === 0
                      ? "Free"
                      : `${course.currency} ${(course.priceMinorUnits / 100).toFixed(2)}`}
                  </p>
                  <Button asChild>
                    <Link href={`/courses/${course.slug}`}>View course</Link>
                  </Button>
                </div>
              </div>
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
              className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10"
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
            Scholarships are available through the CareBridge charity programme.
          </p>
        </div>
      </SiteSection>
    </>
  );
}
