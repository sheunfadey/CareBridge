import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  JobApplicationStatusSelect,
  JobStatusSelect,
} from "@/features/employment/components/status-actions";
import { formatDate } from "@/lib/format";
import { employmentTypeLabels } from "@/lib/validation/employment";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import {
  getJobApplicants,
  getJobDetail,
} from "@/server/employment/queries";

type ManageJobPageProps = {
  params: Promise<{ jobId: string }>;
};

export async function generateMetadata({
  params,
}: ManageJobPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobDetail(jobId);
  return { title: job ? `Review: ${job.title}` : "Review job" };
}

export default async function ManageJobPage({ params }: ManageJobPageProps) {
  const { jobId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/jobs/manage/${jobId}`);
  }
  if (!userHasPermission(user, "job_manage")) {
    redirect("/dashboard/jobs");
  }

  const job = await getJobDetail(jobId);
  if (!job) {
    notFound();
  }

  const { applicants } = await getJobApplicants(job.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employment"
        title={job.title}
        description={`${employmentTypeLabels[job.employmentType]} · ${
          [job.city, job.state].filter(Boolean).join(", ") ||
          "Location not set"
        }`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Manage", href: "/dashboard/jobs/manage" },
          { label: job.title },
        ]}
        actions={
          <>
            <JobStatusSelect jobId={job.id} current={job.status} />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/jobs/${job.id}`}>View public page</Link>
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-brand-navy">
            Applicants
          </h2>
          <span className="text-xs text-muted-foreground">
            {applicants.length} total
          </span>
        </div>

        {applicants.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            compact
            title="No applicants yet"
            description="Share the role or publish it to start receiving applications."
          />
        ) : (
          <div className="space-y-3">
            {applicants.map((applicant) => (
              <Card key={applicant.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/dashboard/jobs/manage/applications/${applicant.id}`}
                      className="font-heading font-semibold text-brand-navy hover:text-brand-teal"
                    >
                      {applicant.applicantName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {applicant.applicantEmail}
                      {applicant.applicantPhone
                        ? ` · ${applicant.applicantPhone}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[applicant.applicantCity, applicant.applicantState]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}{" "}
                      · Applied{" "}
                      {formatDate(applicant.submittedAt.slice(0, 10))}
                    </p>
                    {applicant.coverLetter ? (
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {applicant.coverLetter}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <JobApplicationStatusSelect
                      applicationId={applicant.id}
                      current={applicant.status}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/jobs/manage/applications/${applicant.id}`}
                      >
                        Open candidate
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
