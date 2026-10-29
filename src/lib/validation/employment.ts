import { z } from "zod";

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "temporary",
  "contract",
  "internship",
] as const;

export const employmentTypeLabels: Record<
  (typeof EMPLOYMENT_TYPES)[number],
  string
> = {
  full_time: "Full time",
  part_time: "Part time",
  temporary: "Temporary",
  contract: "Contract",
  internship: "Internship",
};

export const JOB_STATUSES = [
  "draft",
  "pending_approval",
  "published",
  "closed",
  "archived",
] as const;

export const jobStatusLabels: Record<(typeof JOB_STATUSES)[number], string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export const INTERNSHIP_LISTING_STATUSES = [
  "draft",
  "open",
  "closed",
  "archived",
] as const;

export const internshipListingStatusLabels: Record<
  (typeof INTERNSHIP_LISTING_STATUSES)[number],
  string
> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};

export const APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;

export const applicationStatusLabels: Record<
  (typeof APPLICATION_STATUSES)[number],
  string
> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offer made",
  hired: "Hired",
  rejected: "Not successful",
  withdrawn: "Withdrawn",
};

export const INTERNSHIP_APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export const internshipApplicationStatusLabels: Record<
  (typeof INTERNSHIP_APPLICATION_STATUSES)[number],
  string
> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  offered: "Offer made",
  accepted: "Accepted",
  rejected: "Not successful",
  withdrawn: "Withdrawn",
};

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .or(z.literal(""));

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function linesToArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export const createJobPostingSchema = z
  .object({
    organisationId: z.string().uuid("Select the hiring organisation"),
    title: z
      .string()
      .trim()
      .min(3, "Enter a job title")
      .max(160, "Keep the title under 160 characters"),
    summary: z
      .string()
      .trim()
      .min(20, "Add a summary of at least 20 characters")
      .max(300, "Keep the summary under 300 characters"),
    description: z
      .string()
      .trim()
      .min(40, "Add a description of at least 40 characters")
      .max(8000),
    duties: optionalText(3000),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    workLocation: optionalText(180),
    state: optionalText(80),
    city: optionalText(80),
    shiftRequirements: optionalText(500),
    experienceRequirements: optionalText(1000),
    qualifications: optionalText(3000),
    skills: optionalText(2000),
    salaryMinMinorUnits: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional(),
    salaryMaxMinorUnits: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional(),
    isSalaryDisclosed: z.boolean().default(false),
    safeguardingRequirements: optionalText(1000),
    applicationDeadline: optionalDate,
  })
  .refine(
    (value) =>
      value.salaryMinMinorUnits === undefined ||
      value.salaryMaxMinorUnits === undefined ||
      value.salaryMaxMinorUnits >= value.salaryMinMinorUnits,
    { message: "Maximum salary must be at least the minimum", path: ["salaryMaxMinorUnits"] },
  );

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const createInternshipListingSchema = z
  .object({
    organisationId: z.string().uuid("Select the host organisation"),
    title: z
      .string()
      .trim()
      .min(3, "Enter a placement title")
      .max(160, "Keep the title under 160 characters"),
    summary: z
      .string()
      .trim()
      .min(20, "Add a summary of at least 20 characters")
      .max(300, "Keep the summary under 300 characters"),
    description: z
      .string()
      .trim()
      .min(40, "Add a description of at least 40 characters")
      .max(8000),
    state: optionalText(80),
    city: optionalText(80),
    location: optionalText(180),
    startDate: optionalDate,
    endDate: optionalDate,
    expectedHours: z.coerce.number().int().min(1).max(2000).optional(),
    slots: z.coerce.number().int().min(1).max(100),
    requirements: optionalText(3000),
    learningObjectives: optionalText(3000),
    applicationDeadline: optionalDate,
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      value.endDate >= value.startDate,
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );

export type CreateInternshipListingInput = z.infer<
  typeof createInternshipListingSchema
>;

export const updateJobStatusSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(JOB_STATUSES),
});

export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;

export const updateInternshipStatusSchema = z.object({
  listingId: z.string().uuid(),
  status: z.enum(INTERNSHIP_LISTING_STATUSES),
});

export type UpdateInternshipStatusInput = z.infer<
  typeof updateInternshipStatusSchema
>;

export const applyToJobSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z
    .string()
    .trim()
    .max(4000, "Keep your cover letter under 4000 characters")
    .optional()
    .or(z.literal("")),
});

export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

export const applyToInternshipSchema = z.object({
  listingId: z.string().uuid(),
  coverNote: z
    .string()
    .trim()
    .max(2000, "Keep your note under 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type ApplyToInternshipInput = z.infer<typeof applyToInternshipSchema>;

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(APPLICATION_STATUSES),
});

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

export const updateInternshipApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(INTERNSHIP_APPLICATION_STATUSES),
});

export type UpdateInternshipApplicationStatusInput = z.infer<
  typeof updateInternshipApplicationStatusSchema
>;
