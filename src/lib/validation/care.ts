import { z } from "zod";

import type {
  CareEmploymentStatus,
  CarePlanAccess,
  CarePlanStatus,
  CareReviewOutcome,
  CareTaskCategory,
  CareTaskRecordStatus,
  ExpensePaymentStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  InventoryMovementType,
  MedicationStatus,
  PurchaseRequestStatus,
  ResidentStatus,
  ServiceInvoiceStatus,
  ServicePaymentMethod,
  ShiftAssignmentStatus,
  ShiftStatus,
} from "@/types/database";

/**
 * Phase 7 care operations: validation schemas and display labels.
 *
 * Dates are submitted as `YYYY-MM-DD`; datetimes as `YYYY-MM-DDTHH:mm`
 * (datetime-local). Server actions convert them to ISO timestamps.
 */

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function isValidDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isValidDateTime(value: string): boolean {
  return dateTimePattern.test(value) && !Number.isNaN(new Date(value).getTime());
}

export const careDateSchema = z
  .string()
  .trim()
  .refine(isValidDate, "Use a valid date");

export const careDateTimeSchema = z
  .string()
  .trim()
  .refine(isValidDateTime, "Use a valid date and time");

const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().default("");

const optionalDate = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || isValidDate(value), "Use a valid date")
  .transform((value) => (value ? value : null));

// Status option sets -----------------------------------------------------------

export const RESIDENT_STATUSES = [
  "active",
  "on_leave",
  "discharged",
  "deceased",
] as const;

export const residentStatusLabels: Record<ResidentStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  discharged: "Discharged",
  deceased: "Deceased",
};

export const CARE_EMPLOYMENT_STATUSES = [
  "active",
  "on_leave",
  "suspended",
  "ended",
] as const;

export const careEmploymentStatusLabels: Record<CareEmploymentStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  suspended: "Suspended",
  ended: "Ended",
};

export const SHIFT_STATUSES = [
  "draft",
  "published",
  "completed",
  "cancelled",
] as const;

export const shiftStatusLabels: Record<ShiftStatus, string> = {
  draft: "Draft",
  published: "Published",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SHIFT_ASSIGNMENT_STATUSES = [
  "assigned",
  "confirmed",
  "declined",
  "absent",
  "completed",
  "cancelled",
] as const;

export const shiftAssignmentStatusLabels: Record<ShiftAssignmentStatus, string> = {
  assigned: "Assigned",
  confirmed: "Confirmed",
  declined: "Declined",
  absent: "Absent",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const CARE_TASK_CATEGORIES = [
  "personal_care",
  "meals_hydration",
  "mobility",
  "activities",
  "observation",
  "clinical",
  "other",
] as const;

export const careTaskCategoryLabels: Record<CareTaskCategory, string> = {
  personal_care: "Personal care",
  meals_hydration: "Meals and hydration",
  mobility: "Mobility",
  activities: "Activities",
  observation: "Observation",
  clinical: "Clinical task",
  other: "Other",
};

export const CARE_RECORD_STATUSES = [
  "completed",
  "refused",
  "not_done",
  "deferred",
] as const;

export const careRecordStatusLabels: Record<CareTaskRecordStatus, string> = {
  completed: "Completed",
  refused: "Refused",
  not_done: "Not completed",
  deferred: "Deferred",
};

export const CARE_REVIEW_OUTCOMES = [
  "accepted",
  "follow_up_required",
  "escalated",
] as const;

export const careReviewOutcomeLabels: Record<CareReviewOutcome, string> = {
  accepted: "Accepted",
  follow_up_required: "Follow-up required",
  escalated: "Escalated",
};

export const CARE_PLAN_STATUSES = [
  "draft",
  "pending_approval",
  "active",
  "rejected",
  "archived",
] as const;

export const carePlanStatusLabels: Record<CarePlanStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  active: "Active",
  rejected: "Rejected",
  archived: "Archived",
};

export const CARE_PLAN_ACCESS_LEVELS = ["standard", "restricted"] as const;

export const carePlanAccessLabels: Record<CarePlanAccess, string> = {
  standard: "Standard",
  restricted: "Restricted",
};

export const CARE_INCIDENT_CATEGORIES = [
  "fall",
  "injury",
  "safeguarding",
  "medication",
  "missing_person",
  "property",
  "other",
] as const;

export const careIncidentCategoryLabels: Record<IncidentCategory, string> = {
  fall: "Fall",
  injury: "Injury",
  safeguarding: "Safeguarding concern",
  medication: "Medication incident",
  missing_person: "Missing person",
  property: "Property damage",
  other: "Other",
};

// Reuses the Phase 5 incident vocabulary.
export const CARE_INCIDENT_STATUSES = [
  "open",
  "investigating",
  "resolved",
  "closed",
] as const;

export const careIncidentStatusLabels: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

export const CARE_INCIDENT_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const careIncidentSeverityLabels: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const MEDICATION_STATUSES = [
  "scheduled",
  "administered",
  "refused",
  "held",
  "omitted",
] as const;

export const medicationStatusLabels: Record<MedicationStatus, string> = {
  scheduled: "Scheduled",
  administered: "Administered",
  refused: "Refused",
  held: "Held",
  omitted: "Omitted",
};

export const INVENTORY_MOVEMENT_TYPES = [
  "opening",
  "purchase",
  "issue",
  "adjustment",
  "wastage",
  "return",
] as const;

export const inventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  opening: "Opening balance",
  purchase: "Purchase received",
  issue: "Issued",
  adjustment: "Adjustment",
  wastage: "Wastage",
  return: "Returned",
};

