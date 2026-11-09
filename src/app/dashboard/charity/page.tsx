import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpenCheckIcon,
  HandHeartIcon,
  HeartHandshakeIcon,
  ReceiptTextIcon,
  WalletIcon,
} from "lucide-react";

import { CharityNav } from "@/components/charity/charity-nav";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AwardResponseButtons,
  ScholarshipApplicationDialogForm,
} from "@/features/charity/components/charity-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  charityCampaignStatusLabels,
  donationStatusLabels,
  scholarshipApplicationStatusLabels,
  scholarshipAwardStatusLabels,
  scholarshipCoverageLabels,
} from "@/lib/validation/charity";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  canInCharityWorkspace,
  resolveCharityWorkspace,
} from "@/server/charity/access";
import {
  getCharityAdminSummary,
  listCampaigns,
  listMyDonations,
  listMyScholarships,
  listOpenScholarshipProgrammes,
} from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Charity and scholarships",
};

export default async function CharityPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard%2Fcharity");
  }

  const workspace = await resolveCharityWorkspace(user, {
    requested: params.organisation,
  });

  const [donations, scholarships, openProgrammes] = await Promise.all([
    listMyDonations(user.id),
    listMyScholarships(user.id),
    listOpenScholarshipProgrammes(),
  ]);

  const adminSummary = workspace
    ? await getCharityAdminSummary(workspace)
    : null;
  const campaigns = workspace ? await listCampaigns(workspace) : [];

  const canManageCampaigns = workspace
    ? await canInCharityWorkspace(
        workspace.organisationId,
        "charity_campaign_manage",
      )
    : false;

  const canManageScholarships = workspace
    ? await canInCharityWorkspace(
        workspace.organisationId,
        "scholarship_manage",
      )
    : false;

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Charity"
        title={workspace ? workspace.name : "Charity and scholarships"}
        description={
          workspace
            ? "Campaigns, donations, scholarship awards and impact reporting. Donated funds are tracked separately from commercial revenue."
            : "Your donations, receipts and scholarship applications."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity" },
        ]}
        actions={
          <>
            {workspace && canManageCampaigns ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/charity/campaigns?organisation=${workspace.organisationId}`}>
                  Manage campaigns
                </Link>
              </Button>
            ) : null}
            {workspace && canManageScholarships ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/charity/scholarships?organisation=${workspace.organisationId}`}>
                  Scholarships
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href="/charity">Browse campaigns</Link>
            </Button>
          </>
        }
      />

      <CharityNav
        user={user}
        organisationId={workspace?.organisationId}
        active=""
      />

      {params.payment === "success" ? (
        <Card className="border-brand-teal/40 bg-brand-teal/5 p-4 text-sm text-brand-strong">
          Thank you. Your donation will appear below once the provider
          confirmation is verified. Receipts become available at the same time.
        </Card>
      ) : null}

      {adminSummary ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MetricCard
              label="Active campaigns"
              value={adminSummary.activeCampaigns}
              hint={`${adminSummary.pendingApprovals} awaiting approval`}
              icon={<HeartHandshakeIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Received"
              value={formatMoney(adminSummary.receivedMinorUnits, "NGN")}
              hint="Verified donations net of refunds"
              icon={<HandHeartIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Committed"
              value={formatMoney(adminSummary.committedMinorUnits, "NGN")}
              hint={`${formatMoney(adminSummary.disbursedMinorUnits, "NGN")} disbursed`}
              icon={<WalletIcon aria-hidden="true" />}
            />
            <MetricCard
              label="Scholarships awarded"
              value={formatMoney(adminSummary.awardedMinorUnits, "NGN")}
              hint={`${adminSummary.awardsCount} awards · ${adminSummary.studentsSponsored} students`}
              icon={<BookOpenCheckIcon aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
            <Card className="p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
                  Campaigns
                </h2>
                <Link
                  href={`/dashboard/charity/campaigns?organisation=${workspace!.organisationId}`}
                  className="text-sm font-medium text-brand-teal hover:underline"
                >
                  View all
                </Link>
              </div>
              {campaigns.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No campaigns yet. Create one and submit it for approval.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <li key={campaign.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <Link
                          href={`/dashboard/charity/campaigns/${campaign.id}`}
                          className="text-sm font-medium text-brand-strong hover:text-brand-teal"
                        >
                          {campaign.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(campaign.receivedMinorUnits, campaign.currency)} of{" "}
                          {formatMoney(campaign.fundingTargetMinorUnits, campaign.currency)}
                        </p>
                      </div>
                      <StatusBadge
                        status={campaign.status}
                        label={charityCampaignStatusLabels[campaign.status]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
                  Recent donations
                </h2>
                <Link
                  href={`/dashboard/charity/reports?organisation=${workspace!.organisationId}`}
                  className="text-sm font-medium text-brand-teal hover:underline"
                >
                  Reports
                </Link>
              </div>
              {adminSummary.recentDonations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No donations have been verified yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {adminSummary.recentDonations.map((donation) => (
                    <li key={donation.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-brand-strong">{donation.donorLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {donation.campaignTitle} · {formatDateTime(donation.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums text-brand-strong">
                          {formatMoney(donation.amountMinorUnits, "NGN")}
                        </p>
                        <StatusBadge
                          status={donation.status}
                          label={donationStatusLabels[donation.status]}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
        <Card className="p-3.5">
          <div className="flex items-center gap-2">
            <ReceiptTextIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
              My donations
            </h2>
          </div>
          {donations.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You have not made a donation yet.{" "}
              <Link href="/charity" className="font-medium text-brand-teal hover:underline">
                Browse campaigns
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {donations.map((donation) => (
                <li key={donation.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-brand-strong">{donation.campaignTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(donation.paidAt ?? donation.createdAt)}
                      {donation.receiptReference ? ` · ${donation.receiptReference}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-brand-strong">
                      {formatMoney(donation.amountMinorUnits, donation.currency)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <StatusBadge
                        status={donation.status}
                        label={donationStatusLabels[donation.status]}
                      />
                      <Link
                        href={`/dashboard/charity/donations/${donation.id}/receipt`}
                        className="text-xs font-medium text-brand-teal hover:underline"
                      >
                        Receipt
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center gap-2">
            <BookOpenCheckIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
              My scholarships
            </h2>
          </div>
          {scholarships.applications.length === 0 && scholarships.awards.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No applications yet. Open programmes are listed below.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {scholarships.awards.length > 0 ? (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Awards
                  </h3>
                  <ul className="mt-2 divide-y divide-border">
                    {scholarships.awards.map((award) => (
                      <li key={award.id} className="py-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-brand-strong">{award.programmeName}</p>
                          <StatusBadge
                            status={award.status}
                            label={scholarshipAwardStatusLabels[award.status]}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(award.amountMinorUnits, award.currency)} ·{" "}
                          {scholarshipCoverageLabels[award.coverage]} award
                        </p>
                        {award.status === "awarded" ? (
                          <div className="mt-2">
                            <AwardResponseButtons awardId={award.id} />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {scholarships.applications.length > 0 ? (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Applications
                  </h3>
                  <ul className="mt-2 divide-y divide-border">
                    {scholarships.applications.map((application) => (
                      <li key={application.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                        <div>
                          <p className="font-medium text-brand-strong">{application.programmeName}</p>
                          <p className="text-xs text-muted-foreground">
                            Applied {formatDate(application.createdAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={application.status}
                          label={scholarshipApplicationStatusLabels[application.status]}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-3.5">
        <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
          Open scholarship programmes
        </h2>
        {openProgrammes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No programmes are open for applications right now.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
            {openProgrammes.map((programme) => {
              const applied = scholarships.applications.some(
                (application) => application.programmeId === programme.id,
              );
              return (
                <div key={programme.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-brand-strong">{programme.name}</h3>
                    <StatusBadge
                      status="open"
                      label={scholarshipCoverageLabels[programme.coverage]}
                    />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {programme.description ?? programme.eligibility ?? ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Up to {formatMoney(programme.maxAwardMinorUnits, programme.currency)}
                    {programme.closesOn ? ` · closes ${formatDate(programme.closesOn)}` : ""}
                  </p>
                  <div className="mt-3">
                    {applied ? (
                      <p className="text-xs font-medium text-brand-teal">
                        You have applied to this programme.
                      </p>
                    ) : (
                      <ScholarshipApplicationDialogForm programmeId={programme.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
