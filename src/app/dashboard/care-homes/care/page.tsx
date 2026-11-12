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
import {
  CareRecordDialogForm,
  CareRecordReviewForm,
} from "@/features/care/components/care-forms";
import { formatDateTime } from "@/lib/format";
import { careRecordStatusLabels, careReviewOutcomeLabels } from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { listCareRecords, listResidentOptions } from "@/server/care/queries";
import type { CareReviewOutcome, CareTaskRecordStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Daily care",
};

export default async function DailyCarePage({
  searchParams,
}: {
  searchParams: Promise<{
    organisation?: string;
    facility?: string;
    date?: string;
  }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "care_record_manage",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/care",
  });

  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const [records, residents] = await Promise.all([
    listCareRecords(context.workspace, {
      facilityId: context.facility?.id,
      date,
    }),
    listResidentOptions(context.workspace, context.facility?.id),
  ]);

  const canReview = userHasPermission(context.user, "care_plan_manage");
  const needsReview = records.filter((record) => !record.reviewedAt);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Daily care"
        description={`Care recorded on ${new Date(`${date}T00:00:00`).toLocaleDateString("en-NG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}. Supervisor review locks a record against further edits.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Daily care" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            <CareRecordDialogForm
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
        active="/care"
      />

      <Card className="p-3.5">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <input type="hidden" name="organisation" value={context.workspace.organisationId} />
          {context.facility ? (
            <input type="hidden" name="facility" value={context.facility.id} />
          ) : null}
          <div>
            <label htmlFor="care-date" className="mb-1 block text-xs text-muted-foreground">
              Date
            </label>
            <input
              id="care-date"
              type="date"
              name="date"
              defaultValue={date}
              className="h-9 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
            />
          </div>
          <Button type="submit" variant="outline">
            Show day
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Records</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {records.length}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Awaiting review</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {needsReview.length}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Completed / refused / deferred</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {records.filter((record) => record.status === "completed").length} /{" "}
            {records.filter((record) => record.status === "refused").length} /{" "}
            {records.filter((record) => record.status === "deferred").length}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        {records.length === 0 ? (
          <EmptyState
            title="No care recorded on this date"
            description="Record personal care, meals, hydration, mobility, activities or observations."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Recorded</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Review</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {record.taskTitle ?? "General care"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={record.status}
                      label={
                        careRecordStatusLabels[
                          record.status as CareTaskRecordStatus
                        ]
                      }
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(record.completedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.recordedByName ?? "—"}
                  </TableCell>
                  <TableCell>
                    {record.reviewedAt ? (
                      <div>
                        <StatusBadge
                          status={record.reviewOutcome ?? "accepted"}
                          label={
                            record.reviewOutcome
                              ? careReviewOutcomeLabels[
                                  record.reviewOutcome as CareReviewOutcome
                                ]
                              : "Reviewed"
                          }
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(record.reviewedAt)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting review</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canReview && !record.reviewedAt ? (
                      <CareRecordReviewForm
                        organisationId={context.workspace.organisationId}
                        recordId={record.id}
                      />
                    ) : null}
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
