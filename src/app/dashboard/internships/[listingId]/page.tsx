import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarClockIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";

import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApplyForm } from "@/features/employment/components/apply-form";
import { formatDate, formatDeadline } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getInternshipDetail,
  hasAppliedToInternship,
} from "@/server/employment/queries";

type InternshipDetailPageProps = {
  params: Promise<{ listingId: string }>;
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
}: InternshipDetailPageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getInternshipDetail(listingId);
  return { title: listing ? listing.title : "Placement" };
}

export default async function InternshipDetailPage({
  params,
}: InternshipDetailPageProps) {
  const { listingId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=/dashboard/internships/${listingId}`);
  }

  const listing = await getInternshipDetail(listingId);
  if (!listing) {
    notFound();
  }

  const alreadyApplied = await hasAppliedToInternship(listing.id, user.id);
  const deadlinePassed = listing.applicationDeadline
    ? new Date(`${listing.applicationDeadline}T23:59:59`) < new Date()
    : false;

  const disabledReason =
    listing.status !== "open"
      ? "This placement is not currently open for applications."
      : deadlinePassed
        ? "The application deadline for this placement has passed."
        : null;

  const location =
    [listing.city, listing.state].filter(Boolean).join(", ") ||
    listing.location ||
    "Location not specified";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow={listing.organisationName}
        title={listing.title}
        description={listing.summary ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          { label: listing.title },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/internships">Back to placements</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
          <Card className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-4" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <UsersIcon className="size-4" />
                {listing.slots} slot{listing.slots === 1 ? "" : "s"}
              </span>
              {listing.expectedHours ? (
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-4" />
                  {listing.expectedHours} hrs / week
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <CalendarClockIcon className="size-4" />
                {formatDeadline(listing.applicationDeadline)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {listing.startDate
                ? `Runs ${formatDate(listing.startDate)} to ${formatDate(listing.endDate)}`
                : "Dates flexible"}
            </p>
            {listing.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            ) : null}
          </Card>

          <Card className="space-y-5 p-4">
            <ListSection title="Requirements" items={listing.requirements} />
            <ListSection
              title="What you will learn"
              items={listing.learningObjectives}
            />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                Apply
              </h2>
              <StatusBadge status={disabledReason ? "closed" : "open"} />
            </div>
            <p className="text-xs text-muted-foreground">
              Applications close {formatDate(listing.applicationDeadline)}.
            </p>
            <ApplyForm
              kind="internship"
              targetId={listing.id}
              alreadyApplied={alreadyApplied}
              disabledReason={disabledReason}
            />
          </Card>
        </aside>
      </div>
    </div>
  );
}
