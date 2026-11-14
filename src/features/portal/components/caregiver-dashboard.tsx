import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  GraduationCapIcon,
  MapPinIcon,
  MessagesSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  OverviewTile,
  PortalSection,
  SectionHeading,
  WelcomeHero,
} from "@/features/portal/components/portal-ui";
import type { CaregiverDashboardData } from "@/server/portal/queries";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function ShiftCard({
  shift,
  highlight = false,
}: {
  shift: CaregiverDashboardData["upcomingShifts"][number];
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "relative overflow-hidden rounded-[var(--radius-2xl)] bg-portal-sky p-4"
          : "flex items-center gap-3 rounded-2xl bg-card/80 p-3 ring-1 ring-foreground/10"
      }
    >
      {highlight ? (
        <>
          <span
            aria-hidden="true"
            className="absolute -right-8 -top-10 size-28 rounded-full border-[12px] border-white/25"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-portal-sky-strong">
                Today
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold text-brand-strong">
                {shift.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-navy/70">
                <MapPinIcon className="size-3.5" />
                {shift.facilityName}
              </p>
            </div>
            <span className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-semibold capitalize text-portal-sky-strong">
              {statusLabel(shift.status)}
            </span>
          </div>
          <p className="relative mt-4 flex items-center gap-2 font-heading text-xl font-semibold text-brand-strong">
            <CalendarClockIcon className="size-5 text-portal-sky-strong" />
            {formatTime(shift.startsAt)} – {formatTime(shift.endsAt)}
          </p>
        </>
      ) : (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-portal-mint text-portal-mint-strong">
            <CalendarDaysIcon className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-brand-strong">
              {shift.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {shift.facilityName} · {formatDay(shift.startsAt)}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {formatTime(shift.startsAt)}
          </span>
        </>
      )}
    </div>
  );
}

export function CaregiverDashboard({
  user,
  data,
  showWorkspaceOverview,
  canLogCare,
}: {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  data: CaregiverDashboardData;
  showWorkspaceOverview: boolean;
  canLogCare: boolean;
}) {
  const nextShift = data.todayShifts[0] ?? data.upcomingShifts[0] ?? null;
  const otherShifts = data.upcomingShifts.filter(
    (shift) => shift.id !== nextShift?.id,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-6">
      <WelcomeHero
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
        portal="caregiver"
        subtitle={
          data.todayShifts.length > 0
            ? `${data.todayShifts.length} shift${data.todayShifts.length === 1 ? "" : "s"} today`
            : "Your care work and training in one place"
        }
      />

      <PortalSection>
        <SectionHeading
          title="Overview"
          actionHref="/dashboard/care-homes"
          actionLabel="Open care workspace"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <OverviewTile
            label="Shifts this week"
            value={data.shiftsThisWeek}
            hint="Assigned to you"
            icon={<CalendarDaysIcon className="size-4.5" />}
            tone="sky"
            index={0}
          />
          <OverviewTile
            label="Active placements"
            value={data.activePlacements}
            hint="Current experience"
            icon={<UserCheckIcon className="size-4.5" />}
            tone="mint"
            index={1}
          />
          <OverviewTile
            label="Job applications"
            value={data.applicationCount}
            hint="Submitted"
            icon={<BriefcaseIcon className="size-4.5" />}
            tone="peach"
            index={2}
          />
          <OverviewTile
            label="Training"
            value={data.activeCourses}
            hint={`${data.certificates} certificates`}
            icon={<GraduationCapIcon className="size-4.5" />}
            tone="lavender"
            index={3}
          />
        </div>
      </PortalSection>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <PortalSection delay={0.05}>
          <SectionHeading title="Your schedule" actionHref="/dashboard/care-homes/roster" />
          <div className="space-y-3">
            {nextShift ? (
              <>
                <ShiftCard shift={nextShift} highlight />
                {otherShifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </>
            ) : (
              <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
                <CalendarDaysIcon className="mx-auto size-8 text-portal-sky-strong" />
                <p className="mt-3 font-heading text-base font-semibold text-brand-strong">
                  No shifts scheduled
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your roster will appear here once a manager assigns you.
                </p>
              </div>
            )}
          </div>
        </PortalSection>

        <PortalSection delay={0.1}>
          <SectionHeading
            title="Continue training"
            actionHref="/dashboard/academy/learning"
          />
          {data.training.length > 0 ? (
            <div className="space-y-3">
              {data.training.map((course) => {
                const percent =
                  course.totalLessons === 0
                    ? 100
                    : Math.round(
                        (course.completedLessons * 100) / course.totalLessons,
                      );
                return (
                  <div
                    key={course.enrolmentId}
                    className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-sm font-semibold text-brand-strong">
                          {course.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {course.completedLessons} of {course.totalLessons} lessons
                        </p>
                      </div>
                      <span className="rounded-full bg-portal-lavender px-2.5 py-1 text-[11px] font-semibold text-portal-lavender-strong">
                        {percent}%
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
                      <div
                        className="h-full rounded-full bg-portal-lavender-strong"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full rounded-full"
                      asChild
                    >
                      <Link href={`/dashboard/academy/learning/${course.courseId}`}>
                        Resume course
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10">
              <GraduationCapIcon className="mx-auto size-8 text-portal-lavender-strong" />
              <p className="mt-3 font-heading text-base font-semibold text-brand-strong">
                No active training
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your care skills current with a short course.
              </p>
              <Button className="mt-4 rounded-full" asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          )}
        </PortalSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PortalSection delay={0.05}>
          <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 sm:p-5">
            <SectionHeading
              title="Placement"
              actionHref="/dashboard/internships/placements"
            />
            {data.placement ? (
              <div className="rounded-2xl bg-portal-mint/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-portal-mint-strong">
                  {statusLabel(data.placement.status)}
                </p>
                <h3 className="mt-1 font-heading text-base font-semibold text-brand-strong">
                  {data.placement.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.placement.organisationName}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDay(data.placement.startDate)} –{" "}
                  {formatDay(data.placement.endDate)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-full bg-card/70"
                  asChild
                >
                  <Link
                    href={`/dashboard/internships/placements/${data.placement.id}`}
                  >
                    Open placement
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-portal-mint/30 px-4 py-6 text-center">
                <UserCheckIcon className="mx-auto size-7 text-portal-mint-strong" />
                <p className="mt-2 text-sm font-medium text-brand-strong">
                  No active placement
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Browse internships to gain verified experience.
                </p>
                <Button className="mt-3 rounded-full" size="sm" asChild>
                  <Link href="/dashboard/internships">Find a placement</Link>
                </Button>
              </div>
            )}
          </div>
        </PortalSection>

        <PortalSection delay={0.1}>
          <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 sm:p-5">
            <SectionHeading
              title="Applications"
              actionHref="/dashboard/jobs/applications"
            />
            {data.applications.length > 0 ? (
              <ul className="divide-y divide-brand-navy/5">
                {data.applications.slice(0, 3).map((application) => (
                  <li
                    key={application.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-portal-peach text-portal-peach-strong">
                      <BriefcaseIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-brand-strong">
                        {application.roleTitle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.organisationName}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-semibold capitalize text-brand-strong">
                      {statusLabel(application.status)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl bg-portal-peach/30 px-4 py-6 text-center">
                <BriefcaseIcon className="mx-auto size-7 text-portal-peach-strong" />
                <p className="mt-2 text-sm font-medium text-brand-strong">
                  No applications yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Explore verified care roles and apply in one place.
                </p>
                <Button className="mt-3 rounded-full" size="sm" asChild>
                  <Link href="/dashboard/jobs">Browse jobs</Link>
                </Button>
              </div>
            )}
          </div>
        </PortalSection>
      </div>

      <PortalSection delay={0.05}>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-brand-navy p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                <SparklesIcon className="size-3.5" />
                Quick actions
              </span>
              <p className="mt-3 font-heading text-xl font-semibold tracking-[-0.02em] text-white">
                Keep your care work moving
              </p>
              <p className="mt-1 text-sm text-white/70">
                Record care, check your roster, or talk to your team.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canLogCare ? (
                <Button
                  className="rounded-xl bg-white text-brand-navy hover:bg-white/90"
                  asChild
                >
                  <Link href="/dashboard/care-homes/care">
                    <ShieldCheckIcon />
                    Log care
                  </Link>
                </Button>
              ) : null}
              <Button
                className="rounded-xl bg-white/10 text-white hover:bg-white/15"
                asChild
              >
                <Link href="/dashboard/messages">
                  <MessagesSquareIcon />
                  Messages
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
