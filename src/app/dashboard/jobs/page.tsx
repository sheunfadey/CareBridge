import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseIcon, MapPinIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDeadline, formatSalaryRange } from "@/lib/format";
import { employmentTypeLabels } from "@/lib/validation/employment";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import {
  getMyJobApplications,
  getPublishedJobs,
} from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Jobs",
};

export default async function JobsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/jobs");
  }

  const [{ jobs, unavailable }, myApplications] = await Promise.all([
    getPublishedJobs(),
    getMyJobApplications(user.id),
  ]);

  const canManage = userHasPermission(user, "job_manage");
  const appliedJobs = new Set(myApplications.map((application) => application.jobId));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employment"
        title="Careers in care"
        description="Explore verified care roles, apply with your CareBridge profile and follow every application in one place."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs" },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/jobs/applications">My applications</Link>
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href="/dashboard/jobs/manage">Manage postings</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {unavailable ? (
        <Card className="p-5 text-sm text-muted-foreground">
          Jobs are temporarily unavailable. Please try again shortly.
        </Card>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="No open roles yet"
          description="New care roles appear here as employers publish them. Check back soon."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="font-heading text-lg font-semibold text-brand-strong hover:text-brand-teal"
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {job.organisationName}
                  </p>
                </div>
                <StatusBadge status="published" label="Open" tone="success" />
              </div>

              {job.summary ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {job.summary}
                </p>
              ) : null}

              <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BriefcaseIcon className="size-3.5" />
                  <dt className="sr-only">Employment type</dt>
                  <dd>{employmentTypeLabels[job.employmentType]}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="size-3.5" />
                  <dt className="sr-only">Location</dt>
                  <dd>
                    {[job.city, job.state].filter(Boolean).join(", ") ||
                      job.workLocation ||
                      "Location not specified"}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-sm font-medium text-brand-strong">
                {formatSalaryRange(
                  job.salaryMinMinorUnits,
                  job.salaryMaxMinorUnits,
                  job.salaryCurrency,
                  job.isSalaryDisclosed,
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDeadline(job.applicationDeadline)}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button size="sm" asChild>
                  <Link href={`/dashboard/jobs/${job.id}`}>View role</Link>
                </Button>
                {appliedJobs.has(job.id) ? (
                  <Button size="sm" variant="outline" disabled>
                    Applied
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
