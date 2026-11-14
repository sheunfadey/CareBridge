import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusinessIcon, CalendarDaysIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { CareerPageHeader } from "@/features/employment/components/career-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { getCurrentUser, userHasPermission } from "@/server/auth/current-user";
import {
  getPlacementReadyApplications,
  getPlacementsForUser,
} from "@/server/employment/workspace-queries";

export const metadata: Metadata = {
  title: "Placements",
};

const roleLabels = {
  candidate: "Your placement",
  supervisor: "You supervise",
  manager: "Hosting",
};

export default async function PlacementsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/internships/placements");
  }

  const placements = await getPlacementsForUser(user);
  const ready = userHasPermission(user, "internship_manage")
    ? await getPlacementReadyApplications()
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CareerPageHeader tone="lavender" icon="graduation"
        eyebrow="Internships"
        title="Placements"
        description="Track active placements, weekly logs, attendance, evaluations and completion records."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Internships", href: "/dashboard/internships" },
          { label: "Placements" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/internships">Browse placements</Link>
          </Button>
        }
      />

      {ready.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Accepted applications awaiting a placement
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ready.map((application) => (
              <Card key={application.applicationId} className="p-4">
                <p className="font-heading font-semibold text-brand-strong">
                  {application.applicantName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {application.listingTitle} · {application.organisationName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted application from{" "}
                  {formatDate(application.submittedAt.slice(0, 10))}
                </p>
                <Button className="mt-3" size="sm" asChild>
                  <Link
                    href={`/dashboard/internships/manage/applications/${application.applicationId}`}
                  >
                    Set up placement
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {placements.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusinessIcon}
          title="No placements yet"
          description="When you are accepted onto a placement — or when a candidate accepts your offer — the placement appears here."
          action={
            <Button asChild>
              <Link href="/dashboard/internships">Find a placement</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {placements.map((placement) => (
            <Card
              key={placement.id}
              className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/internships/placements/${placement.id}`}
                    className="font-heading font-semibold text-brand-strong hover:text-brand-teal"
                  >
                    {placement.listingTitle}
                  </Link>
                  <StatusBadge status={placement.status} />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {roleLabels[placement.viewerRole]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {placement.organisationName} · {placement.candidateName}
                  {placement.supervisorName
                    ? ` · Supervisor: ${placement.supervisorName}`
                    : ""}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
                  {formatDate(placement.startDate)} to{" "}
                  {formatDate(placement.endDate)}
                  {placement.expectedHours
                    ? ` · ${placement.expectedHours} hrs/week`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={placement.agreementStatus}
                  label={
                    placement.agreementStatus === "pending"
                      ? "Agreement pending"
                      : undefined
                  }
                />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/internships/placements/${placement.id}`}>
                    Open placement
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
