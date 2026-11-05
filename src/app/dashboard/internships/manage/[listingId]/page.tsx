import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InternshipApplicationStatusSelect,
  InternshipStatusSelect,
} from "@/features/employment/components/status-actions";
import { formatDate } from "@/lib/format";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import {
  getInternshipApplicants,
  getInternshipDetail,
} from "@/server/employment/queries";

type ManageInternshipPageProps = {
  params: Promise<{ listingId: string }>;
};

export async function generateMetadata({
  params,
}: ManageInternshipPageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getInternshipDetail(listingId);
  return { title: listing ? `Review: ${listing.title}` : "Review placement" };
}

export default async function ManageInternshipPage({
  params,
}: ManageInternshipPageProps) {
  const { listingId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/internships/manage/${listingId}`);
  }
  if (!userHasPermission(user, "internship_manage")) {
    redirect("/dashboard/internships");
  }

  const listing = await getInternshipDetail(listingId);
  if (!listing) {
    notFound();
  }

  const { applicants } = await getInternshipApplicants(listing.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Internships"
        title={listing.title}
        description={`${[listing.city, listing.state]
          .filter(Boolean)
          .join(", ") || "Location not set"} · ${listing.slots} slot${
          listing.slots === 1 ? "" : "s"
        }`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          {
            label: "Manage",
            href: "/dashboard/internships/manage",
          },
          { label: listing.title },
        ]}
        actions={
          <>
            <InternshipStatusSelect
              listingId={listing.id}
              current={listing.status}
            />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/internships/${listing.id}`}>
                View public page
              </Link>
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
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
            description="Open the placement to start receiving applications."
          />
        ) : (
          <div className="space-y-3">
            {applicants.map((applicant) => (
              <Card key={applicant.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/dashboard/internships/manage/applications/${applicant.id}`}
                      className="font-heading font-semibold text-brand-strong hover:text-brand-teal"
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
                    {applicant.coverNote ? (
                      <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {applicant.coverNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <InternshipApplicationStatusSelect
                      applicationId={applicant.id}
                      current={applicant.status}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/internships/manage/applications/${applicant.id}`}
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
