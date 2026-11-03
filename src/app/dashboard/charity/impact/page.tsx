import type { Metadata } from "next";
import Link from "next/link";

import { CharityNav } from "@/components/charity/charity-nav";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImpactReportDialogForm } from "@/features/charity/components/charity-forms";
import { formatDateTime } from "@/lib/format";
import { requireAnyCharityPage } from "@/server/charity/access";
import {
  listCampaigns,
  listImpactReports,
} from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Impact reports",
};

export default async function ImpactPage({
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
    redirectTo: "/dashboard/charity/impact",
  });

  const [reports, campaigns] = await Promise.all([
    listImpactReports(context.workspace),
    listCampaigns(context.workspace),
  ]);
  const canManage = await context.can("charity_campaign_manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Charity"
        title="Impact reports"
        description="Published updates show donors how campaign funds were used. Drafts remain internal until published."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          { label: "Impact" },
        ]}
        actions={
          canManage ? (
            <ImpactReportDialogForm
              organisationId={context.workspace.organisationId}
              campaigns={campaigns.map((campaign) => ({
                id: campaign.id,
                title: campaign.title,
              }))}
            />
          ) : null
        }
      />

      <CharityNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        active="/impact"
      />

      <Card className="overflow-hidden p-0">
        {reports.length === 0 ? (
          <EmptyState
            title="No impact reports"
            description="Publish an update to show campaign progress and outcomes to donors."
          />
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-base font-semibold text-brand-navy">
                      {report.title}
                    </h2>
                    <StatusBadge
                      status={report.isPublished ? "published" : "draft"}
                      label={report.isPublished ? "Published" : "Draft"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.campaignTitle} ·{" "}
                    {report.isPublished
                      ? `published ${formatDateTime(report.publishedAt)}`
                      : `created ${formatDateTime(report.createdAt)}`}
                  </p>
                  {report.summary ? (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {report.summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/charity/campaigns/${report.campaignId}`}>
                      Campaign
                    </Link>
                  </Button>
                  {canManage ? (
                    <ImpactReportDialogForm
                      organisationId={context.workspace.organisationId}
                      campaignId={report.campaignId}
                      report={{
                        id: report.id,
                        campaignId: report.campaignId,
                        title: report.title,
                        summary: report.summary,
                        metrics: report.metrics,
                        isPublished: report.isPublished,
                      }}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
