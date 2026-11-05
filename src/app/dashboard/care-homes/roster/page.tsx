import type { Metadata } from "next";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AssignStaffForm,
  HandoverDialogForm,
  RemoveAssignmentButton,
  ShiftDialogForm,
  ShiftStatusButtons,
} from "@/features/care/components/care-forms";
import { formatDateTime } from "@/lib/format";
import { shiftStatusLabels } from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listShifts, listStaffOptions } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Roster",
};

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "shift_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/roster",
  });

  const [shifts, staff] = await Promise.all([
    listShifts(context.workspace, { facilityId: context.facility?.id }),
    listStaffOptions(context.workspace),
  ]);

  const groups = new Map<string, typeof shifts>();
  for (const shift of shifts) {
    const key = shift.startsAt.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(shift);
    groups.set(key, list);
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Roster"
        description="Shifts for the next 14 days. Overlaps and missing qualifications are rejected by the database."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Roster" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            <ShiftDialogForm
              organisationId={context.workspace.organisationId}
              facilities={context.facilities}
              defaultFacilityId={context.facility?.id}
            />
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/roster"
      />

      {shifts.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No shifts scheduled"
            description="Create a shift to start building the roster."
          />
        </Card>
      ) : (
        <div className="space-y-4 lg:space-y-5">
          {Array.from(groups.entries()).map(([day, dayShifts]) => (
            <section key={day} className="space-y-3">
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                {new Date(`${day}T00:00:00`).toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {dayShifts.map((shift) => (
                  <Card key={shift.id} className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-base font-semibold text-brand-strong">
                          {shift.title ?? "Shift"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(shift.startsAt)} – {formatDateTime(shift.endsAt)}
                        </p>
                        {shift.requiredQualification ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Requires {shift.requiredQualification}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <StatusBadge
                          status={shift.status}
                          label={shiftStatusLabels[shift.status]}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {shift.assignedStaff} / {shift.requiredStaff} assigned
                        </p>
                        {shift.coverageGap > 0 ? (
                          <p className="text-xs font-medium text-brand-error">
                            {shift.coverageGap} place
                            {shift.coverageGap === 1 ? "" : "s"} unfilled
                          </p>
                        ) : (
                          <p className="text-xs text-brand-teal">Fully covered</p>
                        )}
                      </div>
                    </div>

                    {shift.assignments.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {shift.assignments.map((assignment) => (
                          <li
                            key={assignment.id}
                            className="flex items-center justify-between gap-2 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-brand-strong">
                                {assignment.fullName ?? "Staff member"}
                              </p>
                              <p className="text-xs capitalize text-muted-foreground">
                                {assignment.status}
                              </p>
                            </div>
                            <RemoveAssignmentButton
                              organisationId={context.workspace.organisationId}
                              assignmentId={assignment.id}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No staff assigned yet.
                      </p>
                    )}

                    <details className="rounded-md border border-border p-3">
                      <summary className="cursor-pointer text-sm font-medium text-brand-strong">
                        Assign a staff member
                      </summary>
                      <div className="pt-3">
                        <AssignStaffForm
                          organisationId={context.workspace.organisationId}
                          shiftId={shift.id}
                          staff={staff}
                        />
                      </div>
                    </details>

                    <div className="flex flex-wrap items-center gap-2">
                      <ShiftStatusButtons
                        organisationId={context.workspace.organisationId}
                        shiftId={shift.id}
                        status={shift.status}
                      />
                      <HandoverDialogForm
                        organisationId={context.workspace.organisationId}
                        shiftId={shift.id}
                      />
                    </div>

                    {shift.handover ? (
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Handover
                        </p>
                        <p className="mt-1 whitespace-pre-line text-brand-strong">
                          {shift.handover}
                        </p>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
