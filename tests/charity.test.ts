import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_ALLOCATION_TYPES,
  CAMPAIGN_EXPENSE_STATUSES,
  CAMPAIGN_REVIEW_DECISIONS,
  CHARITY_CAMPAIGN_STATUSES,
  DONATION_STATUSES,
  SCHOLARSHIP_APPLICATION_STATUSES,
  SCHOLARSHIP_AWARD_STATUSES,
  SCHOLARSHIP_COVERAGES,
  SCHOLARSHIP_PROGRAMME_STATUSES,
  campaignAllocationTypeLabels,
  campaignExpenseStatusLabels,
  campaignReviewDecisionLabels,
  campaignSchema,
  charityCampaignStatusLabels,
  donationCheckoutSchema,
  donationStatusLabels,
  impactReportSchema,
  scholarshipApplicationSchema,
  scholarshipApplicationStatusLabels,
  scholarshipAwardSchema,
  scholarshipAwardStatusLabels,
  scholarshipCoverageLabels,
  scholarshipProgrammeSchema,
  scholarshipProgrammeStatusLabels,
  scholarshipReviewSchema,
} from "@/lib/validation/charity";

describe("charity status labels", () => {
  it("labels every campaign, review and donation status", () => {
    for (const status of CHARITY_CAMPAIGN_STATUSES) {
      expect(charityCampaignStatusLabels[status]).toBeTruthy();
    }
    for (const decision of CAMPAIGN_REVIEW_DECISIONS) {
      expect(campaignReviewDecisionLabels[decision]).toBeTruthy();
    }
    for (const status of DONATION_STATUSES) {
      expect(donationStatusLabels[status]).toBeTruthy();
    }
  });

  it("labels allocation, expense and scholarship statuses", () => {
    for (const type of CAMPAIGN_ALLOCATION_TYPES) {
      expect(campaignAllocationTypeLabels[type]).toBeTruthy();
    }
    for (const status of CAMPAIGN_EXPENSE_STATUSES) {
      expect(campaignExpenseStatusLabels[status]).toBeTruthy();
    }
    for (const coverage of SCHOLARSHIP_COVERAGES) {
      expect(scholarshipCoverageLabels[coverage]).toBeTruthy();
    }
    for (const status of SCHOLARSHIP_PROGRAMME_STATUSES) {
      expect(scholarshipProgrammeStatusLabels[status]).toBeTruthy();
    }
    for (const status of SCHOLARSHIP_APPLICATION_STATUSES) {
      expect(scholarshipApplicationStatusLabels[status]).toBeTruthy();
    }
    for (const status of SCHOLARSHIP_AWARD_STATUSES) {
      expect(scholarshipAwardStatusLabels[status]).toBeTruthy();
    }
  });
});

describe("campaign validation", () => {
  const base = {
    organisationId: "11111111-1111-4111-8111-111111111111",
    title: "Train more carers",
    purpose: "Fund training access for caregivers who cannot self-fund.",
    fundingTarget: "500000",
    currency: "NGN",
    startsOn: "2026-11-03",
    isPublic: true,
  };

  it("accepts a valid campaign", () => {
    const parsed = campaignSchema.parse(base);
    expect(parsed.fundingTarget).toBe("500000");
    expect(parsed.endsOn).toBeNull();
  });

  it("rejects an invalid slug and short purpose", () => {
    expect(
      campaignSchema.safeParse({ ...base, slug: "Bad Slug!" }).success,
    ).toBe(false);
    expect(
      campaignSchema.safeParse({ ...base, purpose: "short" }).success,
    ).toBe(false);
  });
});

describe("donation validation", () => {
  it("requires an amount and campaign", () => {
    expect(
      donationCheckoutSchema.safeParse({
        campaignId: "11111111-1111-4111-8111-111111111111",
        amount: "1000",
        publicAcknowledgement: true,
      }).success,
    ).toBe(true);
    expect(
      donationCheckoutSchema.safeParse({
        campaignId: "not-a-uuid",
        amount: "",
      }).success,
    ).toBe(false);
  });
});

describe("scholarship validation", () => {
  const programme = {
    organisationId: "11111111-1111-4111-8111-111111111111",
    name: "Care leaders scholarship",
    eligibility: "Applicants must demonstrate financial need and a place on a course.",
    maxAward: "250000",
    opensOn: "2026-11-03",
    isPublic: true,
  };

  it("accepts a valid programme and rejects a short eligibility statement", () => {
    expect(scholarshipProgrammeSchema.safeParse(programme).success).toBe(true);
    expect(
      scholarshipProgrammeSchema.safeParse({ ...programme, eligibility: "short" })
        .success,
    ).toBe(false);
  });

  it("requires a substantive application statement", () => {
    expect(
      scholarshipApplicationSchema.safeParse({
        programmeId: "11111111-1111-4111-8111-111111111111",
        statement: "I need support to start my training and this is why.",
      }).success,
    ).toBe(true);
    expect(
      scholarshipApplicationSchema.safeParse({
        programmeId: "11111111-1111-4111-8111-111111111111",
        statement: "Too short",
      }).success,
    ).toBe(false);
  });

  it("validates review decisions and award amounts", () => {
    expect(
      scholarshipReviewSchema.safeParse({
        applicationId: "11111111-1111-4111-8111-111111111111",
        status: "shortlisted",
      }).success,
    ).toBe(true);
    expect(
      scholarshipReviewSchema.safeParse({
        applicationId: "11111111-1111-4111-8111-111111111111",
        status: "submitted",
      }).success,
    ).toBe(false);
    expect(
      scholarshipAwardSchema.safeParse({
        applicationId: "11111111-1111-4111-8111-111111111111",
        amount: "100000",
        coverage: "partial",
      }).success,
    ).toBe(true);
  });
});

describe("impact report validation", () => {
  it("requires a title and summary", () => {
    expect(
      impactReportSchema.safeParse({
        campaignId: "11111111-1111-4111-8111-111111111111",
        title: "Six months of impact",
        summary: "We supported ten learners through their training.",
      }).success,
    ).toBe(true);
    expect(
      impactReportSchema.safeParse({
        campaignId: "11111111-1111-4111-8111-111111111111",
        title: "No",
        summary: "short",
      }).success,
    ).toBe(false);
  });
});
