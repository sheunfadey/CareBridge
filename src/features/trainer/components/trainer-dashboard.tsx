import Link from "next/link";
import {
  AwardIcon,
  BookOpenCheckIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  LayersIcon,
  PlusIcon,
  PresentationIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  OverviewTile,
  PortalSection,
  SectionHeading,
} from "@/features/portal/components/portal-ui";
import type { TrainerDashboardData } from "@/server/trainer/queries";

function formatDate(value: string | null): string {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export function TrainerDashboard({
  user,
  data,
}: {
  user: { name: string };
  data: TrainerDashboardData;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <div className="relative overflow-hidden rounded-[2rem] bg-portal-lavender p-4 sm:p-5">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-14 size-44 rounded-full border-[14px] border-white/25"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-20 right-24 size-40 rounded-full bg-white/15"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#52458f]">
            <PresentationIcon className="size-3.5" />
            Trainer studio
          </span>
          <h1 className="mt-2.5 font-heading text-xl font-semibold tracking-[-0.03em] text-brand-strong sm:text-2xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-navy/70 dark:text-foreground/70">
            Build courses, set assessments, review learner performance and
            issue certificates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90" asChild>
              <Link href="/dashboard/academy/manage">
                <BookOpenCheckIcon />
                Open Course Studio
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-brand-navy/15 bg-white/60"
              asChild
            >
              <Link href="/dashboard/academy/manage/new">
                <PlusIcon />
                New course
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <PortalSection>
        <SectionHeading title="Teaching overview" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <OverviewTile
            label="Courses"
            value={data.courses.length}
            hint={`${data.publishedCourses} published`}
            icon={<LayersIcon className="size-4.5" />}
            tone="lavender"
            index={0}
            href="/dashboard/academy/manage"
          />
          <OverviewTile
            label="Learners"
            value={data.learnerCount}
            hint="Enrolled across courses"
            icon={<UsersIcon className="size-4.5" />}
            tone="mint"
            index={1}
            href="/trainer/learners"
          />
          <OverviewTile
            label="Assessments"
            value={data.assessmentCount}
            hint={`${data.submissionCount} recent submissions`}
            icon={<ClipboardCheckIcon className="size-4.5" />}
            tone="sky"
            index={2}
            href="/trainer/assessments"
          />
          <OverviewTile
            label="Certificates"
            value={data.certificateCount}
            hint="Issued to learners"
            icon={<AwardIcon className="size-4.5" />}
            tone="peach"
            index={3}
            href="/trainer/certificates"
          />
        </div>
      </PortalSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/academy/manage/new"
          className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 transition hover:ring-brand-navy/20"
        >
          <GraduationCapIcon className="size-5 text-portal-lavender-strong" />
          <p className="mt-2 text-sm font-semibold text-brand-strong">
            Create a course
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Build modules, lessons and resources.
          </p>
        </Link>
        <Link
          href="/trainer/gradebook"
          className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 transition hover:ring-brand-navy/20"
        >
          <ClipboardCheckIcon className="size-5 text-portal-sky-strong" />
          <p className="mt-2 text-sm font-semibold text-brand-strong">
            Gradebook
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Review assessment results and learner performance.
          </p>
        </Link>
        <Link
          href="/dashboard/academy/manage/categories"
          className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 transition hover:ring-brand-navy/20"
        >
          <LayersIcon className="size-5 text-portal-mint-strong" />
          <p className="mt-2 text-sm font-semibold text-brand-strong">
            Categories
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Organise the Academy catalogue.
          </p>
        </Link>
        <Link
          href="/dashboard/academy/manage"
          className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 transition hover:ring-brand-navy/20"
        >
          <PresentationIcon className="size-5 text-portal-peach-strong" />
          <p className="mt-2 text-sm font-semibold text-brand-strong">
            Course Studio
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage the full syllabus and assessments.
          </p>
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PortalSection delay={0.05}>
          <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
            <SectionHeading
              title="Recent submissions"
              actionHref="/trainer/gradebook"
            />
            {data.submissions.length === 0 ? (
              <p className="rounded-xl bg-brand-navy/5 px-4 py-6 text-center text-sm text-muted-foreground">
                No assessment submissions yet.
              </p>
            ) : (
              <ul className="divide-y divide-brand-navy/5">
                {data.submissions.slice(0, 5).map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/dashboard/academy/manage/${submission.courseId}/assessments/${submission.assessmentId}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-portal-sky text-portal-sky-strong">
                        <ClipboardCheckIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-strong">
                          {submission.learnerName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {submission.assessmentTitle} · {submission.courseTitle}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-brand-strong">
                          {submission.scorePercent === null
                            ? "—"
                            : `${submission.scorePercent}%`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PortalSection>

        <PortalSection delay={0.1}>
          <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
            <SectionHeading
              title="Your courses"
              actionHref="/dashboard/academy/manage"
            />
            {data.courses.length === 0 ? (
              <div className="rounded-xl bg-brand-navy/5 px-4 py-6 text-center">
                <p className="text-sm font-medium text-brand-strong">
                  No courses yet
                </p>
                <Button className="mt-3 rounded-full" size="sm" asChild>
                  <Link href="/dashboard/academy/manage/new">Create course</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-brand-navy/5">
                {data.courses.slice(0, 5).map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`/dashboard/academy/manage/${course.id}`}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-portal-lavender text-portal-lavender-strong">
                        <BookOpenCheckIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-brand-strong">
                          {course.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {course.enrolmentCount} learner
                          {course.enrolmentCount === 1 ? "" : "s"} ·{" "}
                          {course.moduleCount} module
                          {course.moduleCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <StatusBadge status={course.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PortalSection>
      </div>
    </div>
  );
}
