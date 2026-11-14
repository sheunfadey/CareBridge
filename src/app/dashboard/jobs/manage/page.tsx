import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobStatusSelect } from "@/features/employment/components/status-actions";
import { formatDate } from "@/lib/format";
import { employmentTypeLabels } from "@/lib/validation/employment";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { getManagedJobs } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Manage job postings",
};

export default async function ManageJobsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/jobs/manage");
  }
  if (!userHasPermission(user, "job_manage")) {
    redirect("/dashboard/jobs");
  }

  const jobs = await getManagedJobs(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader
        eyebrow="Employment"
        title="Manage job postings"
        description="Create roles, publish them to the marketplace and review applicants."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Manage" },
        ]}
        actions={
          <Button asChild>
            <Link href="/dashboard/jobs/manage/new">
              <PlusIcon />
              New job
            </Link>
          </Button>
        }
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={PlusIcon}
          title="No job postings yet"
          description="Create your first role. It is saved as a draft until you publish it."
          action={
            <Button asChild>
              <Link href="/dashboard/jobs/manage/new">Create a job</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/jobs/manage/${job.id}`}
                  className="font-heading font-semibold text-brand-strong hover:text-brand-teal"
                >
                  {job.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {employmentTypeLabels[job.employmentType]} ·{" "}
                  {[job.city, job.state].filter(Boolean).join(", ") ||
                    "Location not set"}{" "}
                  ·{" "}
                  {job.applicationDeadline
                    ? `Closes ${formatDate(job.applicationDeadline)}`
                    : "Open until filled"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {job.applicantCount} applicant
                  {job.applicantCount === 1 ? "" : "s"}
                </span>
                <JobStatusSelect jobId={job.id} current={job.status} />
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/jobs/manage/${job.id}`}>
                    Review
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
