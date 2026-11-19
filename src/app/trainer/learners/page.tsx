import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  isTrainerAccount,
  getCurrentUser,
} from "@/server/auth/current-user";
import { getTrainerLearners } from "@/server/trainer/queries";

export const metadata: Metadata = { title: "Learners" };

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function TrainerLearnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/trainer/learners");
  if (!isTrainerAccount(user)) redirect("/dashboard");

  const learners = await getTrainerLearners(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Trainer workspace"
        title="Learners"
        description="Everyone enrolled across your courses, with progress and completion status."
        breadcrumbs={[
          { label: "Dashboard", href: "/trainer" },
          { label: "Learners" },
        ]}
        actions={
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/trainer/courses">Course Studio</Link>
          </Button>
        }
      />

      {learners.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <UsersIcon className="mx-auto size-9 text-portal-mint-strong" />
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            No learners yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Learners appear here once they enrol in one of your courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {learners.map((learner) => {
            const initials = learner.learnerName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("");
            return (
              <article
                key={learner.enrolmentId}
                className="flex flex-col rounded-[var(--radius-2xl)] bg-card/90 p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-portal-mint text-xs font-semibold text-portal-mint-strong">
                    {initials || "L"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-semibold text-brand-strong">
                      {learner.learnerName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {learner.learnerEmail}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-navy/5 px-2 py-1 text-[10px] font-semibold capitalize text-brand-strong">
                    {learner.status}
                  </span>
                </div>
                <p className="mt-3 truncate text-sm font-medium text-brand-strong">
                  {learner.courseTitle}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-navy/10">
                  <div
                    className="h-full rounded-full bg-portal-mint-strong"
                    style={{ width: `${learner.progressPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {learner.completedLessons}/{learner.totalLessons} lessons
                  </span>
                  <span>{learner.progressPercent}%</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="text-[11px] text-muted-foreground">
                    Enrolled {formatDate(learner.enrolledAt)}
                  </span>
                  {learner.certificateCode ? (
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <Link
                        href={`/verify-certificate/${learner.certificateCode}`}
                      >
                        Certificate
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
