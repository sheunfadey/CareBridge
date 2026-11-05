import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CareNav } from "@/components/care/care-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { IncidentActionForm, IncidentUpdateForm } from "@/features/care/components/care-forms";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { getIncidentDetail } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Incident review",
};

export default async function IncidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ incidentId: string }>;
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const { incidentId } = await params;
  const query = await searchParams;
  const context = await requireCarePage({
    permission: "incident_view",
    requestedOrganisation: query.organisation,
    requestedFacility: query.facility,
    redirectTo: `/dashboard/care-homes/incidents/${incidentId}`,
  });

  const incident = await getIncidentDetail(context.workspace, incidentId);
  if (!incident) notFound();

  const canManage = userHasPermission(context.user, "incident_manage");

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Incident review"
        title={careIncidentCategoryLabels[incident.category]}
        description={`${incident.residentName ?? "No resident"} · ${formatDateTime(incident.occurredAt)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          {
            label: "Incidents",
            href: `/dashboard/care-homes/incidents?organisation=${context.workspace.organisationId}`,
          },
          { label: "Review" },
        ]}
        actions={
          <>
            <StatusBadge
              status={incident.severity}
              label={careIncidentSeverityLabels[incident.severity]}
            />
            <StatusBadge
              status={incident.status}
              label={careIncidentStatusLabels[incident.status]}
            />
            {incident.isSafeguarding ? (
              <StatusBadge status="safeguarding" label="Safeguarding" />
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/incidents"
      />

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              What happened
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-brand-strong">
              {incident.description}
            </p>
          </div>
          {incident.immediateAction ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Immediate action
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-strong">
                {incident.immediateAction}
              </p>
            </div>
          ) : null}
          {incident.externalReference ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                External reference
              </h3>
              <p className="mt-1 text-sm text-brand-strong">{incident.externalReference}</p>
            </div>
          ) : null}
          <dl className="grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Reviewer</dt>
              <dd className="font-medium text-brand-strong">
                {incident.assignedReviewer ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Closed</dt>
              <dd className="font-medium text-brand-strong">
                {incident.closedAt ? formatDateTime(incident.closedAt) : "Open"}
              </dd>
            </div>
          </dl>
          {incident.closureNotes ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Closure notes
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-strong">
                {incident.closureNotes}
              </p>
            </div>
          ) : null}
        </Card>

        {canManage ? (
          <Card className="space-y-4 p-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Investigation
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign a reviewer and record closure notes before closing an
                incident.
              </p>
            </div>
            <IncidentUpdateForm
              organisationId={context.workspace.organisationId}
              incidentId={incident.id}
              status={incident.status}
              severity={incident.severity}
            />
          </Card>
        ) : null}
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Corrective actions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track what changes after the incident, who owns it and when it is due.
            </p>
          </div>
          {canManage ? (
            <IncidentActionForm
              organisationId={context.workspace.organisationId}
              incidentId={incident.id}
            />
          ) : null}
        </div>

        {incident.actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No corrective actions recorded.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {incident.actions.map((action) => (
              <li key={action.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-brand-strong">{action.action}</p>
                  <StatusBadge
                    status={action.status.replaceAll("_", "-")}
                    label={action.status.replaceAll("_", " ")}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.ownerName ?? "Unassigned"}
                  {action.dueOn ? ` · due ${formatDate(action.dueOn)}` : ""}
                  {action.completedAt ? ` · completed ${formatDateTime(action.completedAt)}` : ""}
                </p>
                {action.notes ? (
                  <p className="mt-1 text-sm text-muted-foreground">{action.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button asChild variant="ghost">
        <Link
          href={`/dashboard/care-homes/incidents?organisation=${context.workspace.organisationId}`}
        >
          Back to incidents
        </Link>
      </Button>
    </div>
  );
}
