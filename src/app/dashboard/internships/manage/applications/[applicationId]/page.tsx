import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";

import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InternshipApplicationStatusSelect } from "@/features/employment/components/status-actions";
import {
  InterviewOutcomeForm,
  InternshipOfferForm,
  ScheduleInterviewForm,
  WithdrawOfferButton,
} from "@/features/employment/components/recruitment-forms";
import { CreatePlacementForm } from "@/features/employment/components/placement-forms";
import { formatDate } from "@/lib/format";
import { internshipApplicationStatusLabels } from "@/lib/validation/employment";
import {
  interviewModeLabels,
  interviewStatusLabels,
} from "@/lib/validation/placement";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getInternshipApplicationWorkspace,
  getPlacementSupervisorOptions,
} from "@/server/employment/workspace-queries";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  const { applicationId } = await params;
  if (!user) return { title: "Candidate" };
  const workspace = await getInternshipApplicationWorkspace(user, applicationId);
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

export default async function InternshipCandidatePage({ params }: PageProps) {
  const { applicationId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?redirectTo=/dashboard/internships/manage/applications/${applicationId}`,
    );
  }

  const workspace = await getInternshipApplicationWorkspace(user, applicationId);
  if (!workspace) notFound();
  if (!workspace.canManage) {
    redirect(`/dashboard/internships/manage/${workspace.listing.id}`);
  }

  const { application, listing, interviews, offer, placement } = workspace;
  const supervisors =
    !placement && application.status === "accepted"
      ? await getPlacementSupervisorOptions(listing.organisationId)
      : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow="Candidate"
        title={application.applicantName}
        description={`${listing.title} · ${listing.organisationName}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          {
            label: "Manage",
            href: `/dashboard/internships/manage/${listing.id}`,
          },
          { label: application.applicantName },
        ]}
        actions={
          <>
            <InternshipApplicationStatusSelect
              applicationId={application.id}
              current={application.status}
            />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/internships/manage/${listing.id}`}>
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
              label={internshipApplicationStatusLabels[application.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Applied {formatDate(application.submittedAt.slice(0, 10))}
          </p>
          {application.coverNote ? (
            <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              {application.coverNote}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No application note provided.
            </p>
          )}
          <div className="grid gap-1 border-t pt-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="flex items-center gap-1">
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
              {formatDate(listing.startDate)} to {formatDate(listing.endDate)}
            </p>
            <p className="flex items-center gap-1">
              <MapPinIcon className="size-4" aria-hidden="true" />
              {listing.location ?? "Location not set"}
            </p>
          </div>
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
            <Link href={`/dashboard/internships/${listing.id}`}>
              View listing
            </Link>
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
            applicationType="internship"
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
                Placement offer
              </p>
              <StatusBadge status={offer.status} />
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Dates</dt>
                <dd>
                  {formatDate(offer.startDate)} to {formatDate(offer.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Hours / week</dt>
                <dd>{offer.expectedHours ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd>{offer.location ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Respond by</dt>
                <dd>
                  {offer.expiresAt ? formatDateTime(offer.expiresAt) : "No deadline"}
                </dd>
              </div>
            </dl>
            {offer.notes ? (
              <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {offer.notes}
              </p>
            ) : null}
            {offer.status === "sent" ? (
              <WithdrawOfferButton offerId={offer.id} offerType="internship" />
            ) : null}
          </Card>
        ) : (
          <Card className="p-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-brand-strong">
              Send a placement offer
            </h3>
            <InternshipOfferForm
              applicationId={application.id}
              defaults={{
                startDate: listing.startDate,
                endDate: listing.endDate,
                expectedHours: listing.expectedHours,
                location: listing.location,
              }}
            />
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          Placement
        </h2>
        {placement ? (
          <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-heading text-sm font-semibold text-brand-strong">
                Placement created
              </p>
              <p className="text-xs text-muted-foreground">
                {application.applicantName} · {listing.title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={placement.status} />
              <Button size="sm" asChild>
                <Link
                  href={`/dashboard/internships/placements/${placement.id}`}
                >
                  Open placement
                </Link>
              </Button>
            </div>
          </Card>
        ) : application.status === "accepted" ? (
          <Card className="p-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-brand-strong">
              Create placement
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Set up supervision and dates. The candidate must accept the
              placement agreement before it becomes active.
            </p>
            <CreatePlacementForm
              applicationId={application.id}
              supervisors={supervisors}
              defaults={{
                startDate: listing.startDate,
                endDate: listing.endDate,
                expectedHours: listing.expectedHours,
                location: listing.location,
              }}
            />
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">
            Accept the application to create a placement and assign a supervisor.
          </p>
        )}
      </section>
    </div>
  );
}