export const PURCHASE_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "ordered",
  "received",
  "cancelled",
] as const;

export const purchaseRequestStatusLabels: Record<PurchaseRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};

export const EXPENSE_PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "reimbursed",
  "void",
] as const;

export const expensePaymentStatusLabels: Record<ExpensePaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  reimbursed: "Reimbursed",
  void: "Void",
};

export const SERVICE_INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "void",
] as const;

export const serviceInvoiceStatusLabels: Record<ServiceInvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export const SERVICE_PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "cheque",
  "other",
] as const;

export const servicePaymentMethodLabels: Record<ServicePaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

// Schemas ----------------------------------------------------------------------

export const careFacilitySchema = z.object({
  facilityId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter a facility name").max(160),
  address: optionalText(300),
  city: optionalText(120),
  state: optionalText(120),
  phone: optionalText(40),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  capacity: z.coerce.number().int().positive().max(10000).optional(),
});

export const residentSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  residentId: z.string().uuid().optional(),
  reference: z.string().trim().min(1, "Enter an internal reference").max(40),
  firstName: z.string().trim().min(1, "Enter a first name").max(120),
  lastName: z.string().trim().min(1, "Enter a last name").max(120),
  preferredName: optionalText(120),
  dateOfBirth: optionalDate,
  gender: optionalText(40),
  roomNumber: optionalText(40),
  admissionDate: careDateSchema,
  dischargeDate: optionalDate,
  status: z.enum(RESIDENT_STATUSES),
  careLevel: optionalText(120),
  mobilityNotes: optionalText(),
  dietaryNotes: optionalText(),
  communicationNotes: optionalText(),
  accessibilityNeeds: optionalText(),
  careRequirements: optionalText(),
  medicalNotes: optionalText(),
});

export const residentContactSchema = z.object({
  residentId: z.string().uuid(),
  name: z.string().trim().min(1, "Enter a contact name").max(160),
  relationship: optionalText(80),
  phone: optionalText(40),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  isEmergency: z.boolean().default(false),
  isAuthorisedRepresentative: z.boolean().default(false),
  priority: z.coerce.number().int().min(1).max(20).default(1),
  notes: optionalText(),
});

export const residentRelationshipSchema = z.object({
  residentId: z.string().uuid(),
  email: z.string().trim().email("Enter the family member's account email"),
  relationship: optionalText(80),
  accessLevel: z.enum(["summary", "full"]),
});

export const residentConsentSchema = z.object({
  residentId: z.string().uuid(),
  consentType: z.enum([
    "care",
    "medical",
    "data_sharing",
    "photography",
    "research",
    "other",
  ]),
  granted: z.boolean(),
  grantedByName: optionalText(160),
  effectiveFrom: careDateSchema,
  expiresOn: optionalDate,
  evidenceReference: optionalText(300),
  notes: optionalText(),
});

