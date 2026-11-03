import { z } from "zod";

import type {
  CampaignAllocationType,
  CampaignExpenseStatus,
  CampaignReviewDecision,
  CharityCampaignStatus,
  DonationStatus,
  ScholarshipApplicationStatus,
  ScholarshipAwardStatus,
  ScholarshipCoverage,
  ScholarshipProgrammeStatus,
} from "@/types/database";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export const charityDateSchema = z
  .string()
  .trim()
  .refine(isValidDate, "Use a valid date");

const optionalText = (max = 4000) =>
  z.string().trim().max(max).optional().default("");

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isValidDate(value), "Use a valid date")
  .transform((value) => (value ? value : null));

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || /^[0-9a-f-]{36}$/i.test(value),
    "Choose a valid record",
  );

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Enter a URL slug")
  .max(120)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lower-case letters, numbers and hyphens");

// Status labels -----------------------------------------------------------------

export const CHARITY_CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "completed",
  "archived",
] as const;

export const charityCampaignStatusLabels: Record<CharityCampaignStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  archived: "Archived",
};

export const CAMPAIGN_REVIEW_DECISIONS = [
  "approved",
  "rejected",
  "changes_requested",
] as const;

export const campaignReviewDecisionLabels: Record<CampaignReviewDecision, string> = {
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

export const DONATION_STATUSES = [
  "pending",
  "successful",
  "partially_refunded",
  "refunded",
  "failed",
] as const;

export const donationStatusLabels: Record<DonationStatus, string> = {
  pending: "Pending",
  successful: "Successful",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  failed: "Failed",
};

export const CAMPAIGN_ALLOCATION_TYPES = ["allocation", "release"] as const;

export const campaignAllocationTypeLabels: Record<CampaignAllocationType, string> = {
  allocation: "Allocation",
  release: "Release",
};

export const CAMPAIGN_EXPENSE_STATUSES = [
  "pending",
  "approved",
  "paid",
  "void",
] as const;

export const campaignExpenseStatusLabels: Record<CampaignExpenseStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  void: "Void",
};

export const SCHOLARSHIP_COVERAGES = ["full", "partial"] as const;

export const scholarshipCoverageLabels: Record<ScholarshipCoverage, string> = {
  full: "Full",
  partial: "Partial",
};

export const SCHOLARSHIP_PROGRAMME_STATUSES = [
  "draft",
  "open",
  "closed",
  "archived",
] as const;

export const scholarshipProgrammeStatusLabels: Record<
  ScholarshipProgrammeStatus,
  string
> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};

export const SCHOLARSHIP_APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export const scholarshipApplicationStatusLabels: Record<
  ScholarshipApplicationStatus,
  string
> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const SCHOLARSHIP_AWARD_STATUSES = [
  "awarded",
  "accepted",
  "active",
  "completed",
  "withdrawn",
  "revoked",
] as const;

export const scholarshipAwardStatusLabels: Record<ScholarshipAwardStatus, string> = {
  awarded: "Awarded",
  accepted: "Accepted",
  active: "Active",
  completed: "Completed",
  withdrawn: "Withdrawn",
  revoked: "Revoked",
};

// Campaign schemas --------------------------------------------------------------

export const campaignSchema = z.object({
  organisationId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  title: z.string().trim().min(4, "Enter a campaign title").max(180),
  slug: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[a-z0-9][a-z0-9-]*$/.test(value),
      "Use lower-case letters, numbers and hyphens",
    ),
  purpose: z.string().trim().min(10, "Describe the campaign purpose").max(400),
  description: optionalText(),
  beneficiaryCriteria: optionalText(4000),
  fundingTarget: z.string().trim().min(1, "Enter a funding target"),
  currency: z.string().trim().length(3).default("NGN"),
  startsOn: charityDateSchema,
  endsOn: optionalDate,
  isPublic: z.boolean().default(true),
  sponsorshipOptions: optionalText(1000),
  supportingDocuments: optionalText(1000),
});

