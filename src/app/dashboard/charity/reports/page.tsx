import type { Metadata } from "next";

import { CharityNav } from "@/components/charity/charity-nav";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
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
import { formatMoney } from "@/lib/format";
import { scholarshipAwardStatusLabels } from "@/lib/validation/charity";
import { requireAnyCharityPage } from "@/server/charity/access";
import { getCharityReports } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Charity reports",
};

export default async function CharityReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string }>;
}) {
  const params = await searchParams;
  const context = await requireAnyCharityPage({
    permissions: [
      "charity_campaign_manage",
      "donor_report_view",
      "financial_report_view",
    ],
    requestedOrganisation: params.organisation,
    redirectTo: "/dashboard/charity/reports",
  });

  const reports = await getCharityReports(context.workspace);
  const received = reports.campaigns.reduce(
    (sum, campaign) => sum + campaign.receivedMinorUnits,
    0,
  );
  const committed = reports.campaigns.reduce(
    (sum, campaign) => sum + campaign.committedMinorUnits,
    0,
  );
  const disbursed = reports.campaigns.reduce(
    (sum, campaign) => sum + campaign.disbursedMinorUnits,
    0,
  );
  const awarded = reports.outcomes.reduce(
    (sum, row) => sum + row.awardedMinorUnits,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Charity"
        title="Reports"
        description="Separate reporting for donation income, committed funds, campaign disbursements and scholarship awards. Donations are never shown as unrestricted revenue."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          { label: "Reports" },
        ]}
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/reports"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Donations received</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(received, "NGN")}
          </p>
          <p className="text-xs text-muted-foreground">Net of refunds</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Committed</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(committed, "NGN")}
          </p>
          <p className="text-xs text-muted-foreground">Allocated to campaign purposes</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Disbursed</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(disbursed, "NGN")}
          </p>
          <p className="text-xs text-muted-foreground">Approved and paid expenses</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Scholarships awarded</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(awarded, "NGN")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Campaign finance
          </h2>
        </div>
        {reports.campaigns.length === 0 ? (
          <EmptyState
            title="No campaign finance"
            description="Campaign income and disbursements will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">Uncommitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {campaign.title}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatMoney(campaign.fundingTargetMinorUnits, campaign.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(campaign.receivedMinorUnits, campaign.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatMoney(campaign.committedMinorUnits, campaign.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatMoney(campaign.disbursedMinorUnits, campaign.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(
                      campaign.receivedMinorUnits - campaign.committedMinorUnits,
                      campaign.currency,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Scholarship outcomes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completion, internship and employment outcomes are only counted where
            they have been recorded and are shareable.
          </p>
        </div>
        {reports.outcomes.length === 0 ? (
          <EmptyState
            title="No scholarship outcomes"
            description="Awards and outcomes will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programme</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Awards</TableHead>
                <TableHead className="text-right">Awarded</TableHead>
                <TableHead className="text-right">Completions</TableHead>
                <TableHead className="text-right">Internships</TableHead>
                <TableHead className="text-right">Employment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.outcomes.map((row, index) => (
                <TableRow key={`${row.programmeId}-${row.status}-${index}`}>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {row.programmeName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={row.status}
                      label={scholarshipAwardStatusLabels[row.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.awardCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(row.awardedMinorUnits, "NGN")}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.completionsRecorded}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.internshipOutcomes}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {row.employmentOutcomes}
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
