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
import { formatDate } from "@/lib/format";
import {
  carePlanAccessLabels,
  carePlanStatusLabels,
} from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listCarePlans } from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Care plans",
};

export default async function CarePlansPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "resident_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/plans",
  });

  const plans = await listCarePlans(context.workspace, context.facility?.id);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Care plans"
        description="Versioned care plans with an approval workflow. Restricted plans are only visible to plan managers."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Care plans" },
        ]}
        actions={
          <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/plans"
      />

      <Card className="overflow-hidden p-0">
        {plans.length === 0 ? (
          <EmptyState
            title="No care plans"
            description="Create a care plan from a resident's record. Every change becomes a new immutable version."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Review due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium text-brand-strong">
                    {plan.title}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/care-homes/residents/${plan.residentId}`}
                      className="text-sm text-brand-strong hover:text-brand-teal"
                    >
                      {plan.residentName ?? "Resident"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {carePlanAccessLabels[plan.accessLevel as "standard" | "restricted"]}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {plan.versionCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {plan.reviewDueOn ? formatDate(plan.reviewDueOn) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={plan.status}
                      label={carePlanStatusLabels[plan.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/care-homes/plans/${plan.id}`}>
                        Open
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
