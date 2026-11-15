import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCapIcon, MapPinIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { WithdrawApplicationButton } from "@/features/employment/components/status-actions";
import { formatDate, formatDeadline } from "@/lib/format";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import {
  getMyInternshipApplications,
  getOpenInternships,
} from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Internships",
};

const WITHDRAWABLE = new Set(["submitted", "under_review"]);

export default async function InternshipsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/internships");
  }

  const [{ internships, unavailable }, myApplications] = await Promise.all([
    getOpenInternships(),
    getMyInternshipApplications(user.id),
  ]);

  const canManage = userHasPermission(user, "internship_manage");
  const appliedListings = new Set(
    myApplications.map((application) => application.listingId),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow="Internships"
        title="Supervised placements"
        description="Apply for supervised placements with verified care providers and build practical competence."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships" },
        ]}
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/dashboard/internships/manage">
                Manage placements
              </Link>
            </Button>
          ) : undefined
        }
      />

      {myApplications.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            My applications
          </h2>
          <div className="space-y-3">
            {myApplications.map((application) => (
              <Card
                key={application.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
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
                    {formatDate(application.submittedAt.slice(0, 10))} ·{" "}
                    {formatDeadline(application.applicationDeadline)}
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
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          Open placements
        </h2>
        {unavailable ? (
          <Card className="p-4 text-sm text-muted-foreground">
            Placements are temporarily unavailable. Please try again shortly.
          </Card>
        ) : internships.length === 0 ? (
          <EmptyState
            icon={GraduationCapIcon}
            title="No open placements"
            description="New supervised placements appear here as providers publish them."
          />
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            {internships.map((listing) => (
              <Card key={listing.id} className="relative flex flex-col rounded-[var(--radius-2xl)] bg-card/90 p-4">
                <Link
                  href={`/dashboard/internships/${listing.id}`}
                  aria-label={`Open ${listing.title}`}
                  tabIndex={-1}
                  className="absolute inset-0 z-10 rounded-[var(--radius-2xl)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/internships/${listing.id}`}
                      className="font-heading text-base font-semibold sm:text-lg text-brand-strong hover:text-brand-teal"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {listing.organisationName}
                    </p>
                  </div>
                  <StatusBadge status="open" />
                </div>
                {listing.summary ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {listing.summary}
                  </p>
                ) : null}
                <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5" />
                    <dt className="sr-only">Location</dt>
                    <dd>
                      {[listing.city, listing.state].filter(Boolean).join(", ") ||
                        listing.location ||
                        "Location not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Slots</dt>
                    <dd>
                      {listing.slots} slot{listing.slots === 1 ? "" : "s"}
                    </dd>
                  </div>
                  {listing.expectedHours ? (
                    <div>
                      <dt className="sr-only">Hours</dt>
                      <dd>{listing.expectedHours} hrs / week</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {listing.startDate
                    ? `Starts ${formatDate(listing.startDate)}`
                    : "Start date flexible"}{" "}
                  · {formatDeadline(listing.applicationDeadline)}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/internships/${listing.id}`}>
                      View placement
                    </Link>
                  </Button>
                  {appliedListings.has(listing.id) ? (
                    <Button size="sm" variant="outline" disabled>
                      Applied
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
