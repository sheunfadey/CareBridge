import type { Metadata } from "next";
import { AlertTriangleIcon } from "lucide-react";

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
  CommissionReviewActions,
  PartnerReviewActions,
  PayoutReviewActions,
  PolicyDialog,
  VerifyPayoutAccountButton,
} from "@/features/referrals/components/admin-referral-forms";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  commissionStatusLabels,
  payoutStatusLabels,
  referralPartnerStatusLabels,
} from "@/lib/validation/payments";
import { areTransfersEnabled } from "@/lib/payments/provider";
import { requireAnyPermissionPage } from "@/server/auth/require-permission";
import { getAdminReferralData } from "@/server/referrals/queries";

export const metadata: Metadata = {
  title: "Referral administration",
};

export default async function AdminReferralsPage() {
  const user = await requireAnyPermissionPage("/dashboard/admin/referrals", [
    "referral_rules_manage",
    "commission_approve",
    "payout_approve",
  ]);

  const data = await getAdminReferralData(user);
  const transfersEnabled = areTransfersEnabled();
  const currency = data.policies[0]?.currency ?? "NGN";

  const pendingPartners = data.partners.filter(
    (partner) => partner.status === "pending",
  );
  const reviewableCommissions = data.commissions.filter((commission) =>
    ["pending", "eligible"].includes(commission.status),
  );
  const pendingPayouts = data.payouts.filter((payout) =>
    ["pending", "approved", "failed"].includes(payout.status),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Referrals and commissions"
        description="Approve partners, publish commission policy, review the append-only ledger and approve payouts. Provider transfers stay disabled until explicitly enabled."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" },
          { label: "Referrals" },
        ]}
      />

      {!transfersEnabled ? (
        <Card className="flex gap-3 border-brand-warning/30 bg-brand-warning/5 p-4">
          <AlertTriangleIcon
            className="mt-0.5 size-5 shrink-0 text-brand-warning"
            aria-hidden="true"
          />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-brand-navy">
              Provider transfers are disabled
            </p>
            <p>
              Payout requests can be reviewed and approved, but no money can be
              sent until the payout arrangement is approved and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                PAYSTACK_TRANSFERS_ENABLED=true
              </code>{" "}
              is set on the server.
            </p>
          </div>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          Partner applications
        </h2>
        <Card className="overflow-hidden p-0">
          {pendingPartners.length === 0 ? (
            <EmptyState
              title="Nothing awaiting review"
              description="New referral partner applications will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {partner.displayName ?? partner.fullName ?? "Unnamed partner"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {partner.email ?? "No email"} ·{" "}
                        {partner.phone ?? "No phone"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-brand-navy">
                      {partner.code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(partner.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <PartnerReviewActions
                        partnerId={partner.id}
                        partnerName={
                          partner.displayName ?? partner.fullName ?? "this partner"
                        }
                        status={partner.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          All partners
        </h2>
        <Card className="overflow-hidden p-0">
          {data.partners.length === 0 ? (
            <EmptyState
              title="No partners yet"
              description="Applications will appear here once users apply."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {partner.displayName ?? partner.fullName ?? "Unnamed partner"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {partner.email ?? "No email"}
                      </span>
                      {partner.rejectionReason || partner.suspensionReason ? (
                        <span className="block text-xs text-muted-foreground">
                          {partner.rejectionReason ?? partner.suspensionReason}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-brand-navy">
                      {partner.code}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={partner.status}
                        label={referralPartnerStatusLabels[partner.status]}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(partner.approvedAt)}
                    </TableCell>
                    <TableCell>
                      <PartnerReviewActions
                        partnerId={partner.id}
                        partnerName={
                          partner.displayName ?? partner.fullName ?? "this partner"
                        }
                        status={partner.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          Commission review
        </h2>
        <Card className="overflow-hidden p-0">
          {reviewableCommissions.length === 0 ? (
            <EmptyState
              title="No commissions awaiting review"
              description="Commissions appear here when they are created or become eligible."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eligible</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewableCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {commission.partnerName ?? "Unknown partner"}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {commission.partnerCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {formatMoney(commission.grossMinorUnits, commission.currency)}
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums text-brand-navy">
                      {formatMoney(commission.amountMinorUnits, commission.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={commission.status}
                        label={commissionStatusLabels[commission.status]}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(commission.eligibleAt)}
                    </TableCell>
                    <TableCell>
                      <CommissionReviewActions
                        commissionId={commission.id}
                        status={commission.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          Payout requests
        </h2>
        <Card className="overflow-hidden p-0">
          {pendingPayouts.length === 0 ? (
            <EmptyState
              title="No payouts need attention"
              description="Pending approvals, approved transfers and failed payouts appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {payout.partnerName ?? "Unknown partner"}
                      </span>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {payout.partnerCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums text-brand-navy">
                      {formatMoney(payout.amountMinorUnits, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={payout.status}
                        label={payoutStatusLabels[payout.status]}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(payout.requestedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <StatusBadge
                          status={payout.accountVerified ? "verified" : "unverified"}
                        />
                        <VerifyPayoutAccountButton
                          partnerId={payout.partnerId}
                          verified={payout.accountVerified}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <PayoutReviewActions
                        payoutId={payout.id}
                        status={payout.status}
                        accountVerified={payout.accountVerified}
                        transfersEnabled={transfersEnabled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-brand-navy">
            Commission policies
          </h2>
          <PolicyDialog triggerLabel="New policy" />
        </div>
        <Card className="overflow-hidden p-0">
          {data.policies.length === 0 ? (
            <EmptyState
              title="No policy published"
              description="Publish a policy before referral commissions can be calculated. CareBridge never invents a rate."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Purposes</TableHead>
                  <TableHead>Delay / minimum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {policy.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {policy.description ?? "No description"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {policy.commissionType === "percentage"
                        ? `${(policy.percentageBps ?? 0) / 100}%`
                        : formatMoney(
                            policy.fixedAmountMinorUnits,
                            policy.currency,
                          )}
                    </TableCell>
                    <TableCell className="max-w-64 text-xs text-muted-foreground">
                      {policy.eligiblePurposes
                        .map((purpose) => purpose.replaceAll("_", " "))
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {policy.payoutDelayDays}-day delay
                      <span className="block">
                        Min {formatMoney(policy.minimumPayoutMinorUnits, currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={policy.isActive ? "active" : "inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <PolicyDialog
                          policy={policy}
                          triggerLabel="Edit"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>
    </div>
  );
}
