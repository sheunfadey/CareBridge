"use server";

import { revalidatePath } from "next/cache";

import {
  MoneyParseError,
  parseMoneyToMinorUnits,
  percentageToBps,
} from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import {
  commissionDecisionSchema,
  payoutAccountSchema,
  payoutDecisionSchema,
  referralApplicationSchema,
  referralPolicySchema,
  reviewDecisionSchema,
} from "@/lib/validation/payments";
import { recordAudit } from "@/server/audit/record-audit";
import { assertPermission, AuthorisationError } from "@/server/auth/guards";
import { requireUser } from "@/server/auth/current-user";
import { attemptPayoutTransfer } from "@/server/referrals/payout-service";

export type ReferralActionResult =
  | { ok: true; message: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function friendlyError(error: unknown): ReferralActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission for this action." };
  }
  console.error("[referrals] action failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return { ok: false, message: "Something went wrong. Try again shortly." };
}

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

function revalidateReferrals() {
  revalidatePath("/dashboard/referrals");
  revalidatePath("/dashboard/admin/referrals");
  revalidatePath("/referral-programme");
}

export async function applyReferralPartnerAction(input: {
  displayName: string;
  phone?: string;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    const parsed = referralApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check your details.",
        fieldErrors: fieldErrorsFromZod(parsed.error.issues),
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("apply_referral_partner", {
      p_display_name: parsed.data.displayName,
      p_phone: parsed.data.phone ?? undefined,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    await recordAudit({
      actorId: user.id,
      action: "referral.partner.applied",
      entityType: "referral_partner",
      entityId: user.id,
      metadata: { displayName: parsed.data.displayName },
    });

    revalidateReferrals();
    return {
      ok: true,
      message:
        "Application received. Finance will review it before your referral link becomes active.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function savePayoutAccountAction(input: {
  bankName: string;
  bankCode: string;
  accountName: string;
  accountNumber: string;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    const parsed = payoutAccountSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the account details.",
        fieldErrors: fieldErrorsFromZod(parsed.error.issues),
      };
    }

    const supabase = await createClient();
    const { data: partner } = await supabase
      .from("referral_partners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!partner) {
      return {
        ok: false,
        message: "Apply to the referral programme before adding payout details.",
      };
    }

    const { error } = await supabase.from("referral_payout_accounts").upsert(
      {
        partner_id: partner.id,
        bank_name: parsed.data.bankName,
        bank_code: parsed.data.bankCode,
        account_name: parsed.data.accountName,
        account_number: parsed.data.accountNumber,
      },
      { onConflict: "partner_id" },
    );

    if (error) {
      return { ok: false, message: error.message };
    }

    await recordAudit({
      actorId: user.id,
      action: "referral.payout_account.saved",
      entityType: "referral_payout_account",
      entityId: partner.id,
      metadata: { bankCode: parsed.data.bankCode },
    });

    revalidateReferrals();
    return {
      ok: true,
      message:
        "Payout details saved. Finance must verify them before a payout can be requested.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function requestReferralPayoutAction(): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("request_referral_payout");

    if (error) {
      return { ok: false, message: error.message };
    }

    await recordAudit({
      actorId: user.id,
      action: "referral.payout.requested",
      entityType: "referral_payout_request",
      entityId: data,
      metadata: {},
    });

    revalidateReferrals();
    return {
      ok: true,
      message: "Payout requested. Finance will review it before sending funds.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

// -----------------------------------------------------------------------------
// Finance / platform administration
// -----------------------------------------------------------------------------

export async function reviewReferralPartnerAction(input: {
  partnerId: string;
  decision: "approve" | "reject" | "suspend";
  reason?: string;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "referral_rules_manage");

    const parsed = reviewDecisionSchema.safeParse({
      decision: input.decision,
      reason: input.reason,
    });
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the review details.",
        fieldErrors: fieldErrorsFromZod(parsed.error.issues),
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("review_referral_partner", {
      p_partner: input.partnerId,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.reason ?? undefined,
    });

    if (error) return { ok: false, message: error.message };

    await recordAudit({
      actorId: user.id,
      action: "referral.partner.reviewed",
      entityType: "referral_partner",
      entityId: input.partnerId,
      metadata: {
        decision: parsed.data.decision,
        status: data,
        reason: parsed.data.reason,
      },
    });

    revalidateReferrals();
    return {
      ok: true,
      message:
        parsed.data.decision === "approve"
          ? "Partner approved."
          : parsed.data.decision === "reject"
            ? "Partner application rejected."
            : "Partner suspended.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveReferralPolicyAction(input: {
  policyId?: string;
  name: string;
  description?: string;
  commissionType: "percentage" | "fixed";
  percentage?: string;
  fixedAmount?: string;
  eligiblePurposes: string[];
  attributionWindowDays: number;
  payoutDelayDays: number;
  minimumPayout: string;
  refundPolicy?: string;
  isActive: boolean;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "referral_rules_manage");

    const parsed = referralPolicySchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the policy details.",
        fieldErrors: fieldErrorsFromZod(parsed.error.issues),
      };
    }

    let percentageBps: number | null = null;
    let fixedAmountMinorUnits: number | null = null;
    let minimumPayoutMinorUnits: number;

    try {
      percentageBps =
        parsed.data.commissionType === "percentage"
          ? percentageToBps(parsed.data.percentage ?? "")
          : null;
      fixedAmountMinorUnits =
        parsed.data.commissionType === "fixed"
          ? parseMoneyToMinorUnits(parsed.data.fixedAmount ?? "")
          : null;
      minimumPayoutMinorUnits = parseMoneyToMinorUnits(
        parsed.data.minimumPayout,
      );
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof MoneyParseError
            ? error.message
            : "Check the amounts and percentage.",
      };
    }

    const supabase = await createClient();
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description,
      commission_type: parsed.data.commissionType,
      percentage_bps: percentageBps,
      fixed_amount_minor_units: fixedAmountMinorUnits,
      eligible_purposes: parsed.data.eligiblePurposes,
      attribution_window_days: parsed.data.attributionWindowDays,
      payout_delay_days: parsed.data.payoutDelayDays,
      minimum_payout_minor_units: minimumPayoutMinorUnits,
      refund_policy: parsed.data.refundPolicy,
      is_active: parsed.data.isActive,
      created_by: user.id,
    } as never;

    const { error } = input.policyId
      ? await supabase
          .from("referral_commission_policies")
          .update(payload)
          .eq("id", input.policyId)
      : await supabase.from("referral_commission_policies").insert(payload);

    if (error) return { ok: false, message: error.message };

    await recordAudit({
      actorId: user.id,
      action: "referral.policy.saved",
      entityType: "referral_commission_policy",
      entityId: input.policyId ?? null,
      metadata: {
        name: parsed.data.name,
        commissionType: parsed.data.commissionType,
        percentageBps,
        fixedAmountMinorUnits,
        minimumPayoutMinorUnits,
        isActive: parsed.data.isActive,
      },
    });

    revalidateReferrals();
    return {
      ok: true,
      message: input.policyId ? "Policy updated." : "Policy created.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewCommissionAction(input: {
  commissionId: string;
  decision: "approve" | "reject";
  reason?: string;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "commission_approve");

    const parsed = commissionDecisionSchema.safeParse({
      decision: input.decision,
      reason: input.reason,
    });
    if (!parsed.success) {
      return { ok: false, message: "Check the review details." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("review_referral_commission", {
      p_commission: input.commissionId,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.reason ?? undefined,
    });

    if (error) return { ok: false, message: error.message };

    await recordAudit({
      actorId: user.id,
      action: "referral.commission.reviewed",
      entityType: "referral_commission",
      entityId: input.commissionId,
      metadata: {
        decision: parsed.data.decision,
        status: data,
        reason: parsed.data.reason,
      },
    });

    revalidateReferrals();
    return {
      ok: true,
      message:
        parsed.data.decision === "approve"
          ? "Commission approved."
          : "Commission rejected.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewPayoutAction(input: {
  payoutId: string;
  decision: "approve" | "reject";
  reason?: string;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "payout_approve");

    const parsed = payoutDecisionSchema.safeParse({
      decision: input.decision,
      reason: input.reason,
    });
    if (!parsed.success) {
      return { ok: false, message: "Check the review details." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("review_referral_payout", {
      p_payout: input.payoutId,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.reason ?? undefined,
    });

    if (error) return { ok: false, message: error.message };

    await recordAudit({
      actorId: user.id,
      action: "referral.payout.reviewed",
      entityType: "referral_payout_request",
      entityId: input.payoutId,
      metadata: {
        decision: parsed.data.decision,
        status: data,
        reason: parsed.data.reason,
      },
    });

    revalidateReferrals();
    return {
      ok: true,
      message:
        parsed.data.decision === "approve"
          ? "Payout approved. It can now be sent to the provider."
          : "Payout rejected and commissions returned to the approved balance.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function verifyPayoutAccountAction(input: {
  partnerId: string;
  verified: boolean;
}): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "payout_approve");

    const supabase = await createClient();
    const { error } = await supabase.rpc(
      "verify_referral_payout_account",
      {
        p_partner: input.partnerId,
        p_verified: input.verified,
        p_provider_recipient_code: undefined,
      },
    );

    if (error) return { ok: false, message: error.message };

    await recordAudit({
      actorId: user.id,
      action: "referral.payout_account.verified",
      entityType: "referral_payout_account",
      entityId: input.partnerId,
      metadata: { verified: input.verified },
    });

    revalidateReferrals();
    return {
      ok: true,
      message: input.verified
        ? "Beneficiary details verified."
        : "Beneficiary verification removed.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function sendPayoutTransferAction(
  payoutId: string,
): Promise<ReferralActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "payout_approve");

    const result = await attemptPayoutTransfer(payoutId);

    await recordAudit({
      actorId: user.id,
      action: "referral.payout.transfer",
      entityType: "referral_payout_request",
      entityId: payoutId,
      metadata: { ok: result.ok, message: result.message },
    });

    revalidateReferrals();
    return result;
  } catch (error) {
    return friendlyError(error);
  }
}
