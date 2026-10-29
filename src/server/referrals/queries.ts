import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";
import { userHasPermission } from "@/server/auth/current-user";
import type {
  ReferralCommissionStatus,
  ReferralPartnerStatus,
  ReferralPayoutStatus,
} from "@/types/database";

export type ReferralPartnerProfile = {
  id: string;
  userId: string;
  code: string;
  status: ReferralPartnerStatus;
  displayName: string | null;
  phone: string | null;
  appliedAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
};

export type PayoutAccountSummary = {
  id: string;
  bankName: string | null;
  bankCode: string;
  accountName: string;
  accountNumberMasked: string;
  providerRecipientCode: string | null;
  verifiedAt: string | null;
};

export type CommissionSummary = {
  id: string;
  partnerId: string;
  entryType: string;
  basis: string;
  grossMinorUnits: number;
  amountMinorUnits: number;
  currency: string;
  status: ReferralCommissionStatus;
  eligibleAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  reversedAt: string | null;
  createdAt: string;
  transactionId: string | null;
  statusReason: string | null;
};

export type PayoutSummary = {
  id: string;
  partnerId: string;
  amountMinorUnits: number;
  currency: string;
  status: ReferralPayoutStatus;
  requestedAt: string;
  reviewedAt: string | null;
  decisionReason: string | null;
  providerTransferReference: string | null;
  paidAt: string | null;
  failureReason: string | null;
};

export type ReferralBalance = {
  approvedMinorUnits: number;
  pendingMinorUnits: number;
  inPayoutMinorUnits: number;
  paidMinorUnits: number;
};

export type ReferralPolicySummary = {
  id: string;
  name: string;
  description: string | null;
  commissionType: "percentage" | "fixed";
  percentageBps: number | null;
  fixedAmountMinorUnits: number | null;
  currency: string;
  eligiblePurposes: string[];
  attributionWindowDays: number;
  payoutDelayDays: number;
  minimumPayoutMinorUnits: number;
  refundPolicy: string | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type ReferralDashboard = {
  partner: ReferralPartnerProfile | null;
  account: PayoutAccountSummary | null;
  balance: ReferralBalance;
  commissions: CommissionSummary[];
  payouts: PayoutSummary[];
  attributions: {
    id: string;
    referralCode: string;
    status: string;
    attributedAt: string;
    expiresAt: string;
  }[];
  policies: ReferralPolicySummary[];
  minimumPayoutMinorUnits: number;
};

function maskAccountNumber(accountNumber: string): string {
  const last4 = accountNumber.slice(-4);
  return `•••• ${last4}`;
}

function mapPartner(row: {
  id: string;
  user_id: string;
  code: string;
  status: string;
  display_name: string | null;
  phone: string | null;
  applied_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  suspension_reason: string | null;
}): ReferralPartnerProfile {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    status: row.status as ReferralPartnerStatus,
    displayName: row.display_name,
    phone: row.phone,
    appliedAt: row.applied_at,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    suspensionReason: row.suspension_reason,
  };
}

function mapCommission(row: {
  id: string;
  partner_id: string;
  entry_type: string;
  basis: string;
  gross_amount_minor_units: number;
  commission_amount_minor_units: number;
  currency: string;
  status: string;
  eligible_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  reversed_at: string | null;
  created_at: string;
  transaction_id: string | null;
  status_reason: string | null;
}): CommissionSummary {
  return {
    id: row.id,
    partnerId: row.partner_id,
    entryType: row.entry_type,
    basis: row.basis,
    grossMinorUnits: row.gross_amount_minor_units,
    amountMinorUnits: row.commission_amount_minor_units,
    currency: row.currency,
    status: row.status as ReferralCommissionStatus,
    eligibleAt: row.eligible_at,
    approvedAt: row.approved_at,
    paidAt: row.paid_at,
    reversedAt: row.reversed_at,
    createdAt: row.created_at,
    transactionId: row.transaction_id,
    statusReason: row.status_reason,
  };
}

function mapPayout(row: {
  id: string;
  partner_id: string;
  amount_minor_units: number;
  currency: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  decision_reason: string | null;
  provider_transfer_reference: string | null;
  paid_at: string | null;
  failure_reason: string | null;
}): PayoutSummary {
  return {
    id: row.id,
    partnerId: row.partner_id,
    amountMinorUnits: row.amount_minor_units,
    currency: row.currency,
    status: row.status as ReferralPayoutStatus,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    decisionReason: row.decision_reason,
    providerTransferReference: row.provider_transfer_reference,
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  };
}

