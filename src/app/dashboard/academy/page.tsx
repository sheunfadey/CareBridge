import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenIcon,
  GraduationCapIcon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/server/auth/current-user";
import { getAcademyFacts, getMyLearning } from "@/server/academy/queries";
import { brand } from "@/config/brand";

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

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="HillCrest Academy"
        description="Learn at your pace, track progress across courses and collect verifiable certificates when you complete them."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy" },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/courses">Browse catalogue</Link>
            </Button>
            {canManage ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/academy/manage/categories">
                    Categories
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard/academy/manage">
                    <PlusIcon />
                    Manage courses
                  </Link>
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <section
        aria-label="Your learning overview"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <MetricCard
          label="Active enrolments"
          value={facts.activeEnrolments}
          hint="In progress now"
          href="/dashboard/academy/learning"
        />
        <MetricCard
          label="Completed"
          value={facts.completedCourses}
          hint="Courses finished"
          href="/dashboard/academy/learning"
        />
        <MetricCard
          label="Certificates"
          value={facts.certificates}
          hint="Valid, unrevoked"
          href="/dashboard/academy/certificates"
        />
        <Card className="p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Catalogue
          </p>
          <p className="mt-2 flex items-center gap-2 font-heading text-base font-semibold sm:text-lg text-brand-strong">
            <GraduationCapIcon className="size-5" />
            Browse courses
          </p>
          <Button
            variant="link"
            className="mt-1 h-auto whitespace-normal px-0 text-left"
            asChild
          >
            <Link href="/courses">View published courses</Link>
          </Button>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Continue learning
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/academy/learning">View all</Link>
          </Button>
        </div>
        {active.length === 0 ? (
          <Card className="p-4 text-center">
            <BookOpenIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 font-heading font-semibold text-brand-strong">
              No courses in progress
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the catalogue and enrol to start learning.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {active.slice(0, 4).map((course) => {
              const progress = course.totalLessons
                ? Math.round(
                    (course.completedLessons / course.totalLessons) * 100,
                  )
                : 0;
              return (
                <Card key={course.enrolmentId} className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading font-semibold text-brand-strong">
                        {course.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {course.summary}
                      </p>
                    </div>
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {course.completedLessons} / {course.totalLessons} lessons
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-brand-teal transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <Button className="mt-4" asChild>
                    <Link href={`/dashboard/academy/learning/${course.courseId}`}>
                      Continue
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {completed.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Completed courses
            </h2>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {completed.slice(0, 4).map((course) => (
              <Card key={course.enrolmentId} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-semibold text-brand-strong">
                      {course.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.certificateEnabled
                        ? "Certificate available"
                        : "Completed"}
                    </p>
                  </div>
                  <StatusBadge status="completed" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/academy/learning/${course.courseId}`}>
                      Review course
                    </Link>
                  </Button>
                  {course.certificateId && course.certificateCode ? (
                    <Button variant="outline" asChild>
                      <Link href={`/verify-certificate/${course.certificateCode}`}>
                        <ShieldCheckIcon />
                        Verify certificate
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Certificates issued by {brand.name} are verifiable at{" "}
        <Link href="/verify-certificate" className="underline">
          /verify-certificate
        </Link>
        .
      </p>
    </div>
  );
}
