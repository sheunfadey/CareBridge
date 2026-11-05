import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { JobApplicationStatusSelect } from "@/features/employment/components/status-actions";
import {
  InterviewOutcomeForm,
  JobOfferForm,
  ScheduleInterviewForm,
  WithdrawOfferButton,
} from "@/features/employment/components/recruitment-forms";
import { formatDate, formatMoney } from "@/lib/format";
import { applicationStatusLabels } from "@/lib/validation/employment";
import {
  interviewModeLabels,
  interviewStatusLabels,
} from "@/lib/validation/placement";
import { getCurrentUser } from "@/server/auth/current-user";
import { getJobApplicationWorkspace } from "@/server/employment/workspace-queries";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  const { applicationId } = await params;
  if (!user) return { title: "Candidate" };
  const workspace = await getJobApplicationWorkspace(user, applicationId);
  return { title: workspace ? workspace.application.applicantName : "Candidate" };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function JobCandidatePage({ params }: PageProps) {
  const { applicationId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?redirectTo=/dashboard/jobs/manage/applications/${applicationId}`,
    );
  }

  const workspace = await getJobApplicationWorkspace(user, applicationId);
  if (!workspace) notFound();
  if (!workspace.canManage) {
    redirect(`/dashboard/jobs/manage/${workspace.job.id}`);
  }

  const { application, job, interviews, offer } = workspace;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Candidate"
        title={application.applicantName}
        description={`${job.title} · ${job.organisationName}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Manage", href: "/dashboard/jobs/manage" },
          { label: job.title, href: `/dashboard/jobs/manage/${job.id}` },
          { label: application.applicantName },
        ]}
        actions={
          <>
            <JobApplicationStatusSelect
              applicationId={application.id}
              current={application.status}
            />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/jobs/manage/${job.id}`}>
                Back to applicants
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2 p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Application
            </h2>
            <StatusBadge
              status={application.status}
              label={applicationStatusLabels[application.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Applied {formatDate(application.submittedAt.slice(0, 10))} ·{" "}
            {job.employmentType.replaceAll("_", " ")}
          </p>
          {application.coverLetter ? (
            <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {application.coverLetter}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No cover letter provided.
            </p>
          )}
        </Card>
        <Card className="space-y-2 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Contact
          </h2>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailIcon className="size-4" aria-hidden="true" />
            {application.applicantEmail}
          </p>
          {application.applicantPhone ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PhoneIcon className="size-4" aria-hidden="true" />
              {application.applicantPhone}
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {[application.applicantCity, application.applicantState]
              .filter(Boolean)
              .join(", ") || "Location not provided"}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/jobs/${job.id}`}>View job posting</Link>
          </Button>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClockIcon className="size-4 text-brand-teal" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Interviews
          </h2>
          <span className="text-xs text-muted-foreground">
            {interviews.length} scheduled
          </span>
        </div>

        <Card className="p-4">
          <h3 className="mb-3 font-heading text-sm font-semibold text-brand-strong">
            Schedule an interview
          </h3>
          <ScheduleInterviewForm
            applicationId={application.id}
            applicationType="job"
          />
        </Card>

        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No interviews scheduled yet.
          </p>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <Card key={interview.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-heading text-sm font-semibold text-brand-strong">
                      {formatDateTime(interview.scheduledAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interviewModeLabels[interview.mode]} ·{" "}
                      {interview.durationMinutes} minutes
                      {interview.location ? ` · ${interview.location}` : ""}
                    </p>
                    {interview.meetingLink ? (
                      <a
                        href={interview.meetingLink}
                        className="text-xs text-brand-teal underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join meeting
                      </a>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={interview.status}
                      label={interviewStatusLabels[interview.status]}
                    />
                    {interview.rating ? (
                      <span className="text-xs text-muted-foreground">
                        {interview.rating}/5
                      </span>
                    ) : null}
                  </div>
                </div>
                {interview.feedback ? (
                  <p className="mt-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                    {interview.feedback}
                  </p>
                ) : null}
                <InterviewOutcomeForm
                  interviewId={interview.id}
                  currentStatus={interview.status}
                />
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          Offer
        </h2>
        {offer ? (
          <Card className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-heading text-sm font-semibold text-brand-strong">
                {offer.employmentType.replaceAll("_", " ")} offer
              </p>
              <StatusBadge status={offer.status} />
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Salary</dt>
                <dd>{formatMoney(offer.salaryMinorUnits, offer.salaryCurrency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Start date</dt>
                <dd>{formatDate(offer.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Respond by</dt>
                <dd>
                  {offer.expiresAt ? formatDateTime(offer.expiresAt) : "No deadline"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sent</dt>
                <dd>{formatDate(offer.createdAt.slice(0, 10))}</dd>
              </div>
            </dl>
            {offer.notes ? (
              <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {offer.notes}
              </p>
            ) : null}
            {offer.status === "sent" ? (
              <WithdrawOfferButton offerId={offer.id} offerType="job" />
            ) : null}
          </Card>
        ) : (
          <Card className="p-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-brand-strong">
              Send an offer
            </h3>
            <JobOfferForm
              applicationId={application.id}
              defaultEmploymentType={
                job.employmentType as
                  | "full_time"
                  | "part_time"
                  | "temporary"
                  | "contract"
                  | "internship"
              }
            />
          </Card>
        )}
      </section>
    </div>
  );
}
