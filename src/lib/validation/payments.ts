import { z } from "zod";

import {
  MoneyParseError,
  parseMoneyToMinorUnits,
  percentageToBps,
} from "@/lib/money";

export const PAYMENT_PURPOSES = [
  "course_purchase",
  "training_fee",
  "subscription",
  "care_home_subscription",
  "donation",
  "other",
] as const;

export type PaymentPurposeOption = (typeof PAYMENT_PURPOSES)[number];

export const paymentPurposeLabels: Record<PaymentPurposeOption, string> = {
  course_purchase: "Course purchase",
  training_fee: "Training fee",
  subscription: "Platform subscription",
  care_home_subscription: "Care-home subscription",
  donation: "Donation",
  other: "Other",
};

export const PAYMENT_STATUSES = [
  "initiated",
  "pending",
  "successful",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

export const paymentStatusLabels: Record<
  (typeof PAYMENT_STATUSES)[number],
  string
> = {
  initiated: "Initiated",
  pending: "Pending",
  successful: "Successful",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const PAYMENT_RECONCILIATION_STATUSES = [
  "pending",
  "matched",
  "mismatch",
  "review_required",
  "not_applicable",
] as const;

export const paymentReconciliationStatusLabels: Record<
  (typeof PAYMENT_RECONCILIATION_STATUSES)[number],
  string
> = {
  pending: "Pending verification",
  matched: "Matched",
  mismatch: "Mismatch",
  review_required: "Review required",
  not_applicable: "Not applicable",
};

export const REFERRAL_PARTNER_STATUSES = [
  "pending",
  "approved",
  "suspended",
  "rejected",
] as const;

export const referralPartnerStatusLabels: Record<
  (typeof REFERRAL_PARTNER_STATUSES)[number],
  string
> = {
  pending: "Pending review",
  approved: "Approved",
  suspended: "Suspended",
  rejected: "Rejected",
};

export const COMMISSION_STATUSES = [
  "pending",
  "eligible",
  "approved",
  "processing",
  "paid",
  "rejected",
  "reversed",
  "failed",
  "on_hold",
] as const;

export const commissionStatusLabels: Record<
  (typeof COMMISSION_STATUSES)[number],
  string
> = {
  pending: "Pending",
  eligible: "Eligible",
  approved: "Approved",
  processing: "Processing",
  paid: "Paid",
  rejected: "Rejected",
  reversed: "Reversed",
  failed: "Failed",
  on_hold: "In payout",
};

export const PAYOUT_STATUSES = [
  "pending",
  "approved",
  "processing",
  "paid",
  "rejected",
  "failed",
  "cancelled",
] as const;

export const payoutStatusLabels: Record<
  (typeof PAYOUT_STATUSES)[number],
  string
> = {
  pending: "Awaiting review",
  approved: "Approved",
  processing: "Processing",
  paid: "Paid",
  rejected: "Rejected",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const REFERRAL_COMMISSION_TYPES = ["percentage", "fixed"] as const;

export const referralCommissionTypeLabels: Record<
  (typeof REFERRAL_COMMISSION_TYPES)[number],
  string
> = {
  percentage: "Percentage of eligible amount",
  fixed: "Fixed amount per payment",
};

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value ? value : null));

export const referralApplicationSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => (value ? value : null)),
});

export type ReferralApplicationInput = z.infer<typeof referralApplicationSchema>;

export const payoutAccountSchema = z.object({
  bankName: z.string().trim().min(2, "Enter the bank name").max(120),
  bankCode: z
    .string()
    .trim()
    .regex(/^[0-9]{3,6}$/, "Enter the bank code from the provider list"),
  accountName: z.string().trim().min(2, "Enter the account name").max(160),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{6,20}$/, "Enter a valid account number"),
});

export type PayoutAccountInput = z.infer<typeof payoutAccountSchema>;

export const referralPolicySchema = z
  .object({
    name: z.string().trim().min(3, "Name the policy").max(120),
    description: optionalText,
    commissionType: z.enum(REFERRAL_COMMISSION_TYPES),
    percentage: z.string().trim().optional(),
    fixedAmount: z.string().trim().optional(),
    eligiblePurposes: z
      .array(z.enum(PAYMENT_PURPOSES))
      .min(1, "Choose at least one eligible payment purpose"),
    attributionWindowDays: z.coerce
      .number()
      .int()
      .min(1, "At least one day")
      .max(365),
    payoutDelayDays: z.coerce.number().int().min(0).max(365),
    minimumPayout: z.string().trim(),
    refundPolicy: optionalText,
    isActive: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (value.commissionType === "percentage") {
      try {
        const bps = percentageToBps(value.percentage ?? "");
        if (bps <= 0 || bps > 10_000) {
          context.addIssue({
            code: "custom",
            path: ["percentage"],
            message: "Enter a percentage above 0 and at most 100.",
          });
        }
      } catch (error) {
        context.addIssue({
          code: "custom",
          path: ["percentage"],
          message:
            error instanceof MoneyParseError
              ? error.message
              : "Enter a valid percentage.",
        });
      }
    }

    if (value.commissionType === "fixed") {
      try {
        const amount = parseMoneyToMinorUnits(value.fixedAmount ?? "");
        if (amount <= 0) {
          context.addIssue({
            code: "custom",
            path: ["fixedAmount"],
            message: "Enter an amount above zero.",
          });
        }
      } catch (error) {
        context.addIssue({
          code: "custom",
          path: ["fixedAmount"],
          message:
            error instanceof MoneyParseError
              ? error.message
              : "Enter a valid amount.",
        });
      }
    }

    try {
      parseMoneyToMinorUnits(value.minimumPayout);
    } catch (error) {
      context.addIssue({
        code: "custom",
        path: ["minimumPayout"],
        message:
          error instanceof MoneyParseError
            ? error.message
            : "Enter a valid minimum.",
      });
    }
  });

export type ReferralPolicyInput = z.infer<typeof referralPolicySchema>;

export const reviewDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "suspend"]),
  reason: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : null)),
});

export const commissionDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : null)),
});

export const payoutDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => (value ? value : null)),
});

export const refundPaymentSchema = z.object({
  amount: z.string().trim(),
  reason: z.string().trim().min(3, "Give a reason").max(1000),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

/**
 * Pure preview of a commission calculation. The authoritative calculation runs
 * in the database (`apply_payment_success`); this mirrors it for admin previews
 * and unit tests.
 */
export function calculateCommissionMinorUnits(input: {
  commissionType: (typeof REFERRAL_COMMISSION_TYPES)[number];
  percentageBps?: number | null;
  fixedAmountMinorUnits?: number | null;
  grossAmountMinorUnits: number;
}): number {
  if (input.grossAmountMinorUnits <= 0) return 0;

  if (input.commissionType === "percentage") {
    const bps = input.percentageBps ?? 0;
    if (bps <= 0) return 0;
    return Math.floor((input.grossAmountMinorUnits * bps) / 10_000);
  }

  const fixed = input.fixedAmountMinorUnits ?? 0;
  if (fixed <= 0) return 0;
  return Math.min(fixed, input.grossAmountMinorUnits);
}
