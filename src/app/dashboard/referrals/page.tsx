import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BadgeCheckIcon,
  CircleDollarSignIcon,
  ClockIcon,
  Share2Icon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
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
import {
  PayoutAccountForm,
  ReferralApplicationForm,
  ReferralLinkCard,
  RequestPayoutCard,
} from "@/features/referrals/components/partner-forms";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getPublicEnv } from "@/lib/env";
import {
  commissionStatusLabels,
  payoutStatusLabels,
  referralPartnerStatusLabels,
} from "@/lib/validation/payments";
import { getCurrentUser } from "@/server/auth/current-user";
import { getReferralDashboard } from "@/server/referrals/queries";

export const metadata: Metadata = {
  title: "Referrals",
};

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard%2Freferrals");
  }

  const data = await getReferralDashboard(user);
  const baseUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const currency = data.policies[0]?.currency ?? "NGN";
  const partner = data.partner;

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Growth"
        title="Referral programme"
        description="Introduce learners and organisations to HillCrest. Commissions follow the published policy and become payable only when they qualify."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Referrals" },
        ]}
      />

      {!partner ? (
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Join the referral programme
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Apply once. Finance reviews your application before your
                referral link becomes active.
              </p>
            </div>
            <ReferralApplicationForm
              defaultName={user.fullName ?? ""}
              defaultPhone=""
            />
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              How it works
            </h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>1. Apply and wait for finance approval.</li>
              <li>2. Share your personal referral link.</li>
              <li>3. Referred payments are attributed to you for the policy window.</li>
              <li>4. Qualifying commissions become payable after the payout delay.</li>
              <li>5. Add verified payout details and request a payout.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Commission amounts and eligibility depend on the published
              policy. Not every referral earns a commission.
            </p>
          </Card>
        </div>
      ) : null}

      {partner && partner.status !== "approved" ? (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Application status
            </h2>
            <StatusBadge
              status={partner.status}
              label={referralPartnerStatusLabels[partner.status]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {partner.status === "pending"
              ? "Your application is waiting for finance review. You will be able to share a referral link once it is approved."
              : partner.status === "rejected"
                ? partner.rejectionReason ??
                  "Your application was not approved. Contact support if you believe this is a mistake."
                : partner.suspensionReason ??
                  "Your partner account is suspended. Contact support for details."}
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Applied</dt>
              <dd className="font-medium text-brand-strong">
                {formatDateTime(partner.appliedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Partner code</dt>
              <dd className="font-mono text-brand-strong">{partner.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Display name</dt>
              <dd className="font-medium text-brand-strong">
                {partner.displayName ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}

      {partner?.status === "approved" ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <MetricCard
              label="Approved balance"
              value={formatMoney(data.balance.approvedMinorUnits, currency)}
              icon={<WalletIcon aria-hidden="true" />}
              hint="Available to request"
              href="#request-payout"
            />
            <MetricCard
              label="Pending"
              value={formatMoney(data.balance.pendingMinorUnits, currency)}
              icon={<ClockIcon aria-hidden="true" />}
              hint="Awaiting eligibility or approval"
              href="#commission-ledger"
            />
            <MetricCard
              label="In payout"
              value={formatMoney(data.balance.inPayoutMinorUnits, currency)}
              icon={<CircleDollarSignIcon aria-hidden="true" />}
              hint="Held against a payout request"
              href="#payout-requests"
            />
            <MetricCard
              label="Paid to date"
              value={formatMoney(data.balance.paidMinorUnits, currency)}
              icon={<BadgeCheckIcon aria-hidden="true" />}
              hint="Confirmed transfers"
              href="#payout-requests"
            />
          </div>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <Share2Icon
                  className="size-5 text-brand-teal"
                  aria-hidden="true"
                />
                <h2 className="font-heading text-lg font-semibold text-brand-strong">
                  Your referral link
                </h2>
              </div>
              <ReferralLinkCard code={partner.code} baseUrl={baseUrl} />
            </Card>

            <Card id="request-payout" className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <WalletIcon
                  className="size-5 text-brand-teal"
                  aria-hidden="true"
                />
                <h2 className="font-heading text-lg font-semibold text-brand-strong">
                  Request a payout
                </h2>
              </div>
              <RequestPayoutCard
                balance={data.balance}
                account={data.account}
                minimumPayoutMinorUnits={data.minimumPayoutMinorUnits}
                currency={currency}
              />
            </Card>
          </div>

          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Payout details
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Finance uses these details for payouts. Changes require
                verification again.
              </p>
            </div>
            <PayoutAccountForm account={data.account} />
          </Card>

          <Card id="commission-ledger" className="overflow-hidden p-0">
            <div className="border-b border-border p-4">
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Commission ledger
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every commission entry is recorded in an append-only ledger.
              </p>
            </div>
            {data.commissions.length === 0 ? (
              <EmptyState
                title="No commission entries yet"
                description="Referrals that qualify under the published policy will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Basis</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(commission.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm capitalize text-muted-foreground">
                        {commission.basis.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {formatMoney(commission.grossMinorUnits, commission.currency)}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-brand-strong">
                        {formatMoney(commission.amountMinorUnits, commission.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={commission.status}
                          label={commissionStatusLabels[commission.status]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card id="payout-requests" className="overflow-hidden p-0">
            <div className="border-b border-border p-4">
              <h2 className="font-heading text-lg font-semibold text-brand-strong">
                Payout requests
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Payouts are reviewed by finance. Transfers are sent only after
                approval and are disabled until provider transfers are enabled.
              </p>
            </div>
            {data.payouts.length === 0 ? (
              <EmptyState
                title="No payout requests"
                description="Request a payout once you have approved commissions."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(payout.requestedAt)}
                      </TableCell>
                      <TableCell className="text-sm font-medium tabular-nums text-brand-strong">
                        {formatMoney(payout.amountMinorUnits, payout.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={payout.status}
                          label={payoutStatusLabels[payout.status]}
                        />
                      </TableCell>
                      <TableCell className="max-w-72 text-sm text-muted-foreground">
                        {payout.decisionReason ??
                          payout.failureReason ??
                          "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(payout.paidAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border p-4">
                <h2 className="font-heading text-lg font-semibold text-brand-strong">
                  Referral activity
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Attribution is recorded per referred account and expires on
                  the date shown.
                </p>
              </div>
              {data.attributions.length === 0 ? (
                <EmptyState
                  title="No referrals attributed yet"
                  description="Use your referral link to introduce a learner or organisation."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attributed</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.attributions.map((attribution) => (
                      <TableRow key={attribution.id}>
                        <TableCell className="font-mono text-sm text-brand-strong">
                          {attribution.referralCode}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={attribution.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateTime(attribution.attributedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateTime(attribution.expiresAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

            <Card className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-5 text-brand-teal" aria-hidden="true" />
                <h2 className="font-heading text-lg font-semibold text-brand-strong">
                  Published policy
                </h2>
              </div>
              {data.policies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No commission policy is published yet. Finance must publish
                  one before commissions can be calculated.
                </p>
              ) : (
                <ul className="space-y-4">
                  {data.policies.map((policy) => (
                    <li key={policy.id} className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-brand-strong">
                          {policy.name}
                        </p>
                        {policy.isActive ? (
                          <StatusBadge status="active" />
                        ) : (
                          <StatusBadge status="inactive" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {policy.commissionType === "percentage"
                          ? `${(policy.percentageBps ?? 0) / 100}% of the eligible amount`
                          : `${formatMoney(policy.fixedAmountMinorUnits, policy.currency)} per qualifying payment`}
                        {" · "}
                        {policy.payoutDelayDays}-day payout delay
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Eligible payments:{" "}
                        {policy.eligiblePurposes
                          .map((purpose) => purpose.replaceAll("_", " "))
                          .join(", ")}
                        {policy.minimumPayoutMinorUnits > 0
                          ? ` · Minimum payout ${formatMoney(policy.minimumPayoutMinorUnits, policy.currency)}`
                          : null}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
