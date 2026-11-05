import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarClockIcon,
  MapPinIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApplyForm } from "@/features/employment/components/apply-form";
import { formatDate, formatDeadline, formatSalaryRange } from "@/lib/format";
import { employmentTypeLabels } from "@/lib/validation/employment";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getJobDetail,
  hasAppliedToJob,
} from "@/server/employment/queries";

type JobDetailPageProps = {
  params: Promise<{ jobId: string }>;
};

function ListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="font-heading text-base font-semibold text-brand-strong">
        {title}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getJobDetail(jobId);
  return { title: job ? job.title : "Job" };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/jobs/${jobId}`);
  }

  const job = await getJobDetail(jobId);
  if (!job) {
    notFound();
  }

  const alreadyApplied = await hasAppliedToJob(job.id, user.id);
  const deadlinePassed = job.applicationDeadline
    ? new Date(`${job.applicationDeadline}T23:59:59`) < new Date()
    : false;
  const notPublished = job.status !== "published";

  const disabledReason = notPublished
    ? "This role is not currently open for applications."
    : deadlinePassed
      ? "The application deadline for this role has passed."
      : null;

  const location =
    [job.city, job.state].filter(Boolean).join(", ") ||
    job.workLocation ||
    "Location not specified";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={job.organisationName}
        title={job.title}
        description={job.summary ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: job.title },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/jobs">Back to jobs</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BriefcaseIcon className="size-4" />
                {employmentTypeLabels[job.employmentType]}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <Building2Icon className="size-4" />
                {job.organisationName}
              </span>
              <span className="flex items-center gap-1">
                <CalendarClockIcon className="size-4" />
                {formatDeadline(job.applicationDeadline)}
              </span>
            </div>
            <p className="text-sm font-medium text-brand-strong">
              {formatSalaryRange(
                job.salaryMinMinorUnits,
                job.salaryMaxMinorUnits,
                job.salaryCurrency,
                job.isSalaryDisclosed,
              )}
            </p>
            {job.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            ) : null}
          </Card>

          <Card className="space-y-5 p-5">
            <ListSection title="Key duties" items={job.duties} />
            <ListSection title="Qualifications" items={job.qualifications} />
            <ListSection title="Skills" items={job.skills} />
            {job.experienceRequirements ? (
              <div>
                <h2 className="font-heading text-base font-semibold text-brand-strong">
                  Experience
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {job.experienceRequirements}
                </p>
              </div>
            ) : null}
            {job.shiftRequirements ? (
              <div>
                <h2 className="font-heading text-base font-semibold text-brand-strong">
                  Shift requirements
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {job.shiftRequirements}
                </p>
              </div>
            ) : null}
            {job.safeguardingRequirements ? (
              <div>
                <h2 className="font-heading text-base font-semibold text-brand-strong">
                  Safeguarding
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {job.safeguardingRequirements}
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                Apply
              </h2>
              <StatusBadge status={disabledReason ? "closed" : "open"} />
            </div>
            <p className="text-xs text-muted-foreground">
              Applications close {formatDate(job.applicationDeadline)}.
            </p>
            <ApplyForm
              kind="job"
              targetId={job.id}
              alreadyApplied={alreadyApplied}
              disabledReason={disabledReason}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
