import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CharityNav } from "@/components/charity/charity-nav";
import { CharityPageHeader } from "@/features/charity/components/charity-page-header";
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
  AllocationDialogForm,
  CampaignDialogForm,
  CampaignExpenseDialogForm,
  CampaignReviewForm,
  ImpactReportDialogForm,
  SubmitCampaignButton,
} from "@/features/charity/components/charity-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  campaignAllocationTypeLabels,
  campaignExpenseStatusLabels,
  campaignReviewDecisionLabels,
  charityCampaignStatusLabels,
  donationStatusLabels,
} from "@/lib/validation/charity";
import { requireAnyCharityPage } from "@/server/charity/access";
import { getCampaignDetail } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Campaign",
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ organisation?: string }>;
}) {
  const { campaignId } = await params;
  const query = await searchParams;
  const context = await requireAnyCharityPage({
    permissions: [
      "charity_campaign_manage",
      "charity_campaign_approve",
      "donor_report_view",
    ],
    requestedOrganisation: query.organisation,
    redirectTo: `/dashboard/charity/campaigns/${campaignId}`,
  });

  const detail = await getCampaignDetail(context.workspace, campaignId);
  if (!detail) notFound();

  const campaign = detail.campaign;
  const canManage = await context.can("charity_campaign_manage");
  const canApprove = await context.can("charity_campaign_approve");
  const available = campaign.receivedMinorUnits - campaign.committedMinorUnits;
  const progress =
    campaign.fundingTargetMinorUnits > 0
      ? Math.round(
          (campaign.receivedMinorUnits / campaign.fundingTargetMinorUnits) * 100,
        )
      : 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <CharityPageHeader
        eyebrow="Charity campaign"
        title={campaign.title}
        description={`${campaign.purpose} · ${formatDate(campaign.startsOn)}${campaign.endsOn ? ` – ${formatDate(campaign.endsOn)}` : ""}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          {
            label: "Campaigns",
            href: `/dashboard/charity/campaigns?organisation=${context.workspace.organisationId}`,
          },
          { label: campaign.title },
        ]}
        actions={
          <>
            <StatusBadge
              status={campaign.status}
              label={charityCampaignStatusLabels[campaign.status]}
            />
            {canManage ? (
              <CampaignDialogForm organisationId={context.workspace.organisationId} campaign={campaign} />
            ) : null}
            {canManage && campaign.status === "draft" ? (
              <SubmitCampaignButton
                organisationId={context.workspace.organisationId}
                campaignId={campaign.id}
              />
            ) : null}
          </>
        }
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/campaigns"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Funding target</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(campaign.fundingTargetMinorUnits, campaign.currency)}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Received (net)</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(campaign.receivedMinorUnits, campaign.currency)}
          </p>
          <p className="text-xs text-muted-foreground">{progress}% of target</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Committed</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(campaign.committedMinorUnits, campaign.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatMoney(campaign.disbursedMinorUnits, campaign.currency)} disbursed
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Uncommitted</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(available, campaign.currency)}
          </p>
        </Card>
      </div>

      {canApprove && campaign.status === "pending_approval" ? (
        <Card className="space-y-4 border-brand-warning/40 p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Review this campaign
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approving publishes the campaign publicly. Approval requires a
              reviewer with campaign approval permission; self-approval is not
              available to the campaign manager.
            </p>
          </div>
          <CampaignReviewForm
            organisationId={context.workspace.organisationId}
            campaignId={campaign.id}
          />
        </Card>
      ) : null}

      {campaign.description || campaign.beneficiaryCriteria ? (
        <Card className="space-y-3 p-4">
          {campaign.description ? (
            <div>
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                About this campaign
              </h2>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {campaign.description}
              </p>
            </div>
          ) : null}
          {campaign.beneficiaryCriteria ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Beneficiary criteria
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-strong">
                {campaign.beneficiaryCriteria}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="p-3.5">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Review history
        </h2>
        {detail.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews recorded yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {detail.reviews.map((review) => (
              <li key={review.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-brand-strong">
                    {campaignReviewDecisionLabels[review.decision]}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.notes}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(review.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Donations
            </h2>
            <p className="text-xs text-muted-foreground">
              {detail.donations.length} record{detail.donations.length === 1 ? "" : "s"}
            </p>
          </div>
          {detail.donations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No donations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.donations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="text-sm text-brand-strong">
                      {donation.donorLabel}
                      {donation.isPublic ? (
                        <p className="text-xs text-muted-foreground">Public acknowledgement</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                      {formatMoney(donation.amountMinorUnits, campaign.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={donation.status}
                        label={donationStatusLabels[donation.status]}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(donation.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Allocations
            </h2>
            {canManage ? (
              <AllocationDialogForm
                organisationId={context.workspace.organisationId}
                campaignId={campaign.id}
                currency={campaign.currency}
              />
            ) : null}
          </div>
          {detail.allocations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No funds have been allocated yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {detail.allocations.map((allocation) => (
                <li key={allocation.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium text-brand-strong">{allocation.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaignAllocationTypeLabels[allocation.allocationType]} ·{" "}
                      {formatDateTime(allocation.createdAt)}
                    </p>
                  </div>
                  <span className="tabular-nums text-brand-strong">
                    {formatMoney(allocation.amountMinorUnits, campaign.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Campaign expenses
            </h2>
            <p className="text-xs text-muted-foreground">
              Expenses are append-only. Approved and paid expenses count as disbursed.
            </p>
          </div>
          {canManage ? (
            <CampaignExpenseDialogForm
              organisationId={context.workspace.organisationId}
              campaignId={campaign.id}
              currency={campaign.currency}
            />
          ) : null}
        </div>
        {detail.expenses.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No expenses recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Incurred</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm text-brand-strong">
                    {expense.category}
                    {expense.description ? (
                      <p className="text-xs text-muted-foreground">{expense.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.payee ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(expense.incurredOn)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(expense.amountMinorUnits, campaign.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={expense.status}
                      label={campaignExpenseStatusLabels[expense.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.receiptReference ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Impact reports
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Published reports appear on the public campaign page.
            </p>
          </div>
          {canManage ? (
            <ImpactReportDialogForm
              organisationId={context.workspace.organisationId}
              campaignId={campaign.id}
            />
          ) : null}
        </div>
        {detail.impactReports.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No impact reports yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {detail.impactReports.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-brand-strong">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.isPublished
                      ? `Published ${formatDateTime(report.publishedAt)}`
                      : "Draft"}
                  </p>
                </div>
                <StatusBadge
                  status={report.isPublished ? "published" : "draft"}
                  label={report.isPublished ? "Published" : "Draft"}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button asChild variant="ghost">
        <Link href={`/dashboard/charity/campaigns?organisation=${context.workspace.organisationId}`}>
          Back to campaigns
        </Link>
      </Button>
    </div>
  );
}
