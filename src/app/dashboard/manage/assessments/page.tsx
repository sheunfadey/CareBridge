import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCurrentUser,
  userHasPermission,
} from "@/server/auth/current-user";
import { getTrainerAssessments } from "@/server/trainer/queries";

export const metadata: Metadata = { title: "Assessments" };

export default async function OrganisationAssessmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/dashboard/manage/assessments");
  if (
    !userHasPermission(user, "assessment_manage") &&
    !userHasPermission(user, "course_manage") &&
    !userHasPermission(user, "course_publish")
  ) {
    redirect("/dashboard");
  }

  const assessments = await getTrainerAssessments(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Organisation admin"
        title="Assessments"
        description="Tests and exams across your organisation's courses, with pass marks, question counts and submissions."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments" },
        ]}
        actions={
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/dashboard/academy/manage">Course Studio</Link>
          </Button>
        }
      />

      {assessments.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <ClipboardCheckIcon className="mx-auto size-9 text-portal-sky-strong" />
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            No assessments yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a course in Course Studio to create its first assessment.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 ring-1 ring-foreground/10">
          <ul className="divide-y divide-brand-navy/5">
            {assessments.map((assessment) => (
              <li key={assessment.id}>
                <Link
                  href={`/dashboard/academy/manage/${assessment.courseId}/assessments/${assessment.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-brand-navy/[0.03]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-brand-strong">
                        {assessment.title}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {assessment.kind}
                      </Badge>
                      <StatusBadge status={assessment.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assessment.courseTitle} · {assessment.questionCount}{" "}
                      question{assessment.questionCount === 1 ? "" : "s"} · pass{" "}
                      {assessment.passMarkPercent}% · {assessment.maxAttempts}{" "}
                      attempt{assessment.maxAttempts === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-strong">
                      {assessment.attemptCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      submission{assessment.attemptCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
