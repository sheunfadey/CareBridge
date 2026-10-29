import { describe, expect, it } from "vitest";

import {
  MoneyParseError,
  formatMinorUnits,
  parseMoneyToMinorUnits,
  percentageToBps,
} from "@/lib/money";
import {
  COMMISSION_STATUSES,
  PAYMENT_RECONCILIATION_STATUSES,
  PAYMENT_STATUSES,
  PAYOUT_STATUSES,
  REFERRAL_PARTNER_STATUSES,
  calculateCommissionMinorUnits,
  commissionStatusLabels,
  paymentReconciliationStatusLabels,
  paymentStatusLabels,
  payoutAccountSchema,
  payoutStatusLabels,
  referralApplicationSchema,
  referralPartnerStatusLabels,
  referralPolicySchema,
  refundPaymentSchema,
} from "@/lib/validation/payments";

describe("money parsing", () => {
  it("parses decimal amounts into integer minor units", () => {
    expect(parseMoneyToMinorUnits("1")).toBe(100);
    expect(parseMoneyToMinorUnits("1.5")).toBe(150);
    expect(parseMoneyToMinorUnits("1.50")).toBe(150);
    expect(parseMoneyToMinorUnits("1,500.25")).toBe(150025);
    expect(parseMoneyToMinorUnits("0")).toBe(0);
  });

  it("rejects negative, exponent and over-precise amounts", () => {
    for (const value of ["-1", "1.234", "1e3", "abc", ""]) {
      expect(() => parseMoneyToMinorUnits(value)).toThrow(MoneyParseError);
    }
  });

  it("formats minor units without floating point", () => {
    expect(formatMinorUnits(150025)).toBe("1500.25");
    expect(formatMinorUnits(5)).toBe("0.05");
    expect(formatMinorUnits(0)).toBe("0.00");
  });

  it("parses percentages as basis points", () => {
    expect(percentageToBps("10")).toBe(1000);
    expect(percentageToBps("10.5")).toBe(1050);
    expect(percentageToBps("100")).toBe(10000);
    expect(() => percentageToBps("100.01")).toThrow(MoneyParseError);
    expect(() => percentageToBps("0.001")).toThrow(MoneyParseError);
  });
});

describe("commission calculation preview", () => {
  it("floors percentage commissions to whole minor units", () => {
    expect(
      calculateCommissionMinorUnits({
        commissionType: "percentage",
        percentageBps: 1000,
        grossAmountMinorUnits: 500000,
      }),
    ).toBe(50000);

    expect(
      calculateCommissionMinorUnits({
        commissionType: "percentage",
        percentageBps: 1000,
        grossAmountMinorUnits: 333,
      }),
    ).toBe(33);
  });

  it("never pays a fixed commission above the gross amount", () => {
    expect(
      calculateCommissionMinorUnits({
        commissionType: "fixed",
        fixedAmountMinorUnits: 5000,
        grossAmountMinorUnits: 100000,
      }),
    ).toBe(5000);

    expect(
      calculateCommissionMinorUnits({
        commissionType: "fixed",
        fixedAmountMinorUnits: 5000,
        grossAmountMinorUnits: 2000,
      }),
    ).toBe(2000);
  });

  it("returns zero for empty or invalid rates", () => {
    expect(
      calculateCommissionMinorUnits({
        commissionType: "percentage",
        percentageBps: 0,
        grossAmountMinorUnits: 1000,
      }),
    ).toBe(0);
    expect(
      calculateCommissionMinorUnits({
        commissionType: "percentage",
        grossAmountMinorUnits: 0,
      }),
    ).toBe(0);
    expect(
      calculateCommissionMinorUnits({
        commissionType: "fixed",
        fixedAmountMinorUnits: null,
        grossAmountMinorUnits: 1000,
      }),
    ).toBe(0);
  });
});

describe("referral policy schema", () => {
  const base = {
    name: "Default course commission",
    description: "Published policy",
    commissionType: "percentage" as const,
    percentage: "10",
    eligiblePurposes: ["course_purchase" as const],
    attributionWindowDays: 30,
    payoutDelayDays: 14,
    minimumPayout: "5000",
    refundPolicy: "Refunded payments reverse commission",
    isActive: true,
  };

  it("accepts a valid percentage policy", () => {
    expect(referralPolicySchema.safeParse(base).success).toBe(true);
  });

  it("accepts a valid fixed policy", () => {
    expect(
      referralPolicySchema.safeParse({
        ...base,
        commissionType: "fixed",
        fixedAmount: "2500",
      }).success,
    ).toBe(true);
  });

  it("rejects percentages above 100", () => {
    expect(
      referralPolicySchema.safeParse({ ...base, percentage: "100.01" }).success,
    ).toBe(false);
  });

  it("requires at least one eligible purpose", () => {
    expect(
      referralPolicySchema.safeParse({ ...base, eligiblePurposes: [] }).success,
    ).toBe(false);
  });

  it("rejects a negative or malformed minimum payout", () => {
    expect(
      referralPolicySchema.safeParse({ ...base, minimumPayout: "-1" }).success,
    ).toBe(false);
    expect(
      referralPolicySchema.safeParse({ ...base, minimumPayout: "1.999" }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range attribution window", () => {
    expect(
      referralPolicySchema.safeParse({ ...base, attributionWindowDays: 0 })
        .success,
    ).toBe(false);
    expect(
      referralPolicySchema.safeParse({ ...base, attributionWindowDays: 366 })
        .success,
    ).toBe(false);
  });
});

describe("payout and referral input schemas", () => {
  it("requires a numeric account number and bank code", () => {
    const account = {
      bankName: "Example Bank",
      bankCode: "058",
      accountName: "Ada Obi",
      accountNumber: "0123456789",
    };
    expect(payoutAccountSchema.safeParse(account).success).toBe(true);
    expect(
      payoutAccountSchema.safeParse({ ...account, accountNumber: "12ab" }).success,
    ).toBe(false);
    expect(
      payoutAccountSchema.safeParse({ ...account, bankCode: "bank" }).success,
    ).toBe(false);
  });

  it("trims optional referral application fields to null", () => {
    const result = referralApplicationSchema.safeParse({
      displayName: "  Ada Obi  ",
      phone: "  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Ada Obi");
      expect(result.data.phone).toBeNull();
    }
  });

  it("requires a refund reason", () => {
    expect(
      refundPaymentSchema.safeParse({ amount: "100", reason: "duplicate" }).success,
    ).toBe(true);
    expect(
      refundPaymentSchema.safeParse({ amount: "100", reason: "" }).success,
    ).toBe(false);
  });
});

describe("financial status labels", () => {
  it("labels every payment, commission, payout and partner status", () => {
    for (const status of PAYMENT_STATUSES) {
      expect(paymentStatusLabels[status]).toBeTruthy();
    }
    for (const status of PAYMENT_RECONCILIATION_STATUSES) {
      expect(paymentReconciliationStatusLabels[status]).toBeTruthy();
    }
    for (const status of COMMISSION_STATUSES) {
      expect(commissionStatusLabels[status]).toBeTruthy();
    }
    for (const status of PAYOUT_STATUSES) {
      expect(payoutStatusLabels[status]).toBeTruthy();
    }
    for (const status of REFERRAL_PARTNER_STATUSES) {
      expect(referralPartnerStatusLabels[status]).toBeTruthy();
    }
  });
});
