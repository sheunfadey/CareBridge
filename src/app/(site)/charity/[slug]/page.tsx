import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { Button } from "@/components/ui/button";
import { DonateForm } from "@/features/charity/components/charity-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPublicCampaign } from "@/server/charity/queries";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { title: title || "Charity campaign" };
}

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const detail = await getPublicCampaign(slug);
  if (!detail) notFound();

  const user = await getCurrentUser();
  const campaign = detail.campaign;
  const progress = Math.min(campaign.progressPercent, 100);

  return (
    <>
      <SiteSection tone="ivory">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Charity campaign"
              title={campaign.title}
              description={campaign.purpose}
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#donate">Donate</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/charity">All campaigns</Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(campaign.startsOn)}
              {campaign.endsOn ? ` – ${formatDate(campaign.endsOn)}` : ""}
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-brand-navy">
                {formatMoney(campaign.receivedMinorUnits, campaign.currency)} raised
              </span>
              <span className="text-muted-foreground">{campaign.progressPercent}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-teal"
                style={{ width: `${progress}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Target</dt>
                <dd className="font-medium text-brand-navy">
                  {formatMoney(campaign.fundingTargetMinorUnits, campaign.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Donations</dt>
                <dd className="font-medium text-brand-navy">{campaign.donationCount}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Progress counts verified donations only, net of refunds. Donations
              are recorded separately from commercial revenue.
            </p>
          </div>
        </div>
      </SiteSection>

      {campaign.description ? (
        <SiteSection>
          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="font-heading text-2xl font-semibold text-brand-navy">
              About this campaign
            </h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {campaign.description}
            </p>
          </div>
        </SiteSection>
      ) : null}

      <SiteSection tone="sky" id="donate">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <SectionHeading
            eyebrow="Donate"
            title="Support this campaign"
            description="Payments are processed securely and verified on the server. A donation is recorded only after the provider confirms it."
          />
          <div className="rounded-xl bg-card p-6 shadow-card ring-1 ring-foreground/10">
            {user ? (
              <DonateForm campaignId={campaign.campaignId} campaignTitle={campaign.title} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in to donate and keep a receipt in your dashboard.
                </p>
                <Button asChild>
                  <Link href={`/login?redirectTo=${encodeURIComponent(`/charity/${campaign.slug}`)}`}>
                    Sign in to donate
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SiteSection>

      {detail.donors.length > 0 || detail.impactReports.length > 0 ? (
        <SiteSection>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-xl font-semibold text-brand-navy">
                Public supporters
              </h2>
              {detail.donors.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No donors have chosen public acknowledgement yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {detail.donors.map((donor, index) => (
                    <li key={`${donor.displayName}-${index}`} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-brand-navy">{donor.displayName}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatMoney(donor.amountMinorUnits, campaign.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-brand-navy">
                Impact updates
              </h2>
              {detail.impactReports.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No impact reports have been published yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {detail.impactReports.map((report) => (
                    <li key={report.id} className="rounded-lg border border-border p-4">
                      <p className="font-medium text-brand-navy">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.publishedAt ? formatDateTime(report.publishedAt) : ""}
                      </p>
                      {report.summary ? (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {report.summary}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SiteSection>
      ) : null}
    </>
  );
}
