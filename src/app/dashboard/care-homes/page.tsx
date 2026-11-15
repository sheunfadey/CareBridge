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
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  OverviewTile,
  PortalSection,
  SectionHeading,
} from "@/features/portal/components/portal-ui";
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
  const careQuery = `organisation=${workspace.organisationId}${
    facility ? `&facility=${facility.id}` : ""
  }`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PortalSection>
        <div className="relative overflow-hidden rounded-[2rem] bg-portal-mint p-4 sm:p-6">
          <span
            aria-hidden="true"
            className="absolute -right-12 -top-16 size-56 rounded-full border-[18px] border-white/25"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-24 right-32 size-48 rounded-full bg-white/15"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-portal-mint-strong">
              <BedDoubleIcon className="size-3.5" />
              Care operations
            </span>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-brand-strong">
              {workspace.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-navy/70 sm:text-base dark:text-foreground/70">
              Residents, staff, rosters, care records, incidents, stock and
              billing in one private workspace.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        </div>
      </PortalSection>

      <CareNav
        user={user}
        organisationId={workspace.organisationId}
        facilityId={facility?.id}
        active=""
      />

      {facilities.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 ring-1 ring-foreground/10 sm:p-8">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Set up your first facility
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Residents, shifts and stock are recorded against a facility. Add one
            to start using the operational workspace.
          </p>
          <div className="mt-4">
            {canManageResidents ? (
              <FacilityDialogForm organisationId={workspace.organisationId} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask the workspace owner to add a facility.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {facilities.length > 0 ? (
        <>
          <PortalSection delay={0.05}>
            <SectionHeading title="Today at a glance" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <OverviewTile
                label="Active residents"
                value={dashboard.activeResidents}
                hint={`${dashboard.onLeaveResidents} on leave`}
                icon={<UsersIcon className="size-4.5" />}
                tone="mint"
                index={0}
                href={`/dashboard/care-homes/residents?${careQuery}`}
              />
              <OverviewTile
                label="Active staff"
                value={dashboard.activeStaff}
                hint={`${dashboard.shiftsToday} shifts today`}
                icon={<CalendarClockIcon className="size-4.5" />}
                tone="lavender"
                index={1}
                href={`/dashboard/care-homes/staff?${careQuery}`}
              />
              <OverviewTile
                label="Coverage gaps"
                value={dashboard.coverageGaps}
                hint="Unfilled roster places"
                icon={<AlertTriangleIcon className="size-4.5" />}
                tone="peach"
                index={2}
                href={`/dashboard/care-homes/roster?${careQuery}`}
              />
              <OverviewTile
                label="Open incidents"
                value={dashboard.openIncidents}
                hint={`${dashboard.highSeverityIncidents} high or critical`}
                icon={<ShieldAlertIcon className="size-4.5" />}
                tone="sky"
                index={3}
                href={`/dashboard/care-homes/incidents?${careQuery}`}
              />
            </div>
          </PortalSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <PortalSection delay={0.05}>
              <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/care-homes/residents?${careQuery}`}
                    className="font-heading text-lg font-semibold text-brand-strong hover:text-brand-blue"
                  >
                    Occupancy
                  </Link>
                  <BedDoubleIcon className="size-5 text-portal-mint-strong" />
                </div>
                {dashboard.occupancy.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No occupancy data yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {dashboard.occupancy.map((row) => (
                      <li key={row.facilityId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-brand-strong">
                            {row.facilityName}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {row.activeResidents}
                            {row.capacity ? ` / ${row.capacity}` : ""}
                            {row.occupancyPercent !== null
                              ? ` · ${row.occupancyPercent}%`
                              : ""}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-brand-navy/10">
                          <div
                            className="h-full rounded-full bg-portal-mint-strong"
                            style={{
                              width: `${Math.min(row.occupancyPercent ?? 0, 100)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </PortalSection>

            <PortalSection delay={0.1}>
              <div className="h-full rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/care-homes/roster?${careQuery}`}
                    className="font-heading text-lg font-semibold text-brand-strong hover:text-brand-blue"
                  >
                    Today&apos;s shifts
                  </Link>
                  <CalendarClockIcon className="size-5 text-portal-lavender-strong" />
                </div>
                {dashboard.upcomingShifts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No shifts scheduled for today.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-brand-navy/5">
                    {dashboard.upcomingShifts.map((shift) => (
                      <li
                        key={shift.id}
                        className="flex items-start justify-between gap-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-strong">
                            {shift.title ?? "Shift"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(shift.startsAt)} –{" "}
                            {formatDateTime(shift.endsAt)}
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
              </div>
            </PortalSection>
          </div>

          <PortalSection delay={0.05}>
            <SectionHeading title="Needs attention" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/care-homes/incidents?${careQuery}`}
                    className="font-heading text-base font-semibold text-brand-strong hover:text-brand-blue"
                  >
                    Incidents
                  </Link>
                  <ShieldAlertIcon className="size-4.5 text-brand-warning" />
                </div>
                {dashboard.recentIncidents.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No open incidents.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-brand-navy/5">
                    {dashboard.recentIncidents.map((incident) => (
                      <li key={incident.id} className="py-3">
                        <Link
                          href={`/dashboard/care-homes/incidents/${incident.id}`}
                          className="text-sm font-medium text-brand-strong hover:text-brand-blue"
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
              </div>

              <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/care-homes/inventory?${careQuery}`}
                    className="font-heading text-base font-semibold text-brand-strong hover:text-brand-blue"
                  >
                    Low stock
                  </Link>
                  <PackageIcon className="size-4.5 text-portal-peach-strong" />
                </div>
                {dashboard.lowStock.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    All tracked items are above their reorder level.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-brand-navy/5">
                    {dashboard.lowStock.map((item) => (
                      <li
                        key={item.itemId}
                        className="flex items-center justify-between gap-2 py-3 text-sm"
                      >
                        <span className="font-medium text-brand-strong">
                          {item.name}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {item.currentQuantity} / {item.reorderLevel} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/dashboard/care-homes/inventory?organisation=${workspace.organisationId}`}
                  className="mt-3 inline-flex text-xs font-semibold text-brand-blue hover:underline"
                >
                  Open inventory
                </Link>
              </div>

              <div className="rounded-[var(--radius-2xl)] bg-card/85 p-4 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/care-homes/invoices?${careQuery}`}
                    className="font-heading text-base font-semibold text-brand-strong hover:text-brand-blue"
                  >
                    Invoices
                  </Link>
                  <CircleDollarSignIcon className="size-4.5 text-portal-sky-strong" />
                </div>
                <p className="mt-2 font-heading text-xl font-semibold tabular-nums text-brand-strong">
                  {formatMoney(dashboard.outstandingMinorUnits, "NGN")}
                </p>
                {dashboard.outstandingInvoices.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No outstanding balances.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-brand-navy/5">
                    {dashboard.outstandingInvoices.slice(0, 3).map((invoice) => (
                      <li
                        key={invoice.invoiceId}
                        className="flex items-center justify-between gap-2 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/care-homes/invoices/${invoice.invoiceId}`}
                            className="font-medium text-brand-strong hover:text-brand-blue"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {invoice.payerName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-medium tabular-nums text-brand-strong">
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
              </div>
            </div>
          </PortalSection>

          {dashboard.expiringCompliance > 0 ? (
            <div className="rounded-[var(--radius-2xl)] border border-brand-warning/40 bg-brand-warning/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-brand-warning" />
                <div>
                  <h2 className="font-heading text-base font-semibold text-brand-strong">
                    {dashboard.expiringCompliance} staff records need attention
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Expired training, unverified qualifications or expired
                    documents are blocking safe shift assignment.
                  </p>
                  <Link
                    href={`/dashboard/care-homes/staff?organisation=${workspace.organisationId}`}
                    className="mt-2 inline-flex text-sm font-medium text-brand-blue hover:underline"
                  >
                    Review staff compliance
                  </Link>
                </div>
              </div>
            </div>
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
