import { z } from "zod";

import type {
  SubscriptionBillingCycle,
  SubscriptionEventType,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from "@/types/database";

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "grace",
  "suspended",
  "cancelled",
  "expired",
] as const;

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  grace: "Grace period",
  suspended: "Suspended",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const SUBSCRIPTION_BILLING_CYCLES = ["monthly", "annual"] as const;

export const subscriptionBillingCycleLabels: Record<SubscriptionBillingCycle, string> = {
  monthly: "Monthly",
  annual: "Annual",
};

export const SUBSCRIPTION_EVENT_TYPES = [
  "created",
  "trial_started",
  "plan_changed",
  "renewed",
  "payment_failed",
  "past_due",
  "grace_started",
  "suspended",
  "reactivated",
  "cancelled",
  "expired",
  "settings_updated",
] as const;

export const subscriptionEventLabels: Record<SubscriptionEventType, string> = {
  created: "Subscription created",
  trial_started: "Trial started",
  plan_changed: "Plan changed",
  renewed: "Renewed",
  payment_failed: "Payment failed",
  past_due: "Past due",
  grace_started: "Grace period started",
  suspended: "Suspended",
  reactivated: "Reactivated",
  cancelled: "Cancelled",
  expired: "Expired",
  settings_updated: "Settings updated",
};

export const SUBSCRIPTION_PAYMENT_STATUSES = ["recorded", "void"] as const;

export const subscriptionPaymentStatusLabels: Record<
  SubscriptionPaymentStatus,
  string
> = {
  recorded: "Recorded",
  void: "Void",
};

export const SUBSCRIPTION_MODULES = [
  "academy",
  "employment",
  "referrals",
  "care",
  "charity",
] as const;

export type SubscriptionModule = (typeof SUBSCRIPTION_MODULES)[number];

export const subscriptionModuleLabels: Record<SubscriptionModule, string> = {
  academy: "Academy",
  employment: "Internships & employment",
  referrals: "Referral programme",
  care: "Care-home operations",
  charity: "Charity & scholarships",
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export const billingDateSchema = z
  .string()
  .trim()
  .refine(isValidDate, "Use a valid date");

const optionalText = (max = 1000) =>
  z.string().trim().max(max).optional().default("");

export const changePlanSchema = z.object({
  organisationId: z.string().uuid(),
  planId: z.string().uuid(),
  billingCycle: z.enum(SUBSCRIPTION_BILLING_CYCLES),
});

export const cancelSubscriptionSchema = z.object({
  organisationId: z.string().uuid(),
  immediate: z.boolean().default(false),
});

export const resumeSubscriptionSchema = z.object({
  organisationId: z.string().uuid(),
});

export const setSubscriptionStatusSchema = z.object({
  organisationId: z.string().uuid(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  notes: optionalText(),
  graceDays: z.coerce.number().int().min(0).max(365).optional(),
});

export const recordSubscriptionPaymentSchema = z.object({
  organisationId: z.string().uuid(),
  amount: z.string().trim().min(1, "Enter the amount received"),
  currency: z.string().trim().length(3).default("NGN"),
  periodStart: billingDateSchema,
  periodEnd: billingDateSchema,
  providerReference: optionalText(160),
  receiptReference: optionalText(160),
  notes: optionalText(),
  renew: z.boolean().default(true),
});

export const planSchema = z.object({
  planId: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(2, "Enter a plan code")
    .max(40)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lower-case letters, numbers and hyphens"),
  name: z.string().trim().min(2, "Enter a plan name").max(120),
  description: optionalText(1000),
  monthlyPrice: optionalText(40),
  annualPrice: optionalText(40),
  currency: z.string().trim().length(3).default("NGN"),
  modules: optionalText(200),
  maxUsers: z.coerce.number().int().min(1).max(100000).optional(),
  maxFacilities: z.coerce.number().int().min(1).max(10000).optional(),
  storageAllowanceMb: z.coerce.number().int().min(1).max(1000000).optional(),
  trialDays: z.coerce.number().int().min(0).max(365).default(14),
  graceDays: z.coerce.number().int().min(0).max(365).default(7),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});
