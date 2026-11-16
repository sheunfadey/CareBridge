import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenCheckIcon,
  GraduationCapIcon,
  LayersIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AcademyCourseCard } from "@/features/academy/components/academy-course-card";
import {
  OverviewTile,
  PortalSection,
  SectionHeading,
} from "@/features/portal/components/portal-ui";
import { brand } from "@/config/brand";
import { getCurrentUser } from "@/server/auth/current-user";
import { getAcademyFacts, getMyLearning } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "Academy",
};

export default async function AcademyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy");
  }

  const [facts, learning] = await Promise.all([
    getAcademyFacts(user.id),
    getMyLearning(user.id),
  ]);

  const canManage = user.isSuperAdmin || user.permissions.has("course_manage");
  const active = learning.filter((course) => course.status === "active");
  const completed = learning.filter((course) => course.status === "completed");
  const lessonsCompleted = learning.reduce(
    (total, course) => total + course.completedLessons,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-5">
      <PortalSection>
        <div className="relative overflow-hidden rounded-[2rem] bg-portal-peach p-4 sm:p-6">
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-16 size-52 rounded-full border-[18px] border-white/25"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-20 right-24 size-44 rounded-full bg-white/15"
          />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b4a2c] dark:text-[#f3c6a6]">
              <GraduationCapIcon className="size-3.5" />
              {brand.name} Academy
            </span>
            <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-[-0.03em] text-brand-strong sm:text-3xl">
              Learn something new today
            </h1>
            <p className="mt-2 max-w-xl text-sm text-brand-navy/70 sm:text-base dark:text-foreground/70">
              Learn at your pace, track every lesson, and collect verifiable
              certificates when you complete a course.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                asChild
              >
                <Link href="/dashboard/academy/courses">
                  <BookOpenCheckIcon />
                  Browse catalogue
                </Link>
              </Button>
              {canManage ? (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full border-brand-navy/15 bg-white/60"
                    asChild
                  >
                    <Link href="/dashboard/academy/manage/categories">
                      Categories
                    </Link>
                  </Button>
                  <Button
                    className="rounded-full bg-white/70 text-brand-navy hover:bg-white"
                    asChild
                  >
                    <Link href="/dashboard/academy/manage">
                      <PlusIcon />
                      Manage courses
                    </Link>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </PortalSection>

      <PortalSection delay={0.05}>
        <SectionHeading
          title="Your learning"
          actionHref="/dashboard/academy/learning"
          actionLabel="View all"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <OverviewTile
            label="Active courses"
            value={facts.activeEnrolments}
            hint="In progress now"
            icon={<LayersIcon className="size-4.5" />}
            tone="lavender"
            index={0}
            href="/dashboard/academy/learning"
          />
          <OverviewTile
            label="Completed"
            value={facts.completedCourses}
            hint="Courses finished"
            icon={<GraduationCapIcon className="size-4.5" />}
            tone="mint"
            index={1}
            href="/dashboard/academy/learning?status=completed"
          />
          <OverviewTile
            label="Certificates"
            value={facts.certificates}
            hint="Valid and unrevoked"
            icon={<ShieldCheckIcon className="size-4.5" />}
            tone="sky"
            index={2}
            href="/dashboard/academy/certificates"
          />
          <OverviewTile
            label="Lessons done"
            value={lessonsCompleted}
            hint="Across all courses"
            icon={<BookOpenCheckIcon className="size-4.5" />}
            tone="peach"
            index={3}
            href="/dashboard/academy/learning"
          />
        </div>
      </PortalSection>

      <PortalSection delay={0.1}>
        <SectionHeading
          title="Continue learning"
          actionHref="/dashboard/academy/learning"
        />
        {active.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
            <SparklesIcon className="mx-auto size-9 text-portal-peach-strong" />
            <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
              Your next course is waiting
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Browse the catalogue and enrol in a published course to start
              building your learning history.
            </p>
            <Button className="mt-4 rounded-full" asChild>
              <Link href="/dashboard/academy/courses">Browse courses</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.slice(0, 4).map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index}
              />
            ))}
          </div>
        )}
      </PortalSection>

      {completed.length > 0 ? (
        <PortalSection delay={0.05}>
          <SectionHeading title="Completed courses" />
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.slice(0, 4).map((course, index) => (
              <AcademyCourseCard
                key={course.enrolmentId}
                course={course}
                index={index}
              />
            ))}
          </div>
        </PortalSection>
      ) : null}

      <PortalSection delay={0.05}>
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-brand-navy p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                <ShieldCheckIcon className="size-3.5" />
                Verifiable certificates
              </span>
              <p className="mt-3 font-heading text-xl font-semibold tracking-[-0.02em] text-white">
                Keep every achievement in one place
              </p>
              <p className="mt-1 text-sm text-white/70">
                Certificates issued by {brand.name} can be verified without
                signing in.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-xl bg-white text-brand-navy hover:bg-white/90"
                asChild
              >
                <Link href="/dashboard/academy/certificates">
                  My certificates
                </Link>
              </Button>
              <Button
                className="rounded-xl bg-white/10 text-white hover:bg-white/15"
                asChild
              >
                <Link href="/verify-certificate">Verify a certificate</Link>
              </Button>
            </div>
          </div>
        </div>
      </PortalSection>
    </div>
  );
}
