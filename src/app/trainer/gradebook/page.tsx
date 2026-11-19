import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  isTrainerAccount,
  getCurrentUser,
} from "@/server/auth/current-user";
import { getTrainerGradebook } from "@/server/trainer/queries";

export const metadata: Metadata = {
  title: "Gradebook",
};

function formatDate(value: string | null): string {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function TrainerGradebookPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/trainer/gradebook");
  }
  if (!isTrainerAccount(user)) {
    redirect("/dashboard");
  }

  const submissions = await getTrainerGradebook(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Trainer workspace"
        title="Gradebook"
        description="Assessment submissions across your courses, with learner scores and pass status."
        breadcrumbs={[
          { label: "Dashboard", href: "/trainer" },
          { label: "Gradebook" },
        ]}
        actions={
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/trainer/courses">Course Studio</Link>
          </Button>
        }
      />

      {submissions.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <ClipboardCheckIcon className="mx-auto size-9 text-portal-sky-strong" />
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            No submissions yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Learner assessment results will appear here once they submit.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 ring-1 ring-foreground/10">
          <div className="hidden grid-cols-[1.2fr_1.4fr_0.6fr_0.6fr_0.7fr] gap-3 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Learner</span>
            <span>Assessment</span>
            <span>Score</span>
            <span>Result</span>
            <span className="text-right">Submitted</span>
          </div>
          <ul className="divide-y divide-brand-navy/5">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/trainer/courses/${submission.courseId}/assessments/${submission.assessmentId}`}
                  className="grid gap-2 p-4 text-sm transition hover:bg-brand-navy/[0.03] lg:grid-cols-[1.2fr_1.4fr_0.6fr_0.6fr_0.7fr] lg:items-center lg:gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-strong">
                      {submission.learnerName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground lg:hidden">
                      {submission.courseTitle}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-brand-strong">
                      {submission.assessmentTitle}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {submission.courseTitle}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-brand-strong">
                    {submission.scorePercent === null
                      ? "—"
                      : `${submission.scorePercent}%`}
                  </span>
                  <span
                    className={
                      submission.passed === null
                        ? "text-xs text-muted-foreground"
                        : submission.passed
                          ? "text-xs font-semibold text-portal-mint-strong"
                          : "text-xs font-semibold text-brand-error"
                    }
                  >
                    {submission.passed === null
                      ? "Pending"
                      : submission.passed
                        ? "Passed"
                        : "Not passed"}
                  </span>
                  <span className="text-xs text-muted-foreground lg:text-right">
                    {formatDate(submission.submittedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
