import type { Metadata } from "next";
import Link from "next/link";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IncidentDialogForm } from "@/features/care/components/care-forms";
import { formatDateTime } from "@/lib/format";
import {
  CARE_INCIDENT_SEVERITIES,
  CARE_INCIDENT_STATUSES,
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { listIncidents, listResidentOptions } from "@/server/care/queries";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Incidents",
};

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organisation?: string;
    facility?: string;
    status?: string;
    severity?: string;
  }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "incident_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/incidents",
  });

  const status = CARE_INCIDENT_STATUSES.includes(params.status as IncidentStatus)
    ? (params.status as IncidentStatus)
    : "all";
  const severity = CARE_INCIDENT_SEVERITIES.includes(
    params.severity as IncidentSeverity,
  )
    ? (params.severity as IncidentSeverity)
    : "all";

  const [incidents, residents] = await Promise.all([
    listIncidents(context.workspace, {
      facilityId: context.facility?.id,
      status,
      severity,
    }),
    listResidentOptions(context.workspace, context.facility?.id),
  ]);

  const canReport = userHasPermission(context.user, "incident_manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care operations"
        title="Incidents"
        description="Falls, safeguarding concerns, medication incidents and corrective actions. Sensitive records are restricted to authorised staff."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Incidents" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            {canReport && context.facilities.length > 0 ? (
              <IncidentDialogForm
                organisationId={context.workspace.organisationId}
                facilities={context.facilities}
                residents={residents}
                defaultFacilityId={context.facility?.id}
              />
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

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <input type="hidden" name="organisation" value={context.workspace.organisationId} />
          {context.facility ? (
            <input type="hidden" name="facility" value={context.facility.id} />
          ) : null}
          <div>
            <label htmlFor="incident-status" className="mb-1 block text-xs text-muted-foreground">
              Status
            </label>
            <select
              id="incident-status"
              name="status"
              defaultValue={status}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {CARE_INCIDENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {careIncidentStatusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="incident-severity" className="mb-1 block text-xs text-muted-foreground">
              Severity
            </label>
            <select
              id="incident-severity"
              name="severity"
              defaultValue={severity}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All severities</option>
              {CARE_INCIDENT_SEVERITIES.map((value) => (
                <option key={value} value={value}>
                  {careIncidentSeverityLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {incidents.length === 0 ? (
          <EmptyState
            title="No incidents recorded"
            description="Report an incident to start the investigation and corrective-action workflow."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Occurred</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(incident.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-brand-strong">
                      {careIncidentCategoryLabels[incident.category]}
                    </p>
                    {incident.isSafeguarding ? (
                      <p className="text-xs font-medium text-brand-error">
                        Safeguarding
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {incident.residentName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={incident.severity}
                      label={careIncidentSeverityLabels[incident.severity]}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={incident.status}
                      label={careIncidentStatusLabels[incident.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {incident.assignedReviewer ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {incident.actionCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/care-homes/incidents/${incident.id}`}>
                        Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