export const campaignReviewSchema = z.object({
  campaignId: z.string().uuid(),
  decision: z.enum(CAMPAIGN_REVIEW_DECISIONS),
  notes: z.string().trim().min(3, "Record a review note").max(2000),
});

export const donationCheckoutSchema = z.object({
  campaignId: z.string().uuid(),
  amount: z.string().trim().min(1, "Enter a donation amount"),
  publicAcknowledgement: z.boolean().default(false),
  donorDisplayName: optionalText(120),
  message: optionalText(500),
});

export const donationPreferenceSchema = z.object({
  donationId: z.string().uuid(),
  publicAcknowledgement: z.boolean().default(false),
  donorDisplayName: optionalText(120),
  message: optionalText(500),
});

// Allocation and expenses -------------------------------------------------------

export const campaignAllocationSchema = z.object({
  campaignId: z.string().uuid(),
  allocationType: z.enum(CAMPAIGN_ALLOCATION_TYPES).default("allocation"),
  category: z.string().trim().min(2, "Enter an allocation category").max(120),
  amount: z.string().trim().min(1, "Enter an amount"),
  notes: optionalText(1000),
});

export const campaignExpenseSchema = z.object({
  campaignId: z.string().uuid(),
  category: z.string().trim().min(2, "Enter an expense category").max(120),
  description: optionalText(),
  amount: z.string().trim().min(1, "Enter an amount"),
  incurredOn: charityDateSchema,
  payee: optionalText(160),
  receiptReference: optionalText(200),
  status: z.enum(CAMPAIGN_EXPENSE_STATUSES).default("pending"),
});

// Scholarship schemas -----------------------------------------------------------

export const scholarshipProgrammeSchema = z.object({
  organisationId: z.string().uuid(),
  programmeId: z.string().uuid().optional(),
  name: z.string().trim().min(4, "Enter a programme name").max(180),
  slug: z.string().trim().optional(),
  description: optionalText(),
  eligibility: z.string().trim().min(10, "Describe the eligibility criteria").max(4000),
  coverage: z.enum(SCHOLARSHIP_COVERAGES).default("partial"),
  maxAward: z.string().trim().min(1, "Enter the maximum award"),
  currency: z.string().trim().length(3).default("NGN"),
  courseId: optionalUuid,
  opensOn: charityDateSchema,
  closesOn: optionalDate,
  status: z.enum(SCHOLARSHIP_PROGRAMME_STATUSES).default("draft"),
  isPublic: z.boolean().default(true),
});

export const scholarshipApplicationSchema = z.object({
  programmeId: z.string().uuid(),
  statement: z
    .string()
    .trim()
    .min(50, "Write at least 50 characters about your circumstances")
    .max(5000),
  evidenceReferences: optionalText(1000),
});

export const scholarshipReviewSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["under_review", "shortlisted", "approved", "rejected", "withdrawn"]),
  notes: optionalText(2000),
});

export const scholarshipAwardSchema = z.object({
  applicationId: z.string().uuid(),
  amount: z.string().trim().min(1, "Enter the award amount"),
  coverage: z.enum(SCHOLARSHIP_COVERAGES).default("partial"),
  courseId: optionalUuid,
});

export const scholarshipAwardStatusSchema = z.object({
  awardId: z.string().uuid(),
  status: z.enum(SCHOLARSHIP_AWARD_STATUSES),
});

export const scholarshipOutcomeSchema = z.object({
  awardId: z.string().uuid(),
  completionOutcome: optionalText(1000),
  internshipOutcome: optionalText(1000),
  employmentOutcome: optionalText(1000),
  outcomeShareable: z.boolean().default(false),
});

// Impact reports ----------------------------------------------------------------

export const impactReportSchema = z.object({
  campaignId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  title: z.string().trim().min(4, "Enter a report title").max(180),
  summary: z.string().trim().min(10, "Write an impact summary").max(5000),
  metrics: optionalText(2000),
  isPublished: z.boolean().default(false),
});