function mapPolicy(row: {
  id: string;
  name: string;
  description: string | null;
  commission_type: "percentage" | "fixed";
  percentage_bps: number | null;
  fixed_amount_minor_units: number | null;
  currency: string;
  eligible_purposes: string[];
  attribution_window_days: number;
  payout_delay_days: number;
  minimum_payout_minor_units: number;
  refund_policy: string | null;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
}): ReferralPolicySummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    commissionType: row.commission_type,
    percentageBps: row.percentage_bps,
    fixedAmountMinorUnits: row.fixed_amount_minor_units,
    currency: row.currency,
    eligiblePurposes: row.eligible_purposes,
    attributionWindowDays: row.attribution_window_days,
    payoutDelayDays: row.payout_delay_days,
    minimumPayoutMinorUnits: row.minimum_payout_minor_units,
    refundPolicy: row.refund_policy,
    isActive: row.is_active,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  };
}

export async function getReferralDashboard(
  user: CurrentUser,
): Promise<ReferralDashboard> {
  const supabase = await createClient();

  // Safe, idempotent system action: only moves commissions whose date has passed.
  await supabase.rpc("release_due_commissions");

  const { data: partnerRow } = await supabase
    .from("referral_partners")
    .select(
      "id, user_id, code, status, display_name, phone, applied_at, approved_at, rejection_reason, suspension_reason",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const partner = partnerRow ? mapPartner(partnerRow) : null;

  const { data: policyRows } = await supabase
    .from("referral_commission_policies")
    .select(
      "id, name, description, commission_type, percentage_bps, fixed_amount_minor_units, currency, eligible_purposes, attribution_window_days, payout_delay_days, minimum_payout_minor_units, refund_policy, is_active, effective_from, effective_to",
    )
    .eq("is_active", true)
    .order("effective_from", { ascending: false });

  const policies = (policyRows ?? []).map(mapPolicy);
  const minimumPayoutMinorUnits = policies.reduce(
    (minimum, policy) => Math.max(minimum, policy.minimumPayoutMinorUnits),
    0,
  );

  if (!partner) {
    return {
      partner: null,
      account: null,
      balance: {
        approvedMinorUnits: 0,
        pendingMinorUnits: 0,
        inPayoutMinorUnits: 0,
        paidMinorUnits: 0,
      },
      commissions: [],
      payouts: [],
      attributions: [],
      policies,
      minimumPayoutMinorUnits,
    };
  }

  const [accountResult, balanceResult, commissionsResult, payoutsResult, attributionsResult] =
    await Promise.all([
      supabase
        .from("referral_payout_accounts")
        .select(
          "id, bank_name, bank_code, account_name, account_number, provider_recipient_code, verified_at",
        )
        .eq("partner_id", partner.id)
        .maybeSingle(),
      supabase
        .from("referral_partner_balances")
        .select(
          "approved_minor_units, pending_minor_units, in_payout_minor_units, paid_minor_units",
        )
        .eq("partner_id", partner.id)
        .maybeSingle(),
      supabase
        .from("referral_commissions")
        .select(
          "id, partner_id, entry_type, basis, gross_amount_minor_units, commission_amount_minor_units, currency, status, eligible_at, approved_at, paid_at, reversed_at, created_at, transaction_id, status_reason",
        )
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("referral_payout_requests")
        .select(
          "id, partner_id, amount_minor_units, currency, status, requested_at, reviewed_at, decision_reason, provider_transfer_reference, paid_at, failure_reason",
        )
        .eq("partner_id", partner.id)
        .order("requested_at", { ascending: false })
        .limit(50),
      supabase
        .from("referral_attributions")
        .select("id, referral_code, status, attributed_at, expires_at")
        .eq("partner_id", partner.id)
        .order("attributed_at", { ascending: false })
        .limit(50),
    ]);

  return {
    partner,
    account: accountResult.data
      ? {
          id: accountResult.data.id,
          bankName: accountResult.data.bank_name,
          bankCode: accountResult.data.bank_code,
          accountName: accountResult.data.account_name,
          accountNumberMasked: maskAccountNumber(
            accountResult.data.account_number,
          ),
          providerRecipientCode:
            accountResult.data.provider_recipient_code,
          verifiedAt: accountResult.data.verified_at,
        }
      : null,
    balance: {
      approvedMinorUnits: Number(balanceResult.data?.approved_minor_units ?? 0),
      pendingMinorUnits: Number(balanceResult.data?.pending_minor_units ?? 0),
      inPayoutMinorUnits: Number(balanceResult.data?.in_payout_minor_units ?? 0),
      paidMinorUnits: Number(balanceResult.data?.paid_minor_units ?? 0),
    },
    commissions: (commissionsResult.data ?? []).map(mapCommission),
    payouts: (payoutsResult.data ?? []).map(mapPayout),
    attributions: (attributionsResult.data ?? []).map((row) => ({
      id: row.id,
      referralCode: row.referral_code,
      status: row.status,
      attributedAt: row.attributed_at,
      expiresAt: row.expires_at,
    })),
    policies,
    minimumPayoutMinorUnits,
  };
}

// -----------------------------------------------------------------------------
// Administration (finance / platform)
// -----------------------------------------------------------------------------

export type AdminReferralData = {
  partners: (ReferralPartnerProfile & {
    email: string | null;
    fullName: string | null;
  })[];
  policies: ReferralPolicySummary[];
  commissions: (CommissionSummary & {
    partnerName: string | null;
    partnerCode: string | null;
  })[];
  payouts: (PayoutSummary & {
    partnerName: string | null;
    partnerCode: string | null;
    accountVerified: boolean;
    reviewNeeded: boolean;
  })[];
};

export async function getAdminReferralData(
  user: CurrentUser,
): Promise<AdminReferralData> {
  if (
    !userHasPermission(user, "referral_rules_manage") &&
    !userHasPermission(user, "commission_approve") &&
    !userHasPermission(user, "payout_approve")
  ) {
    return { partners: [], policies: [], commissions: [], payouts: [] };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { partners: [], policies: [], commissions: [], payouts: [] };
  }

  await admin.rpc("release_due_commissions");

  const [partnersResult, policiesResult, commissionsResult, payoutsResult] =
    await Promise.all([
      admin
        .from("referral_partners")
        .select(
          "id, user_id, code, status, display_name, phone, applied_at, approved_at, rejection_reason, suspension_reason",
        )
        .order("applied_at", { ascending: false })
        .limit(100),
      admin
        .from("referral_commission_policies")
        .select(
          "id, name, description, commission_type, percentage_bps, fixed_amount_minor_units, currency, eligible_purposes, attribution_window_days, payout_delay_days, minimum_payout_minor_units, refund_policy, is_active, effective_from, effective_to",
        )
        .order("is_active", { ascending: false })
        .order("effective_from", { ascending: false }),
      admin
        .from("referral_commissions")
        .select(
          "id, partner_id, entry_type, basis, gross_amount_minor_units, commission_amount_minor_units, currency, status, eligible_at, approved_at, paid_at, reversed_at, created_at, transaction_id, status_reason",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("referral_payout_requests")
        .select(
          "id, partner_id, amount_minor_units, currency, status, requested_at, reviewed_at, decision_reason, provider_transfer_reference, paid_at, failure_reason",
        )
        .order("requested_at", { ascending: false })
        .limit(100),
    ]);

  const partners = partnersResult.data ?? [];
  const userIds = Array.from(new Set(partners.map((row) => row.user_id)));
  const partnerIds = partners.map((row) => row.id);

  const [profilesResult, accountsResult] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    partnerIds.length
      ? admin
          .from("referral_payout_accounts")
          .select("partner_id, verified_at")
          .in("partner_id", partnerIds)
      : Promise.resolve({ data: [] as { partner_id: string; verified_at: string | null }[] }),
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      { fullName: profile.full_name, email: profile.email },
    ]),
  );
  const partnerMap = new Map(
    partners.map((row) => [
      row.id,
      { name: row.display_name, code: row.code },
    ]),
  );
  const accountMap = new Map(
    (accountsResult.data ?? []).map((row) => [
      row.partner_id,
      Boolean(row.verified_at),
    ]),
  );

  return {
    partners: partners.map((row) => {
      const profile = profileMap.get(row.user_id);
      return {
        ...mapPartner(row),
        fullName: profile?.fullName ?? null,
        email: profile?.email ?? null,
      };
    }),
    policies: (policiesResult.data ?? []).map(mapPolicy),
    commissions: (commissionsResult.data ?? []).map((row) => ({
      ...mapCommission(row),
      partnerName: partnerMap.get(row.partner_id)?.name ?? null,
      partnerCode: partnerMap.get(row.partner_id)?.code ?? null,
    })),
    payouts: (payoutsResult.data ?? []).map((row) => ({
      ...mapPayout(row),
      partnerName: partnerMap.get(row.partner_id)?.name ?? null,
      partnerCode: partnerMap.get(row.partner_id)?.code ?? null,
      accountVerified: accountMap.get(row.partner_id) ?? false,
      reviewNeeded:
        row.status === "failed" ||
        row.status === "approved" ||
        (row.status === "pending" && Boolean(accountMap.get(row.partner_id))),
    })),
  };
}
