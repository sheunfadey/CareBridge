import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardListIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { WithdrawApplicationButton } from "@/features/employment/components/status-actions";
import { OfferResponseButtons } from "@/features/employment/components/recruitment-forms";
import { formatDate } from "@/lib/format";
import { interviewModeLabels, interviewStatusLabels } from "@/lib/validation/placement";
import { getCurrentUser } from "@/server/auth/current-user";
import { getMyJobApplications } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Job applications",
};

const WITHDRAWABLE = new Set(["submitted", "under_review"]);

export default async function JobApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/jobs/applications");
  }

  const applications = await getMyJobApplications(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employment"
        title="My job applications"
        description="Track the progress of every role you have applied for."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Jobs", href: "/dashboard/jobs" },
          { label: "Applications" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/jobs">Browse jobs</Link>
          </Button>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardListIcon}
          title="No applications yet"
          description="When you apply for a role it appears here with its current status."
          action={
            <Button asChild>
              <Link href="/dashboard/jobs">Find a role</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card
              key={application.id}
              className="space-y-3 p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/jobs/${application.jobId}`}
                  className="font-heading font-semibold text-brand-navy hover:text-brand-teal"
                >
                  {application.jobTitle}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {application.organisationName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied {formatDate(application.submittedAt.slice(0, 10))} ·
                  Closes {formatDate(application.applicationDeadline)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={application.status} />
                {WITHDRAWABLE.has(application.status) ? (
                  <WithdrawApplicationButton
                    kind="job"
                    applicationId={application.id}
                  />
                ) : null}
              </div>
              {application.interviews.length > 0 ? (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs font-medium text-brand-navy">
                    Interviews
                  </p>
                  {application.interviews.map((interview) => (
                    <p key={interview.id} className="text-xs text-muted-foreground">
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
                    <p className="text-xs font-medium text-brand-navy">
                      Offer
                    </p>
                    <StatusBadge status={application.offer.status} />
                    <span className="text-xs text-muted-foreground">
                      Start {formatDate(application.offer.startDate)}
                    </span>
                  </div>
                  {application.offer.status === "sent" ? (
                    <OfferResponseButtons
                      offerId={application.offer.id}
                      offerType="job"
                    />
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
