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
import { CampaignDialogForm } from "@/features/charity/components/charity-forms";
import { formatDate, formatMoney } from "@/lib/format";
import { charityCampaignStatusLabels } from "@/lib/validation/charity";
import { requireAnyCharityPage } from "@/server/charity/access";
import { listCampaigns } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Charity campaigns",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string }>;
}) {
  const params = await searchParams;
  const context = await requireAnyCharityPage({
    permissions: [
      "charity_campaign_manage",
      "charity_campaign_approve",
      "donor_report_view",
    ],
    requestedOrganisation: params.organisation,
    redirectTo: "/dashboard/charity/campaigns",
  });

  const campaigns = await listCampaigns(context.workspace);
  const canManage = await context.can("charity_campaign_manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Charity"
        title="Campaigns"
        description="Create campaigns, submit them for independent review and track received, committed and disbursed funds."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          { label: "Campaigns" },
        ]}
        actions={
          canManage ? (
            <CampaignDialogForm organisationId={context.workspace.organisationId} />
          ) : null
        }
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/campaigns"
      />

      <Card className="overflow-hidden p-0">
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create a campaign, define its purpose and funding target, then submit it for approval."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const progress =
                  campaign.fundingTargetMinorUnits > 0
                    ? Math.round(
                        (campaign.receivedMinorUnits / campaign.fundingTargetMinorUnits) * 100,
                      )
                    : 0;
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/charity/campaigns/${campaign.id}`}
                        className="font-medium text-brand-strong hover:text-brand-teal"
                      >
                        {campaign.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{campaign.purpose}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={campaign.status}
                        label={charityCampaignStatusLabels[campaign.status]}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(campaign.startsOn)}
                      {campaign.endsOn ? ` – ${formatDate(campaign.endsOn)}` : ""}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                      {formatMoney(campaign.receivedMinorUnits, "NGN")}
                      <p className="text-xs text-muted-foreground">
                        of {formatMoney(campaign.fundingTargetMinorUnits, "NGN")} · {progress}%
                      </p>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatMoney(campaign.committedMinorUnits, "NGN")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {formatMoney(campaign.disbursedMinorUnits, "NGN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/charity/campaigns/${campaign.id}`}>
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
