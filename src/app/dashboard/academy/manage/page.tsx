import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenCheckIcon,
  FileCogIcon,
  LayersIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  OverviewTile,
  PortalSection,
  SectionHeading,
} from "@/features/portal/components/portal-ui";
import { getCurrentUser } from "@/server/auth/current-user";
import { listManagedCourses } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "Manage courses",
};

export default async function ManageCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/manage");
  }

  const canCreate =
    user.isSuperAdmin || user.permissions.has("course_manage");
  const canManage =
    canCreate ||
    user.permissions.has("course_publish") ||
    user.permissions.has("learning_material_manage");

  if (!canManage) {
    redirect("/dashboard/academy");
  }

  const courses = await listManagedCourses(user);
  const published = courses.filter((course) => course.status === "published");
  const drafts = courses.filter((course) => course.status === "draft");
  const enrolments = courses.reduce(
    (total, course) => total + course.enrolmentCount,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-5">
      <PortalSection>
        <div className="relative overflow-hidden rounded-[2rem] bg-portal-lavender p-4 sm:p-6">
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-14 size-48 rounded-full border-[16px] border-white/25"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#52458f]">
              <FileCogIcon className="size-3.5" />
              Academy management
            </span>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-brand-strong">
              Course studio
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-navy/70 sm:text-base dark:text-foreground/70">
              Create courses, build modules and lessons, upload learning
              resources, and publish when the syllabus is ready.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {canCreate ? (
                <>
                  <Button
                    className="rounded-full bg-brand-navy text-white hover:bg-brand-navy/90"
                    asChild
                  >
                    <Link href="/dashboard/academy/manage/new">
                      <PlusIcon />
                      New course
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-brand-navy/15 bg-white/60"
                    asChild
                  >
                    <Link href="/dashboard/academy/manage/categories">
                      Categories
                    </Link>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </PortalSection>

      <PortalSection delay={0.05}>
        <SectionHeading title="At a glance" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <OverviewTile
            label="All courses"
            value={courses.length}
            hint="Across your workspaces"
            icon={<LayersIcon className="size-4.5" />}
            tone="lavender"
            index={0}
            href="#courses"
          />
          <OverviewTile
            label="Published"
            value={published.length}
            hint="Visible in the catalogue"
            icon={<BookOpenCheckIcon className="size-4.5" />}
            tone="mint"
            index={1}
            href="#courses"
          />
          <OverviewTile
            label="Drafts"
            value={drafts.length}
            hint="Still being built"
            icon={<FileCogIcon className="size-4.5" />}
            tone="peach"
            index={2}
            href="#courses"
          />
          <OverviewTile
            label="Enrolments"
            value={enrolments}
            hint="Across all courses"
            icon={<UsersIcon className="size-4.5" />}
            tone="sky"
            index={3}
            href="#courses"
          />
        </div>
      </PortalSection>

      <PortalSection delay={0.1} className="scroll-mt-24">
        <div id="courses" />
        <SectionHeading title="Courses" />
        {courses.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
            <FileCogIcon className="mx-auto size-9 text-portal-lavender-strong" />
            <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
              No courses yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Create your first course to build the syllabus.
            </p>
            {canCreate ? (
              <Button className="mt-4 rounded-full" asChild>
                <Link href="/dashboard/academy/manage/new">Create course</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="relative flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.4)] ring-1 ring-foreground/10"
              >
                <Link
                  href={`/dashboard/academy/manage/${course.id}`}
                  aria-label={`Open ${course.title}`}
                  tabIndex={-1}
                  className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div
                  role="img"
                  aria-label={course.title}
                  className="relative h-24 bg-portal-lavender bg-cover bg-center"
                  style={
                    course.coverImageUrl
                      ? { backgroundImage: `url("${course.coverImageUrl}")` }
                      : undefined
                  }
                >
                  <span className="absolute inset-0 bg-gradient-to-t from-brand-navy/45 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3">
                    <StatusBadge status={course.status} />
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy">
                    {course.categoryName ?? "No category"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <h2 className="line-clamp-2 font-heading text-base font-semibold text-brand-strong">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.programmeTitle} ·{" "}
                    {course.organisationName ?? "HillCrest platform"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-brand-navy/5 px-2 py-1 font-medium">
                      {course.moduleCount} module
                      {course.moduleCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-brand-navy/5 px-2 py-1 font-medium">
                      {course.enrolmentCount} enrolment
                      {course.enrolmentCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-brand-navy/5 px-2 py-1 font-medium capitalize">
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button className="w-full rounded-full" size="sm" asChild>
                      <Link href={`/dashboard/academy/manage/${course.id}`}>
                        Open course studio
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
