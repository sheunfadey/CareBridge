import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
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

      <Card className="overflow-hidden p-0">
        {residents.length === 0 ? (
          <EmptyState
            title="No residents found"
            description={
              params.q
                ? "No resident matches that search."
                : "Resident records will appear here once they are added."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/care-homes/residents/${resident.id}`}
                      className="font-medium text-brand-strong hover:text-brand-teal"
                    >
                      {resident.firstName} {resident.lastName}
                    </Link>
                    {resident.preferredName ? (
                      <p className="text-xs text-muted-foreground">
                        Prefers {resident.preferredName}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {resident.reference}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {resident.roomNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {resident.facilityName ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(resident.admissionDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={resident.status}
                      label={residentStatusLabels[resident.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/care-homes/residents/${resident.id}`}>
                        Open record
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
