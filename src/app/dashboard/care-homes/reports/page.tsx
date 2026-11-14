import type { Metadata } from "next";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { CarePageHeader } from "@/features/care/components/care-page-header";
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
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
} from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { getCareReports } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Care reports",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "care_report_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/reports",
  });

  const reports = await getCareReports(context.workspace, context.facility?.id);
  const totalExpenses = reports.expenses.reduce(
    (sum, row) => sum + row.totalMinorUnits,
    0,
  );
  const outstanding = reports.ageing.reduce(
    (sum, row) => sum + row.outstandingMinorUnits,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CarePageHeader
        eyebrow="Care operations"
        title="Reports"
        description="Occupancy, staffing coverage, training compliance, incidents, stock, expenses and invoice ageing. Aggregates never expose resident names."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Reports" },
        ]}
        actions={
          <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/reports"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Active residents</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {reports.occupancy.reduce((sum, row) => sum + row.activeResidents, 0)}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Shifts with gaps</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {reports.staffing.filter((row) => row.coverageGap > 0).length}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Expenses</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(totalExpenses, "NGN")}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Outstanding invoices</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(outstanding, "NGN")}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        <Card className="p-3.5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">Occupancy</h2>
          <ul className="mt-3 divide-y divide-border">
            {reports.occupancy.map((row) => (
              <li key={row.facilityId} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-brand-strong">{row.facilityName}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.activeResidents}
                  {row.capacity ? ` / ${row.capacity}` : ""}
                  {row.occupancyPercent !== null ? ` · ${row.occupancyPercent}%` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-3.5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Upcoming staffing coverage
          </h2>
          {reports.staffing.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming shifts.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {reports.staffing.slice(0, 12).map((row) => (
                <li key={row.shiftId} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-muted-foreground">{formatDateTime(row.startsAt)}</span>
                  <span className={row.coverageGap > 0 ? "font-medium text-brand-error" : "text-brand-teal"}>
                    {row.assignedStaff} / {row.requiredStaff}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Training and document compliance
          </h2>
        </div>
        {reports.compliance.length === 0 ? (
          <EmptyState
            title="No staff records"
            description="Add staff profiles to track qualification and training expiry."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff member</TableHead>
                <TableHead className="text-right">Expired training</TableHead>
                <TableHead className="text-right">Expired qualifications</TableHead>
                <TableHead className="text-right">Unverified qualifications</TableHead>
                <TableHead className="text-right">Expired documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.compliance.map((row) => (
                <TableRow key={row.staffId}>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {row.staffName ?? "Staff member"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.expiredTraining}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.expiredQualifications}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.unverifiedQualifications}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.expiredDocuments}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Incident summary
            </h2>
          </div>
          {reports.incidents.length === 0 ? (
            <EmptyState title="No incidents" description="No incidents recorded for this scope." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.incidents.map((row, index) => (
                  <TableRow key={`${row.category}-${row.severity}-${row.status}-${index}`}>
                    <TableCell className="text-sm text-brand-strong">
                      {careIncidentCategoryLabels[row.category]}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={row.severity}
                        label={careIncidentSeverityLabels[row.severity]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={row.status}
                        label={careIncidentStatusLabels[row.status]}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                      {row.incidentCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Invoice ageing
            </h2>
          </div>
          {reports.ageing.length === 0 ? (
            <EmptyState title="No invoices" description="No invoices recorded for this scope." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-right">Days overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.ageing.map((row) => (
                  <TableRow key={row.invoiceId}>
                    <TableCell className="font-mono text-xs text-brand-strong">
                      {row.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.payerName}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                      {formatMoney(row.outstandingMinorUnits, "NGN")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {row.daysOverdue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
