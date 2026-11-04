import { describe, expect, it } from "vitest";

import {
  SUBSCRIPTION_BILLING_CYCLES,
  SUBSCRIPTION_EVENT_TYPES,
  SUBSCRIPTION_MODULES,
  SUBSCRIPTION_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  cancelSubscriptionSchema,
  changePlanSchema,
  planSchema,
  recordSubscriptionPaymentSchema,
  subscriptionBillingCycleLabels,
  subscriptionEventLabels,
  subscriptionModuleLabels,
  subscriptionPaymentStatusLabels,
  subscriptionStatusLabels,
} from "@/lib/validation/billing";

describe("subscription labels", () => {
  it("labels every status, cycle, event, payment status and module", () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(subscriptionStatusLabels[status]).toBeTruthy();
    }
    for (const cycle of SUBSCRIPTION_BILLING_CYCLES) {
      expect(subscriptionBillingCycleLabels[cycle]).toBeTruthy();
    }
    for (const event of SUBSCRIPTION_EVENT_TYPES) {
      expect(subscriptionEventLabels[event]).toBeTruthy();
    }
    for (const status of SUBSCRIPTION_PAYMENT_STATUSES) {
      expect(subscriptionPaymentStatusLabels[status]).toBeTruthy();
    }
    for (const moduleKey of SUBSCRIPTION_MODULES) {
      expect(subscriptionModuleLabels[moduleKey]).toBeTruthy();
    }
  });
});

describe("subscription validation", () => {
  it("validates a plan change", () => {
    expect(
      changePlanSchema.safeParse({
        organisationId: "11111111-1111-4111-8111-111111111111",
        planId: "22222222-2222-4222-8222-222222222222",
        billingCycle: "annual",
      }).success,
    ).toBe(true);
    expect(
      changePlanSchema.safeParse({
        organisationId: "not-a-uuid",
        planId: "22222222-2222-4222-8222-222222222222",
        billingCycle: "weekly",
      }).success,
    ).toBe(false);
  });

  it("validates cancellation and payment dates", () => {
    expect(
      cancelSubscriptionSchema.safeParse({
        organisationId: "11111111-1111-4111-8111-111111111111",
        immediate: true,
      }).success,
    ).toBe(true);

    expect(
      recordSubscriptionPaymentSchema.safeParse({
        organisationId: "11111111-1111-4111-8111-111111111111",
        amount: "25000",
        currency: "NGN",
        periodStart: "2026-11-01",
        periodEnd: "2026-12-01",
        renew: true,
      }).success,
    ).toBe(true);

    expect(
      recordSubscriptionPaymentSchema.safeParse({
        organisationId: "11111111-1111-4111-8111-111111111111",
        amount: "25000",
        currency: "NGN",
        periodStart: "2026-02-30",
        periodEnd: "2026-12-01",
        renew: true,
      }).success,
    ).toBe(false);
  });

  it("validates plan configuration", () => {
    const base = {
      code: "growth",
      name: "Growth",
      currency: "NGN",
      modules: "academy,employment",
      trialDays: 14,
      graceDays: 7,
      isActive: true,
      sortOrder: 10,
    };
    expect(planSchema.safeParse(base).success).toBe(true);
    expect(planSchema.safeParse({ ...base, code: "Bad Code" }).success).toBe(false);
    expect(planSchema.safeParse({ ...base, trialDays: -1 }).success).toBe(false);
  });
});
