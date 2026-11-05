import type { Metadata } from "next";
import Link from "next/link";

import { CharityNav } from "@/components/charity/charity-nav";
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
import { ProgrammeDialogForm } from "@/features/charity/components/charity-forms";
import { formatDate, formatMoney } from "@/lib/format";
import {
  scholarshipCoverageLabels,
  scholarshipProgrammeStatusLabels,
} from "@/lib/validation/charity";
import { requireAnyCharityPage } from "@/server/charity/access";
import { listCourseOptions, listProgrammes } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Scholarships",
};

export default async function ScholarshipsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string }>;
}) {
  const params = await searchParams;
  const context = await requireAnyCharityPage({
    permissions: ["scholarship_manage", "scholarship_review"],
    requestedOrganisation: params.organisation,
    redirectTo: "/dashboard/charity/scholarships",
  });

  const [programmes, courses] = await Promise.all([
    listProgrammes(context.workspace),
    listCourseOptions(),
  ]);
  const canManage = await context.can("scholarship_manage");

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Charity"
        title="Scholarships"
        description="Programmes, applications, awards and outcomes. Full or partial awards can allocate a course."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          { label: "Scholarships" },
        ]}
        actions={
          canManage ? (
            <ProgrammeDialogForm
              organisationId={context.workspace.organisationId}
              courses={courses}
            />
          ) : null
        }
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/scholarships"
      />

      <Card className="overflow-hidden p-0">
        {programmes.length === 0 ? (
          <EmptyState
            title="No scholarship programmes"
            description="Create a programme with eligibility criteria and a maximum award, then open it for applications."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead className="text-right">Max award</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Awarded</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programmes.map((programme) => (
                <TableRow key={programme.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/charity/scholarships/${programme.id}`}
                      className="font-medium text-brand-strong hover:text-brand-teal"
                    >
                      {programme.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={programme.status}
                      label={scholarshipProgrammeStatusLabels[programme.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {scholarshipCoverageLabels[programme.coverage]}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(programme.maxAwardMinorUnits, programme.currency)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(programme.opensOn)}
                    {programme.closesOn ? ` – ${formatDate(programme.closesOn)}` : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {programme.applicantCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(programme.awardedMinorUnits, programme.currency)}
                    <p className="text-xs text-muted-foreground">
                      {programme.awardedCount} award{programme.awardedCount === 1 ? "" : "s"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/charity/scholarships/${programme.id}`}>
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
