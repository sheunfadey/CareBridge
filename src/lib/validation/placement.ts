import { z } from "zod";

export const PLACEMENT_STATUSES = [
  "pending_agreement",
  "active",
  "completed",
  "terminated",
] as const;

export const placementStatusLabels: Record<
  (typeof PLACEMENT_STATUSES)[number],
  string
> = {
  pending_agreement: "Pending agreement",
  active: "Active",
  completed: "Completed",
  terminated: "Terminated",
};

export const PLACEMENT_AGREEMENT_STATUSES = [
  "pending",
  "accepted",
  "declined",
] as const;

export const placementAgreementStatusLabels: Record<
  (typeof PLACEMENT_AGREEMENT_STATUSES)[number],
  string
> = {
  pending: "Awaiting response",
  accepted: "Accepted",
  declined: "Declined",
};

export const INTERNSHIP_LOG_STATUSES = [
  "submitted",
  "approved",
  "changes_requested",
] as const;

export const internshipLogStatusLabels: Record<
  (typeof INTERNSHIP_LOG_STATUSES)[number],
  string
> = {
  submitted: "Submitted",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;

export const attendanceStatusLabels: Record<
  (typeof ATTENDANCE_STATUSES)[number],
  string
> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export const EVALUATION_RECOMMENDATIONS = [
  "pass",
  "needs_improvement",
  "fail",
] as const;

export const evaluationRecommendationLabels: Record<
  (typeof EVALUATION_RECOMMENDATIONS)[number],
  string
> = {
  pass: "Pass",
  needs_improvement: "Needs improvement",
  fail: "Fail",
};

export const INCIDENT_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const incidentSeverityLabels: Record<
  (typeof INCIDENT_SEVERITIES)[number],
  string
> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const INCIDENT_STATUSES = [
  "open",
  "investigating",
  "resolved",
  "closed",
] as const;

export const incidentStatusLabels: Record<
  (typeof INCIDENT_STATUSES)[number],
  string
> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

export const INTERVIEW_MODES = ["in_person", "video", "phone"] as const;

export const interviewModeLabels: Record<
  (typeof INTERVIEW_MODES)[number],
  string
> = {
  in_person: "In person",
  video: "Video call",
  phone: "Phone",
};

export const INTERVIEW_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const interviewStatusLabels: Record<
  (typeof INTERVIEW_STATUSES)[number],
  string
> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const OFFER_STATUSES = [
  "sent",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
] as const;

export const offerStatusLabels: Record<
  (typeof OFFER_STATUSES)[number],
  string
> = {
  sent: "Awaiting response",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .optional()
  .or(z.literal(""));

const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date");

const requiredDateTime = z
  .string()
  .trim()
  .min(1, "Choose a date and time")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Choose a valid date and time");

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || !Number.isNaN(Date.parse(value)),
    "Choose a valid date and time",
  );

const rating = z.coerce.number().int().min(1).max(5);

export const scheduleInterviewSchema = z
  .object({
    applicationId: z.string().uuid(),
    applicationType: z.enum(["job", "internship"]),
    scheduledAt: requiredDateTime,
    durationMinutes: z.coerce.number().int().min(10).max(480).default(30),
    mode: z.enum(INTERVIEW_MODES).default("in_person"),
    location: optionalText(240),
    meetingLink: optionalText(500),
  })
  .refine(
    (value) =>
      value.mode !== "in_person" || Boolean(value.location),
    { message: "Add where the interview will take place", path: ["location"] },
  )
  .refine(
    (value) => value.mode !== "video" || Boolean(value.meetingLink),
    { message: "Add the video call link", path: ["meetingLink"] },
  );

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;

export const interviewOutcomeSchema = z.object({
  interviewId: z.string().uuid(),
  status: z.enum(INTERVIEW_STATUSES),
  feedback: optionalText(3000),
  rating: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(5)])
    .optional(),
});

export type InterviewOutcomeInput = z.infer<typeof interviewOutcomeSchema>;

export const sendJobOfferSchema = z.object({
  applicationId: z.string().uuid(),
  employmentType: z.enum([
    "full_time",
    "part_time",
    "temporary",
    "contract",
    "internship",
  ]),
  salaryMinorUnits: z.coerce
    .number()
    .int()
    .min(0)
    .max(1_000_000_000)
    .optional(),
  salaryCurrency: z.string().trim().length(3).default("NGN"),
  startDate: optionalDate,
  expiresAt: optionalDateTime,
  notes: optionalText(2000),
});

export type SendJobOfferInput = z.infer<typeof sendJobOfferSchema>;

