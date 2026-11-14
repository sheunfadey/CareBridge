import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardListIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { OfferResponseButtons } from "@/features/employment/components/recruitment-forms";
import { WithdrawApplicationButton } from "@/features/employment/components/status-actions";
import { formatDate } from "@/lib/format";
import {
  interviewModeLabels,
  interviewStatusLabels,
} from "@/lib/validation/placement";
import { getCurrentUser } from "@/server/auth/current-user";
import { getMyInternshipApplications } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Internship applications",
};

const WITHDRAWABLE = new Set(["submitted", "under_review"]);

export default async function InternshipApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/internships/applications");
  }

  const applications = await getMyInternshipApplications(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow="Internships"
        title="My internship applications"
        description="Follow your applications, interviews, offers and placements."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          { label: "Applications" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/internships">Browse placements</Link>
          </Button>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No applications yet"
          description="When you apply for a placement it appears here with its current status."
          action={
            <Button asChild>
              <Link href="/dashboard/internships">Find a placement</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card key={application.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/internships/${application.listingId}`}
                    className="font-heading font-semibold text-brand-strong hover:text-brand-teal"
                  >
                    {application.listingTitle}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {application.organisationName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied{" "}
                    {formatDate(application.submittedAt.slice(0, 10))} · Closes{" "}
                    {formatDate(application.applicationDeadline)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={application.status} />
                  {WITHDRAWABLE.has(application.status) ? (
                    <WithdrawApplicationButton
                      kind="internship"
                      applicationId={application.id}
                    />
                  ) : null}
                </div>
              </div>

              {application.interviews.length > 0 ? (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs font-medium text-brand-strong">
                    Interviews
                  </p>
                  {application.interviews.map((interview) => (
                    <p
                      key={interview.id}
                      className="text-xs text-muted-foreground"
                    >
                      {new Date(interview.scheduledAt).toLocaleString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {interviewModeLabels[interview.mode]} ·{" "}
                      {interviewStatusLabels[interview.status]}
                    </p>
                  ))}
                </div>
              ) : null}

              {application.offer ? (
                <div className="space-y-2 border-t pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-brand-strong">Offer</p>
                    <StatusBadge status={application.offer.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(application.offer.startDate)} to{" "}
                      {formatDate(application.offer.endDate)}
                    </span>
                  </div>
                  {application.offer.status === "sent" ? (
                    <OfferResponseButtons
                      offerId={application.offer.id}
                      offerType="internship"
                    />
                  ) : null}
                </div>
              ) : null}

              {application.placement ? (
                <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                  <p className="text-xs font-medium text-brand-strong">
                    Placement
                  </p>
                  <StatusBadge status={application.placement.status} />
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={`/dashboard/internships/placements/${application.placement.id}`}
                    >
                      Open placement
                    </Link>
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