export const staffSchema = z.object({
  organisationId: z.string().uuid(),
  email: z.string().trim().email("Enter the staff member's account email"),
  jobTitle: optionalText(120),
  employmentStatus: z.enum(CARE_EMPLOYMENT_STATUSES),
  startDate: optionalDate,
  endDate: optionalDate,
  notes: optionalText(),
});

export const staffQualificationSchema = z.object({
  staffId: z.string().uuid(),
  code: z.string().trim().min(2, "Enter a qualification code").max(60),
  name: z.string().trim().min(2, "Enter the qualification name").max(160),
  awardedOn: optionalDate,
  expiresOn: optionalDate,
  verificationStatus: z.enum(["unverified", "pending", "verified", "rejected"]),
  evidenceReference: optionalText(300),
});

export const staffTrainingSchema = z.object({
  staffId: z.string().uuid(),
  title: z.string().trim().min(2, "Enter the training title").max(160),
  completedOn: careDateSchema,
  expiresOn: optionalDate,
  evidenceReference: optionalText(300),
});

export const staffDocumentSchema = z.object({
  staffId: z.string().uuid(),
  documentType: z.string().trim().min(2, "Enter a document type").max(120),
  expiresOn: optionalDate,
  fileReference: optionalText(300),
  notes: optionalText(),
});

export const shiftSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  shiftId: z.string().uuid().optional(),
  title: optionalText(120),
  startsAt: careDateTimeSchema,
  endsAt: careDateTimeSchema,
  requiredStaff: z.coerce.number().int().min(1).max(100).default(1),
  requiredQualification: optionalText(60),
  notes: optionalText(),
});

export const shiftAssignmentSchema = z.object({
  shiftId: z.string().uuid(),
  staffUserId: z.string().uuid("Choose a staff member"),
});

export const shiftAttendanceSchema = z.object({
  assignmentId: z.string().uuid(),
  clockInAt: careDateTimeSchema,
  clockOutAt: z.string().trim().optional(),
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
  notes: optionalText(),
});

export const shiftHandoverSchema = z.object({
  shiftId: z.string().uuid(),
  summary: z.string().trim().min(5, "Summarise the shift").max(4000),
  outstandingTasks: optionalText(),
});

export const carePlanSchema = z.object({
  residentId: z.string().uuid(),
  planId: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Enter a plan title").max(160),
  summary: optionalText(),
  accessLevel: z.enum(CARE_PLAN_ACCESS_LEVELS),
  reviewDueOn: optionalDate,
});

export const carePlanVersionSchema = z.object({
  planId: z.string().uuid(),
  needs: z.string().trim().min(1, "Describe the assessed needs").max(8000),
  goals: optionalText(8000),
  responsibilities: optionalText(8000),
  risks: optionalText(8000),
  reviewCadence: optionalText(500),
  changeSummary: z.string().trim().min(2, "Describe what changed").max(500),
});

export const careTaskSchema = z.object({
  residentId: z.string().uuid(),
  carePlanId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Enter a task title").max(160),
  category: z.enum(CARE_TASK_CATEGORIES),
  instructions: optionalText(),
  scheduleTimes: optionalText(120),
  requiresTwoStaff: z.boolean().default(false),
  requiredQualification: optionalText(60),
});

export const careRecordSchema = z.object({
  residentId: z.string().uuid(),
  taskId: z.string().uuid().optional().or(z.literal("")),
  shiftId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(CARE_RECORD_STATUSES),
  completedAt: careDateTimeSchema,
  assistanceNotes: optionalText(),
  mealOffered: optionalText(160),
  mealConsumed: optionalText(160),
  hydrationMl: z.coerce.number().int().min(0).max(10000).optional(),
  mobilityNotes: optionalText(),
  observations: optionalText(),
});

export const careRecordReviewSchema = z.object({
  recordId: z.string().uuid(),
  reviewOutcome: z.enum(CARE_REVIEW_OUTCOMES),
  reviewNotes: optionalText(),
});

export const medicationSchema = z.object({
  residentId: z.string().uuid(),
  medicationRecordId: z.string().uuid().optional(),
  medicationName: z.string().trim().min(2, "Enter the medication name").max(200),
  doseText: optionalText(120),
  route: optionalText(80),
  scheduledAt: careDateTimeSchema,
  notes: optionalText(),
});

