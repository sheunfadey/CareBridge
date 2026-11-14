import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { CarePageHeader } from "@/features/care/components/care-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResidentDialogForm } from "@/features/care/components/care-forms";
import { formatDate } from "@/lib/format";
import { RESIDENT_STATUSES, residentStatusLabels } from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listResidents } from "@/server/care/queries";
import { userHasPermission } from "@/server/auth/current-user";
import type { ResidentStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Residents",
};

export default async function ResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organisation?: string;
    facility?: string;
    q?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "resident_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/residents",
  });

  const status = RESIDENT_STATUSES.includes(params.status as ResidentStatus)
    ? (params.status as ResidentStatus)
    : "all";

  const residents = await listResidents(context.workspace, {
    facilityId: context.facility?.id,
    status,
    search: params.q,
  });

  const canManage = userHasPermission(context.user, "resident_manage");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CarePageHeader
        eyebrow="Care operations"
        title="Residents"
        description="Resident records, contacts, consents and care plans. Access is restricted and logged."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Residents" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            {canManage && context.facilities.length > 0 ? (
              <ResidentDialogForm
                organisationId={context.workspace.organisationId}
                facilities={context.facilities}
              />
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/residents"
      />

      <Card className="p-4">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center" method="get">
          <input
            type="hidden"
            name="organisation"
            value={context.workspace.organisationId}
          />
          {context.facility ? (
            <input type="hidden" name="facility" value={context.facility.id} />
          ) : null}
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search name, reference or room"
              className="pl-9"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded-md border border-input bg-background px-3 text-base sm:text-sm"
          >
            <option value="all">All statuses</option>
            {RESIDENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {residentStatusLabels[value]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </Card>

      {residents.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No residents found"
            description={
              params.q
                ? "No resident matches that search."
                : "Resident records will appear here once they are added."
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {residents.map((resident) => {
            const initials = `${resident.firstName[0] ?? ""}${
              resident.lastName[0] ?? ""
            }`.toUpperCase();
            return (
              <article
                key={resident.id}
                className="flex flex-col rounded-[var(--radius-2xl)] bg-card/90 p-4 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.35)] ring-1 ring-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-portal-mint text-sm font-semibold text-portal-mint-strong">
                    {initials || "R"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/care-homes/residents/${resident.id}`}
                      className="font-heading text-base font-semibold text-brand-strong hover:text-brand-blue"
                    >
                      {resident.firstName} {resident.lastName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {resident.preferredName
                        ? `Prefers ${resident.preferredName}`
                        : resident.reference}
                    </p>
                  </div>
                  <StatusBadge
                    status={resident.status}
                    label={residentStatusLabels[resident.status]}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Room
                    </dt>
                    <dd className="mt-0.5 font-medium text-brand-strong">
                      {resident.roomNumber ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Admitted
                    </dt>
                    <dd className="mt-0.5 text-brand-strong">
                      {formatDate(resident.admissionDate)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Facility
                    </dt>
                    <dd className="mt-0.5 truncate text-brand-strong">
                      {resident.facilityName ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {resident.reference}
                  </span>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={`/dashboard/care-homes/residents/${resident.id}`}>
                      Open record
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
