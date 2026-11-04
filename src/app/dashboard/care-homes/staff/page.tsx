import type { Metadata } from "next";

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
  DocumentDialogForm,
  QualificationDialogForm,
  StaffAvailabilityDialogForm,
  StaffDialogForm,
  TrainingDialogForm,
} from "@/features/care/components/care-forms";
import { formatDate } from "@/lib/format";
import { careEmploymentStatusLabels } from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listStaff } from "@/server/care/queries";
import type { CareEmploymentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Care staff",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "staff_manage",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/staff",
  });

  const staff = await listStaff(context.workspace);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care operations"
        title="Staff"
        description="Staff records, qualifications, training and document expiry. Shift assignment is blocked when required qualifications are missing."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Staff" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            <StaffDialogForm organisationId={context.workspace.organisationId} />
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/staff"
      />

      <Card className="overflow-hidden p-0">
        {staff.length === 0 ? (
          <EmptyState
            title="No staff profiles yet"
            description="Add a profile for each care staff member. They must already be a workspace member."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead className="text-right">Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                const issues =
                  member.expiringQualifications +
                  member.expiredTraining +
                  member.expiredDocuments;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <p className="font-medium text-brand-navy">
                        {member.fullName ?? "Unnamed staff member"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email ?? "No email"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.jobTitle ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={member.employmentStatus}
                        label={
                          careEmploymentStatusLabels[
                            member.employmentStatus as CareEmploymentStatus
                          ]
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {member.startDate ? formatDate(member.startDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">
                          {member.qualifications} qualification
                          {member.qualifications === 1 ? "" : "s"}
                        </p>
                        {issues > 0 ? (
                          <p className="font-medium text-brand-error">
                            {issues} record{issues === 1 ? "" : "s"} need attention
                          </p>
                        ) : (
                          <p className="text-brand-teal">Records current</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <StaffAvailabilityDialogForm
                          organisationId={context.workspace.organisationId}
                          staffId={member.id}
                          availability={member.availability}
                        />
                        <QualificationDialogForm
                          organisationId={context.workspace.organisationId}
                          staffId={member.id}
                        />
                        <TrainingDialogForm
                          organisationId={context.workspace.organisationId}
                          staffId={member.id}
                        />
                        <DocumentDialogForm
                          organisationId={context.workspace.organisationId}
                          staffId={member.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-heading text-base font-semibold text-brand-navy">
          How shift assignment uses these records
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A shift can require a qualification code. Assignment is rejected by the
          database when the worker does not have a verified, unexpired
          qualification with that code, or when the shift overlaps another
          assignment. Nothing is auto-assigned.
        </p>
      </Card>
    </div>
  );
}
