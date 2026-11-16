import Link from "next/link";
import {
  BookOpenCheckIcon,
  Clock3Icon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CourseCard,
  OverviewTile,
  PortalSection,
  ProgressChart,
  SectionHeading,
  WelcomeHero,
} from "@/features/portal/components/portal-ui";
import type { StudentDashboardData } from "@/server/portal/queries";

function formatLearningTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

export function StudentDashboard({
  user,
  data,
  showWorkspaceOverview,
}: {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  data: StudentDashboardData;
  showWorkspaceOverview: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-5">
      <WelcomeHero
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
        subtitle={
          data.activeCourses > 0
            ? `${data.activeCourses} active course${data.activeCourses === 1 ? "" : "s"} · keep going`
            : "Your learning journey starts here"
        }
      />

      <PortalSection>
        <SectionHeading
          title="Overview"
          actionHref="/dashboard/academy/learning"
          actionLabel="View all"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <OverviewTile
            label="Hours learned"
            value={formatLearningTime(data.minutesLearned)}
            hint="From completed lessons"
            icon={<Clock3Icon className="size-4.5" />}
            tone="peach"
            index={0}
            href="/dashboard/academy/learning"
          />
          <OverviewTile
            label="Lessons"
            value={data.lessonsCompleted}
            hint="Completed so far"
            icon={<BookOpenCheckIcon className="size-4.5" />}
            tone="lavender"
            index={1}
            href="/dashboard/academy/learning"
          />
          <OverviewTile
            label="Progress"
            value={`${data.averageProgress}%`}
            hint="Across active courses"
            icon={<TargetIcon className="size-4.5" />}
            tone="sky"
            index={2}
            href="/dashboard/academy/learning"
          />
          <OverviewTile
            label="Certificates"
            value={data.certificates}
            hint="Valid and unrevoked"
            icon={<ShieldCheckIcon className="size-4.5" />}
            tone="mint"
            index={3}
            href="/dashboard/academy/certificates"
          />
        </div>
      </PortalSection>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <PortalSection delay={0.05}>
            <ProgressChart points={data.progress} />
          </PortalSection>

          <PortalSection delay={0.1}>
            <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 sm:p-5">
              <SectionHeading title="Recent activity" />
              {data.recentLessons.length > 0 ? (
                <ul className="divide-y divide-brand-navy/5">
                  {data.recentLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/dashboard/academy/learning/${lesson.courseId}`}
                        className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-portal-mint text-portal-mint-strong">
                          <BookOpenCheckIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-brand-strong">
                            {lesson.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {lesson.courseTitle}
                          </p>
                        </div>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {new Intl.DateTimeFormat("en-NG", {
                            day: "numeric",
                            month: "short",
                            timeZone: "Africa/Lagos",
                          }).format(new Date(lesson.completedAt))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-portal-mint/35 px-4 py-6 text-center text-sm text-muted-foreground">
                  Your completed lessons will show here.
                </p>
              )}
            </div>
          </PortalSection>
        </div>

        <PortalSection delay={0.1}>
          <SectionHeading
            title="Continue learning"
            actionHref="/dashboard/academy/learning"
          />
          {data.courses.length > 0 ? (
            <div className="space-y-4">
              {data.courses.slice(0, 2).map((course) => (
                <CourseCard key={course.enrolmentId} course={course} />
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
              <SparklesIcon className="mx-auto size-8 text-portal-peach-strong" />
              <p className="mt-3 font-heading text-base font-semibold text-brand-strong">
                You have not enrolled yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse the Academy and start your first course.
              </p>
              <Button className="mt-4 rounded-full" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          )}
        </PortalSection>
      </div>

      <PortalSection delay={0.05}>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-brand-navy p-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                <SparklesIcon className="size-3.5" />
                Next steps
              </span>
              <p className="mt-3 font-heading text-xl font-semibold tracking-[-0.02em] text-white">
                Turn learning into experience
              </p>
              <p className="mt-1 text-sm text-white/70">
                Browse placements and jobs, or keep building your care skills.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-xl bg-white text-brand-navy hover:bg-white/90"
                asChild
              >
                <Link href="/dashboard/internships">
                  <HeartHandshakeIcon />
                  Internships
                </Link>
              </Button>
              <Button
                className="rounded-xl bg-white/10 text-white hover:bg-white/15"
                asChild
              >
                <Link href="/dashboard/jobs">
                  <GraduationCapIcon />
                  Jobs
                </Link>
              </Button>
            </div>
          </div>
          {showWorkspaceOverview ? (
            <Link
              href="/dashboard/overview"
              className="mt-4 inline-flex text-xs font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              Full workspace overview
            </Link>
          ) : null}
        </div>
      </PortalSection>
    </div>
  );
}
