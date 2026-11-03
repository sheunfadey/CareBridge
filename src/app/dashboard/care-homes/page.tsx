import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangleIcon,
  BedDoubleIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  PackageIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  FacilityDialogForm,
  ResidentDialogForm,
} from "@/features/care/components/care-forms";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
  shiftStatusLabels,
} from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { getCareDashboard, listResidentOptions } from "@/server/care/queries";
import { userHasPermission } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Care home workspace",
};

export default async function CareHomesPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "resident_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes",
  });

  const { user, workspace, facility, facilities } = context;
  const canManageResidents = userHasPermission(user, "resident_manage");
  const dashboard = await getCareDashboard(workspace, facility?.id);
  const residents = facility ? await listResidentOptions(workspace, facility.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Care operations"
        title={workspace.name}
        description="A private workspace for residents, staff, rosters, care records, incidents, stock and billing."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={facilities} value={facility?.id ?? ""} />
            {canManageResidents ? (
              <FacilityDialogForm organisationId={workspace.organisationId} />
            ) : null}
            {canManageResidents && facilities.length > 0 ? (
              <ResidentDialogForm
                organisationId={workspace.organisationId}
                facilities={facilities}
              />
            ) : null}
          </>
        }
      />

      <CareNav
        user={user}
        organisationId={workspace.organisationId}
        facilityId={facility?.id}
        active=""
      />

      {facilities.length === 0 ? (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-navy">
              Set up your first facility
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Residents, shifts and stock are recorded against a facility. Add
              one to start using the operational workspace.
            </p>
          </div>
          {canManageResidents ? (
            <FacilityDialogForm organisationId={workspace.organisationId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask the workspace owner to add a facility.
            </p>
          )}
        </Card>
      ) : null}

      {facilities.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active residents"
              value={dashboard.activeResidents}
              hint={`${dashboard.onLeaveResidents} on leave`}
              icon={<UsersIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Active staff"
              value={dashboard.activeStaff}
              hint={`${dashboard.shiftsToday} shifts today`}
              icon={<CalendarClockIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Coverage gaps"
              value={dashboard.coverageGaps}
              hint="Unfilled places in today's rosters"
              icon={<AlertTriangleIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Open incidents"
              value={dashboard.openIncidents}
              hint={`${dashboard.highSeverityIncidents} high or critical`}
              icon={<ShieldAlertIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Outstanding invoices"
              value={formatMoney(dashboard.outstandingMinorUnits, "NGN")}
              hint={`${dashboard.outstandingInvoices.length} invoices shown`}
              icon={<CircleDollarSignIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Low stock"
              value={dashboard.lowStock.length}
              hint="Items at or below reorder level"
              icon={<PackageIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Compliance alerts"
              value={dashboard.expiringCompliance}
              hint="Staff with expired or unverified records"
              icon={<BedDoubleIcon aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold text-brand-navy">
                  Occupancy
                </h2>
                <BedDoubleIcon className="size-5 text-brand-teal" aria-hidden="true" />
              </div>
              {dashboard.occupancy.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No occupancy data yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {dashboard.occupancy.map((row) => (
                    <li key={row.facilityId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-brand-navy">{row.facilityName}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.activeResidents}
                          {row.capacity ? ` / ${row.capacity}` : ""}
                          {row.occupancyPercent !== null
                            ? ` · ${row.occupancyPercent}%`
                            : ""}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-brand-teal"
                          style={{
                            width: `${Math.min(row.occupancyPercent ?? 0, 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold text-brand-navy">
                  Today&apos;s shifts
                </h2>
                <CalendarClockIcon className="size-5 text-brand-teal" aria-hidden="true" />
              </div>
              {dashboard.upcomingShifts.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No shifts scheduled for today.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {dashboard.upcomingShifts.map((shift) => (
                    <li key={shift.id} className="flex items-start justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-brand-navy">
                          {shift.title ?? "Shift"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(shift.startsAt)} – {formatDateTime(shift.endsAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge
                          status={shift.status}
                          label={shiftStatusLabels[shift.status]}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {shift.assignedStaff} / {shift.requiredStaff} assigned
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="font-heading text-lg font-semibold text-brand-navy">
                Incidents needing attention
              </h2>
              {dashboard.recentIncidents.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No open incidents.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {dashboard.recentIncidents.map((incident) => (
                    <li key={incident.id} className="py-2.5">
                      <Link
                        href={`/dashboard/care-homes/incidents/${incident.id}`}
                        className="text-sm font-medium text-brand-navy hover:text-brand-teal"
                      >
                        {careIncidentCategoryLabels[incident.category]}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {incident.residentName ?? "No resident"} ·{" "}
                        {careIncidentSeverityLabels[incident.severity]} ·{" "}
                        {formatDateTime(incident.occurredAt)}
                      </p>
                      <StatusBadge
                        status={incident.status}
                        label={careIncidentStatusLabels[incident.status]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-heading text-lg font-semibold text-brand-navy">
                Low stock
              </h2>
              {dashboard.lowStock.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  All tracked items are above their reorder level.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {dashboard.lowStock.map((item) => (
                    <li key={item.itemId} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="font-medium text-brand-navy">{item.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {item.currentQuantity} / {item.reorderLevel} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/dashboard/care-homes/inventory?organisation=${workspace.organisationId}`}
                className="mt-3 inline-block text-sm font-medium text-brand-teal hover:underline"
              >
                Open inventory
              </Link>
            </Card>

            <Card className="p-5">
              <h2 className="font-heading text-lg font-semibold text-brand-navy">
                Outstanding invoices
              </h2>
              {dashboard.outstandingInvoices.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No outstanding balances.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {dashboard.outstandingInvoices.map((invoice) => (
                    <li key={invoice.invoiceId} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                      <div>
                        <Link
                          href={`/dashboard/care-homes/invoices/${invoice.invoiceId}`}
                          className="font-medium text-brand-navy hover:text-brand-teal"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">{invoice.payerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums text-brand-navy">
                          {formatMoney(invoice.outstandingMinorUnits, "NGN")}
                        </p>
                        {invoice.daysOverdue > 0 ? (
                          <p className="text-xs text-brand-error">
                            {invoice.daysOverdue} days overdue
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {dashboard.expiringCompliance > 0 ? (
            <Card className="border-brand-warning/40 bg-brand-warning/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="mt-0.5 size-5 text-brand-warning" aria-hidden="true" />
                <div>
                  <h2 className="font-heading text-base font-semibold text-brand-navy">
                    {dashboard.expiringCompliance} staff records need attention
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Expired training, unverified qualifications or expired
                    documents are blocking safe shift assignment.
                  </p>
                  <Link
                    href={`/dashboard/care-homes/staff?organisation=${workspace.organisationId}`}
                    className="mt-2 inline-block text-sm font-medium text-brand-teal hover:underline"
                  >
                    Review staff compliance
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          {residents.length === 0 && canManageResidents ? (
            <EmptyState
              title="Add your first resident"
              description="Resident records hold contacts, consents, care plans and daily care history."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
