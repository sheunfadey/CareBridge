import type { Metadata } from "next";
import Link from "next/link";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
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
import {
  MedicationDialogForm,
  MedicationStatusForm,
} from "@/features/care/components/care-forms";
import { formatDateTime } from "@/lib/format";
import { medicationStatusLabels } from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listMedication, listResidentOptions } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Medication",
};

export default async function MedicationPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "medication_manage",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/medication",
  });

  const [records, residents] = await Promise.all([
    listMedication(context.workspace, { facilityId: context.facility?.id }),
    listResidentOptions(context.workspace, context.facility?.id),
  ]);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Medication"
        description="Administration records only. HillCrest does not recommend medicines or calculate doses; authorised staff record what was prescribed and given."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Medication" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            <MedicationDialogForm
              organisationId={context.workspace.organisationId}
              residents={residents}
            />
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/medication"
      />

      <Card className="overflow-hidden p-0">
        {records.length === 0 ? (
          <EmptyState
            title="No medication records"
            description="Schedule a medication record for a resident. Administration is timestamped and auditable."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dose / route</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Administered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/care-homes/residents/${record.residentId}`}
                      className="text-sm font-medium text-brand-strong hover:text-brand-teal"
                    >
                      {record.residentName ?? "Resident"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-brand-strong">
                    {record.medicationName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[record.doseText, record.route].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(record.scheduledAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {record.administeredAt ? formatDateTime(record.administeredAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={record.status}
                      label={medicationStatusLabels[record.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {record.status === "scheduled" ? (
                      <MedicationStatusForm
                        organisationId={context.workspace.organisationId}
                        medicationRecordId={record.id}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
          Safeguards
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Only staff with the medication permission can read or record these entries.</li>
          <li>An administered record is immutable; corrections are new audited events.</li>
          <li>Every status change is written to the medication event log.</li>
          <li>No autonomous recommendations, dose calculations or interaction checks are performed.</li>
        </ul>
      </Card>
    </div>
  );
}