export const sendInternshipOfferSchema = z
  .object({
    applicationId: z.string().uuid(),
    startDate: optionalDate,
    endDate: optionalDate,
    expectedHours: z.coerce.number().int().min(1).max(2000).optional(),
    location: optionalText(240),
    expiresAt: optionalDateTime,
    notes: optionalText(2000),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.endDate >= value.startDate,
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );

export type SendInternshipOfferInput = z.infer<
  typeof sendInternshipOfferSchema
>;

export const respondToOfferSchema = z.object({
  offerId: z.string().uuid(),
  offerType: z.enum(["job", "internship"]),
  response: z.enum(["accepted", "declined"]),
});

export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;

export const withdrawOfferSchema = z.object({
  offerId: z.string().uuid(),
  offerType: z.enum(["job", "internship"]),
});

export type WithdrawOfferInput = z.infer<typeof withdrawOfferSchema>;

export const createPlacementSchema = z
  .object({
    applicationId: z.string().uuid(),
    supervisorId: z.string().uuid().optional().or(z.literal("")),
    startDate: requiredDate,
    endDate: requiredDate,
    expectedHours: z.coerce.number().int().min(1).max(2000).optional(),
    location: optionalText(240),
    state: optionalText(80),
    city: optionalText(80),
    learningObjectives: optionalText(3000),
    supervisionArrangements: optionalText(2000),
    safeguardingCleared: z.boolean().default(false),
    insuranceCleared: z.boolean().default(false),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type CreatePlacementInput = z.infer<typeof createPlacementSchema>;

export const updatePlacementSchema = z
  .object({
    placementId: z.string().uuid(),
    supervisorId: z.string().uuid().optional().or(z.literal("")),
    status: z.enum(PLACEMENT_STATUSES).optional(),
    startDate: optionalDate,
    endDate: optionalDate,
    expectedHours: z.coerce.number().int().min(1).max(2000).optional(),
    location: optionalText(240),
    learningObjectives: optionalText(3000),
    supervisionArrangements: optionalText(2000),
    safeguardingCleared: z.boolean().optional(),
    insuranceCleared: z.boolean().optional(),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.endDate >= value.startDate,
    { message: "End date must be on or after the start date", path: ["endDate"] },
  );

export type UpdatePlacementInput = z.infer<typeof updatePlacementSchema>;

export const placementAgreementSchema = z.object({
  placementId: z.string().uuid(),
  agreementStatus: z.enum(["accepted", "declined"]),
});

export type PlacementAgreementInput = z.infer<typeof placementAgreementSchema>;

export const completePlacementSchema = z.object({
  placementId: z.string().uuid(),
  completionSummary: z
    .string()
    .trim()
    .min(20, "Add a short completion summary")
    .max(4000),
});

export type CompletePlacementInput = z.infer<typeof completePlacementSchema>;

export const issueCompletionRecordSchema = z.object({
  placementId: z.string().uuid(),
  outcome: z.string().trim().min(3).max(120).default("completed"),
  hoursCompleted: z.coerce.number().int().min(0).max(10000),
  summary: optionalText(2000),
});

export type IssueCompletionRecordInput = z.infer<
  typeof issueCompletionRecordSchema
>;

export const weeklyLogSchema = z
  .object({
    placementId: z.string().uuid(),
    weekStart: requiredDate,
    weekEnd: requiredDate,
    hours: z.coerce.number().int().min(0).max(168),
    summary: z
      .string()
      .trim()
      .min(20, "Describe what you did this week")
      .max(4000),
    challenges: optionalText(2000),
    nextSteps: optionalText(2000),
  })
  .refine((value) => value.weekEnd >= value.weekStart, {
    message: "Week end must be on or after the week start",
    path: ["weekEnd"],
  });

export type WeeklyLogInput = z.infer<typeof weeklyLogSchema>;

export const reviewWeeklyLogSchema = z.object({
  logId: z.string().uuid(),
  status: z.enum(["approved", "changes_requested"]),
  supervisorFeedback: optionalText(2000),
});

export type ReviewWeeklyLogInput = z.infer<typeof reviewWeeklyLogSchema>;

export const attendanceSchema = z.object({
  placementId: z.string().uuid(),
  attendanceDate: requiredDate,
  status: z.enum(ATTENDANCE_STATUSES).default("present"),
  hours: z.coerce.number().int().min(0).max(24).default(0),
  notes: optionalText(1000),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const evaluationSchema = z.object({
  placementId: z.string().uuid(),
  evaluationDate: requiredDate,
  overallRating: rating,
  carePracticeRating: z.union([z.literal(""), rating]).optional(),
  communicationRating: z.union([z.literal(""), rating]).optional(),
  professionalismRating: z.union([z.literal(""), rating]).optional(),
  safeguardingRating: z.union([z.literal(""), rating]).optional(),
  strengths: optionalText(2000),
  areasForImprovement: optionalText(2000),
  recommendation: z.enum(EVALUATION_RECOMMENDATIONS),
  status: z.enum(["draft", "submitted"]).default("submitted"),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;

export const incidentSchema = z.object({
  placementId: z.string().uuid(),
  occurredAt: requiredDateTime,
  category: z
    .string()
    .trim()
    .min(3, "Choose or describe an incident category")
    .max(120),
  severity: z.enum(INCIDENT_SEVERITIES).default("medium"),
  description: z
    .string()
    .trim()
    .min(20, "Describe what happened")
    .max(4000),
});

export type IncidentInput = z.infer<typeof incidentSchema>;

export const resolveIncidentSchema = z.object({
  incidentId: z.string().uuid(),
  status: z.enum(INCIDENT_STATUSES),
  resolution: optionalText(3000),
});

export type ResolveIncidentInput = z.infer<typeof resolveIncidentSchema>;

export const placementProviderSchema = z.object({
  organisationId: z.string().uuid(),
  description: optionalText(2000),
  contactEmail: z
    .union([z.literal(""), z.string().trim().email("Use a valid email")])
    .optional(),
  contactPhone: optionalText(40),
  address: optionalText(240),
  state: optionalText(80),
  city: optionalText(80),
  safeguardingLead: optionalText(160),
  isAcceptingInterns: z.boolean().default(false),
});

export type PlacementProviderInput = z.infer<typeof placementProviderSchema>;