export const medicationStatusSchema = z.object({
  medicationRecordId: z.string().uuid(),
  status: z.enum(MEDICATION_STATUSES),
  reason: optionalText(500),
  witnessedByEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
});

export const incidentSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  residentId: z.string().uuid().optional().or(z.literal("")),
  category: z.enum(CARE_INCIDENT_CATEGORIES),
  severity: z.enum(CARE_INCIDENT_SEVERITIES),
  occurredAt: careDateTimeSchema,
  description: z.string().trim().min(10, "Describe what happened").max(8000),
  immediateAction: optionalText(4000),
  isSafeguarding: z.boolean().default(false),
  externalReference: optionalText(200),
});

export const incidentUpdateSchema = z.object({
  incidentId: z.string().uuid(),
  status: z.enum(CARE_INCIDENT_STATUSES),
  severity: z.enum(CARE_INCIDENT_SEVERITIES),
  reviewerEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
  closureNotes: optionalText(4000),
});

export const incidentActionSchema = z.object({
  incidentId: z.string().uuid(),
  action: z.string().trim().min(3, "Describe the corrective action").max(1000),
  ownerEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
  dueOn: optionalDate,
  notes: optionalText(),
});

export const supplierSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2, "Enter a supplier name").max(160),
  contactName: optionalText(120),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  phone: optionalText(40),
  address: optionalText(300),
  notes: optionalText(),
});

export const inventoryItemSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  itemId: z.string().uuid().optional(),
  sku: z.string().trim().min(1, "Enter a SKU").max(60),
  name: z.string().trim().min(2, "Enter an item name").max(160),
  category: optionalText(80),
  unit: z.string().trim().min(1, "Enter a unit").max(40),
  reorderLevel: z.coerce.number().min(0).max(1000000).default(0),
  openingQuantity: z.coerce.number().positive().max(1000000).optional(),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().uuid(),
  movementType: z.enum(INVENTORY_MOVEMENT_TYPES),
  quantity: z.coerce.number().positive("Enter a quantity").max(1000000),
  reason: optionalText(500),
  reference: optionalText(120),
});

export const purchaseRequestSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  neededBy: optionalDate,
  notes: optionalText(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(2, "Describe the item").max(200),
        quantity: z.coerce.number().positive().max(1000000),
        estimatedUnitCost: z.string().trim().min(1, "Enter an estimate"),
        inventoryItemId: z.string().uuid().optional().or(z.literal("")),
      }),
    )
    .min(1, "Add at least one item"),
});

export const purchaseRequestDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: optionalText(1000),
});

export const expenseSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  category: z.string().trim().min(2, "Enter an expense category").max(120),
  description: optionalText(),
  amount: z.string().trim().min(1, "Enter the amount"),
  incurredOn: careDateSchema,
  paymentStatus: z.enum(EXPENSE_PAYMENT_STATUSES),
  paymentMethod: optionalText(80),
  receiptReference: optionalText(300),
  supplierId: z.string().uuid().optional().or(z.literal("")),
});

export const invoiceSchema = z.object({
  facilityId: z.string().uuid("Choose a facility"),
  residentId: z.string().uuid().optional().or(z.literal("")),
  payerName: z.string().trim().min(2, "Enter the payer name").max(160),
  payerContact: optionalText(160),
  issueDate: careDateSchema,
  dueDate: careDateSchema,
  notes: optionalText(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(2, "Describe the charge").max(200),
        quantity: z.coerce.number().positive().max(100000),
        unitPrice: z.string().trim().min(1, "Enter the unit price"),
      }),
    )
    .min(1, "Add at least one line item"),
});

export const invoiceIssueSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const servicePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().trim().min(1, "Enter the amount"),
  paidAt: careDateTimeSchema,
  method: z.enum(SERVICE_PAYMENT_METHODS),
  reference: optionalText(160),
  receiptReference: optionalText(160),
  notes: optionalText(),
});

export const serviceRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.string().trim().min(1, "Enter the amount"),
  reason: z.string().trim().min(3, "Enter a refund reason").max(500),
});

// Types inferred from the generated database enums are imported at the top.

