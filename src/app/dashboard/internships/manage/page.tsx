import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InternshipStatusSelect } from "@/features/employment/components/status-actions";
import { formatDate } from "@/lib/format";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import { getManagedInternships } from "@/server/employment/queries";

export const metadata: Metadata = {
  title: "Manage placements",
};

export default async function ManageInternshipsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/internships/manage");
  }
  if (!userHasPermission(user, "internship_manage")) {
    redirect("/dashboard/internships");
  }

  const listings = await getManagedInternships(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow="Internships"
        title="Manage placements"
        description="Create supervised placements, open them to applicants and review candidates."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          { label: "Manage" },
        ]}
        actions={
          <Button asChild>
            <Link href="/dashboard/internships/manage/new">
              <PlusIcon />
              New placement
            </Link>
          </Button>
        }
      />

      {listings.length === 0 ? (
        <EmptyState
          icon={PlusIcon}
          title="No placement listings yet"
          description="Create your first placement. It stays a draft until you open it."
          action={
            <Button asChild>
              <Link href="/dashboard/internships/manage/new">
                Create a placement
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card
              key={listing.id}
              className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/internships/manage/${listing.id}`}
                  className="font-heading font-semibold text-brand-strong hover:text-brand-teal"
                >
                  {listing.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {[listing.city, listing.state].filter(Boolean).join(", ") ||
                    "Location not set"}{" "}
                  · {listing.slots} slot{listing.slots === 1 ? "" : "s"} ·{" "}
                  {listing.applicationDeadline
                    ? `Closes ${formatDate(listing.applicationDeadline)}`
                    : "Open until filled"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {listing.applicantCount} applicant
                  {listing.applicantCount === 1 ? "" : "s"}
                </span>
                <InternshipStatusSelect
                  listingId={listing.id}
                  current={listing.status}
                />
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/internships/manage/${listing.id}`}>
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
