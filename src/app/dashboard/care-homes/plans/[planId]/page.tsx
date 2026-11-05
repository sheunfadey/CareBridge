import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CareNav } from "@/components/care/care-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CarePlanDialogForm,
  CarePlanStatusButtons,
  CarePlanVersionDialogForm,
} from "@/features/care/components/care-forms";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  carePlanAccessLabels,
  carePlanStatusLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { getCarePlanDetail } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Care plan",
};

export default async function CarePlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const { planId } = await params;
  const query = await searchParams;
  const context = await requireCarePage({
    permission: "resident_view",
    requestedOrganisation: query.organisation,
    requestedFacility: query.facility,
    redirectTo: `/dashboard/care-homes/plans/${planId}`,
  });

  const detail = await getCarePlanDetail(context.workspace, planId);
  if (!detail) notFound();

  const plan = detail.plan;
  const canManage = userHasPermission(context.user, "care_plan_manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care plan"
        title={plan.title}
        description={`${plan.residentName ?? "Resident"} · ${carePlanAccessLabels[plan.accessLevel as "standard" | "restricted"]} access${plan.reviewDueOn ? ` · review by ${formatDate(plan.reviewDueOn)}` : ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          {
            label: "Care plans",
            href: `/dashboard/care-homes/plans?organisation=${context.workspace.organisationId}`,
          },
          { label: plan.title },
        ]}
        actions={
          <>
            <StatusBadge
              status={plan.status}
              label={carePlanStatusLabels[plan.status]}
            />
            {canManage ? (
              <>
                <CarePlanDialogForm
                  organisationId={context.workspace.organisationId}
                  residentId={plan.residentId}
                  plan={{
                    id: plan.id,
                    title: plan.title,
                    summary: plan.summary,
                    accessLevel: plan.accessLevel,
                    reviewDueOn: plan.reviewDueOn,
                  }}
                />
                <CarePlanVersionDialogForm
                  organisationId={context.workspace.organisationId}
                  planId={plan.id}
                />
              </>
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/plans"
      />

      {canManage ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Approval workflow
          </h2>
          <p className="text-sm text-muted-foreground">
            CareBridge does not diagnose conditions or replace professional
            clinical judgement. Plans are drafted, submitted for approval, then
            activated.
          </p>
          <CarePlanStatusButtons
            organisationId={context.workspace.organisationId}
            planId={plan.id}
            status={plan.status}
          />
        </Card>
      ) : null}

      {plan.summary ? (
        <Card className="p-5">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Summary
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {plan.summary}
          </p>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Version history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Versions are immutable. A change is always a new version with a change
          summary.
        </p>
        {detail.versions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No versions recorded yet.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {detail.versions.map((version) => (
              <li key={version.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-brand-strong">
                    Version {version.versionNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(version.createdAt)}
                    {version.approvedAt ? ` · approved ${formatDateTime(version.approvedAt)}` : ""}
                  </p>
                </div>
                {version.changeSummary ? (
                  <p className="mt-1 text-sm font-medium text-brand-teal">
                    {version.changeSummary}
                  </p>
                ) : null}
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  {(
                    [
                      ["Needs", version.content.needs],
                      ["Goals", version.content.goals],
                      ["Responsibilities", version.content.responsibilities],
                      ["Risks", version.content.risks],
                      ["Review cadence", version.content.reviewCadence],
                    ] as [string, unknown][]
                  ).map(([label, value]) =>
                    value ? (
                      <div key={label}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="mt-1 whitespace-pre-line text-brand-strong">
                          {String(value)}
                        </dd>
                      </div>
                    ) : null,
                  )}
                </dl>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Assigned responsibilities
        </h2>
        {detail.assignments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No named responsibilities are assigned.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {detail.assignments.map((assignment) => (
              <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-brand-strong">{assignment.responsibility}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.staffName ?? "Staff member"}
                    {assignment.dueOn ? ` · due ${formatDate(assignment.dueOn)}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {assignment.completedAt ? "Completed" : "Open"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button asChild variant="ghost">
        <Link href={`/dashboard/care-homes/residents/${plan.residentId}`}>
          Back to resident record
        </Link>
      </Button>
    </div>
  );
}
