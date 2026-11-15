import type { Metadata } from "next";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { CarePageHeader } from "@/features/care/components/care-page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CarePageHeader
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

      {staff.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No staff profiles yet"
            description="Add a profile for each care staff member. They must already be a workspace member."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => {
            const issues =
              member.expiringQualifications +
              member.expiredTraining +
              member.expiredDocuments;
            const initials = (member.fullName ?? "Staff")
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("");
            return (
              <article
                key={member.id}
                className="flex flex-col rounded-[var(--radius-2xl)] bg-card/90 p-4 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-portal-lavender text-sm font-semibold text-portal-lavender-strong">
                    {initials || "S"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold text-brand-strong">
                      {member.fullName ?? "Unnamed staff member"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email ?? "No email"}
                    </p>
                  </div>
                  <StatusBadge
                    status={member.employmentStatus}
                    label={
                      careEmploymentStatusLabels[
                        member.employmentStatus as CareEmploymentStatus
                      ]
                    }
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Role
                    </dt>
                    <dd className="mt-0.5 truncate font-medium text-brand-strong">
                      {member.jobTitle ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Started
                    </dt>
                    <dd className="mt-0.5 text-brand-strong">
                      {member.startDate ? formatDate(member.startDate) : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-brand-navy/5 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">
                    {member.qualifications} qualification
                    {member.qualifications === 1 ? "" : "s"}
                  </span>
                  {issues > 0 ? (
                    <span className="font-semibold text-brand-error">
                      {issues} need attention
                    </span>
                  ) : (
                    <span className="font-semibold text-portal-mint-strong">
                      Records current
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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
              </article>
            );
          })}
        </div>
      )}

      <Card className="p-4">
        <h2 className="font-heading text-base font-semibold text-brand-strong">
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
