"use server";

import { revalidatePath } from "next/cache";

import { parseMoneyToMinorUnits } from "@/lib/money";
import {
  careFacilitySchema,
  carePlanSchema,
  carePlanVersionSchema,
  careRecordReviewSchema,
  careRecordSchema,
  careTaskSchema,
  expenseSchema,
  incidentActionSchema,
  incidentSchema,
  incidentUpdateSchema,
  inventoryItemSchema,
  inventoryMovementSchema,
  invoiceIssueSchema,
  invoiceSchema,
  medicationSchema,
  medicationStatusSchema,
  purchaseRequestDecisionSchema,
  purchaseRequestSchema,
  residentConsentSchema,
  residentContactSchema,
  residentRelationshipSchema,
  residentSchema,
  servicePaymentSchema,
  serviceRefundSchema,
  shiftAssignmentSchema,
  shiftAttendanceSchema,
  shiftHandoverSchema,
  shiftSchema,
  staffDocumentSchema,
  staffQualificationSchema,
  staffSchema,
  staffTrainingSchema,
  staffAvailabilitySchema,
  supplierSchema,
} from "@/lib/validation/care";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/server/audit/record-audit";
import { assertPermission, AuthorisationError } from "@/server/auth/guards";
import { requireUser } from "@/server/auth/current-user";
import {
  assertCareFacility,
  listCareWorkspaces,
  type CareWorkspace,
} from "@/server/care/access";

export type CareActionResult =
  | { ok: true; message: string; id?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

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

function invalid(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): CareActionResult {
  return {
    ok: false,
    message: "Check the highlighted fields.",
    fieldErrors: fieldErrorsFromZod(error.issues),
  };
}

function friendlyDbMessage(message: string): string {
  const value = message.toLowerCase();
  if (value.includes("read-only because the subscription")) {
    return "This workspace is read-only because the subscription is suspended or expired. Existing records remain readable and exportable.";
  }
  if (value.includes("does not include the")) {
    return message;
  }
  if (value.includes("user limit for this plan")) {
    return "This plan's user limit has been reached. Upgrade the plan to add more members.";
  }
  if (value.includes("facility limit for this plan")) {
    return "This plan's facility limit has been reached. Upgrade the plan to add more facilities.";
  }
  if (value.includes("overlapping shift")) {
    return "That worker is already assigned to an overlapping shift.";
  }
  if (value.includes("required verified qualification")) {
    return "The selected worker does not hold the required verified qualification.";
  }
  if (value.includes("must be an active member")) {
    return "The selected person is not an active member of this workspace yet.";
  }
  if (value.includes("payment exceeds")) {
    return "The payment is more than the outstanding invoice balance.";
  }
  if (value.includes("refund exceeds")) {
    return "The refund is more than the recorded payment.";
  }
  if (value.includes("only be recorded against an issued invoice")) {
    return "Issue the invoice before recording a payment.";
  }
  if (value.includes("while the invoice is a draft")) {
    return "Invoice lines can only be changed while the invoice is a draft.";
  }
  if (value.includes("append-only")) {
    return "This record is append-only. Record a correction instead of editing it.";
  }
  if (value.includes("immutable")) {
    return "This record is locked. Record a new entry instead of editing it.";
  }
  if (value.includes("already been recorded")) {
    return "An opening balance has already been recorded for this item.";
  }
  if (value.includes("duplicate key")) {
    return "A record with those details already exists.";
  }
  if (value.includes("cannot be edited")) {
    return "This record has been reviewed and can no longer be edited.";
  }
  return "The change could not be saved. Check the details and try again.";
}

function friendlyError(error: unknown): CareActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission for this action." };
  }
  console.error("[care] action failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return { ok: false, message: "Something went wrong. Try again shortly." };
}

function parseMoney(value: string): number | null {
  try {
    const minor = parseMoneyToMinorUnits(value);
    return minor > 0 ? minor : null;
  } catch {
    return null;
  }
}

function iso(value: string): string {
  return new Date(value).toISOString();
}

function revalidateCare(organisationId: string) {
  revalidatePath(`/dashboard/care-homes`);
  revalidatePath(`/dashboard/care-homes/organisation/${organisationId}`);
  revalidatePath("/dashboard/care-homes/residents");
  revalidatePath("/dashboard/care-homes/staff");
  revalidatePath("/dashboard/care-homes/roster");
  revalidatePath("/dashboard/care-homes/incidents");
  revalidatePath("/dashboard/care-homes/inventory");
  revalidatePath("/dashboard/care-homes/expenses");
  revalidatePath("/dashboard/care-homes/invoices");
  revalidatePath("/dashboard/care-homes/reports");
}

async function requireAction(
  organisationId: string,
  permission:
    | "resident_manage"
    | "resident_view"
    | "staff_manage"
    | "shift_manage"
    | "care_record_manage"
    | "care_plan_manage"
    | "medication_manage"
    | "incident_manage"
    | "inventory_manage"
    | "expense_manage"
    | "expense_approve"
    | "invoice_manage",
): Promise<{ user: Awaited<ReturnType<typeof requireUser>>; workspace: CareWorkspace }> {
  const user = await requireUser();
  const workspaces = await listCareWorkspaces(user);
  const workspace = workspaces.find(
    (item) => item.organisationId === organisationId,
  );
  if (!workspace) {
    throw new AuthorisationError("Not a care workspace", "FORBIDDEN");
  }
  await assertPermission(user.id, permission, organisationId);
  return { user, workspace };
}

async function profileByEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email.trim())
    .maybeSingle();
  return data;
}

// Facilities -------------------------------------------------------------------

export async function saveFacilityAction(input: {
  organisationId: string;
  facilityId?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  capacity?: number;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "resident_manage");
    const parsed = careFacilitySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const payload = {
      organisation_id: input.organisationId,
      name: data.name,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      phone: data.phone || null,
      email: data.email || null,
      capacity: data.capacity ?? null,
    };

    if (data.facilityId) {
      const { error } = await supabase
        .from("care_facilities")
        .update(payload)
        .eq("id", data.facilityId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { error } = await supabase.from("care_facilities").insert(payload);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.facility.saved",
      entityType: "care_facility",
      entityId: data.facilityId ?? null,
      metadata: { name: data.name },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Facility saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Residents --------------------------------------------------------------------

export async function saveResidentAction(input: {
  organisationId: string;
  residentId?: string;
  facilityId: string;
  reference: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  roomNumber?: string;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  careLevel?: string;
  mobilityNotes?: string;
  dietaryNotes?: string;
  communicationNotes?: string;
  accessibilityNeeds?: string;
  careRequirements?: string;
  medicalNotes?: string;
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "resident_manage",
    );
    assertCareFacility(workspace, input.facilityId);

    const parsed = residentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    if (data.status === "discharged" && !data.dischargeDate) {
      return {
        ok: false,
        message: "Enter a discharge date.",
        fieldErrors: { dischargeDate: ["Enter a discharge date."] },
      };
    }

    const payload = {
      organisation_id: input.organisationId,
      facility_id: data.facilityId,
      reference: data.reference,
      first_name: data.firstName,
      last_name: data.lastName,
      preferred_name: data.preferredName || null,
      date_of_birth: data.dateOfBirth,
      gender: data.gender || null,
      room_number: data.roomNumber || null,
      admission_date: data.admissionDate,
      discharge_date: data.dischargeDate,
      status: data.status,
      care_level: data.careLevel || null,
      mobility_notes: data.mobilityNotes || null,
      dietary_notes: data.dietaryNotes || null,
      communication_notes: data.communicationNotes || null,
      accessibility_needs: data.accessibilityNeeds || null,
      care_requirements: data.careRequirements || null,
      medical_notes: data.medicalNotes || null,
      created_by: user.id,
    };

    const supabase = await createClient();
    let residentId = data.residentId;

    if (residentId) {
      const { error } = await supabase
        .from("residents")
        .update(payload)
        .eq("id", residentId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("residents")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      residentId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.resident.saved",
      entityType: "resident",
      entityId: residentId,
      metadata: { reference: data.reference, status: data.status },
    });
    revalidateCare(input.organisationId);
    revalidatePath(`/dashboard/care-homes/residents/${residentId}`);
    return {
      ok: true,
      message: "Resident record saved.",
      id: residentId,
      redirectTo: `/dashboard/care-homes/residents/${residentId}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function addResidentContactAction(input: {
  organisationId: string;
  residentId: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  isEmergency: boolean;
  isAuthorisedRepresentative: boolean;
  priority: number;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "resident_manage");
    const parsed = residentContactSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("resident_contacts").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      name: data.name,
      relationship: data.relationship || null,
      phone: data.phone || null,
      email: data.email || null,
      is_emergency: data.isEmergency,
      is_authorised_representative: data.isAuthorisedRepresentative,
      priority: data.priority,
      notes: data.notes || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.resident.contact_saved",
      entityType: "resident_contact",
      entityId: data.residentId,
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: "Contact added." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function linkResidentFamilyAction(input: {
  organisationId: string;
  residentId: string;
  email: string;
  relationship?: string;
  accessLevel: "summary" | "full";
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "resident_manage");
    const parsed = residentRelationshipSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const profile = await profileByEmail(data.email);
    if (!profile) {
      return {
        ok: false,
        message:
          "No HillCrest account uses that email. Ask them to register first, then link the account.",
        fieldErrors: { email: ["No account found for this email."] },
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("resident_relationships").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      user_id: profile.id,
      relationship: data.relationship || null,
      access_level: data.accessLevel,
      invited_by: user.id,
    });
    if (error) {
      if (error.message.toLowerCase().includes("duplicate key")) {
        return { ok: false, message: "That family member is already linked." };
      }
      return { ok: false, message: friendlyDbMessage(error.message) };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.resident.relationship_linked",
      entityType: "resident_relationship",
      entityId: data.residentId,
      metadata: { linkedUserId: profile.id, accessLevel: data.accessLevel },
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: `Linked ${profile.full_name ?? profile.email}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function revokeResidentFamilyAction(input: {
  organisationId: string;
  relationshipId: string;
  residentId: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "resident_manage");
    const supabase = await createClient();
    const { error } = await supabase
      .from("resident_relationships")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", input.relationshipId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.resident.relationship_revoked",
      entityType: "resident_relationship",
      entityId: input.relationshipId,
    });
    revalidatePath(`/dashboard/care-homes/residents/${input.residentId}`);
    return { ok: true, message: "Family access revoked." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordResidentConsentAction(input: {
  organisationId: string;
  residentId: string;
  consentType: string;
  granted: boolean;
  grantedByName?: string;
  effectiveFrom: string;
  expiresOn?: string;
  evidenceReference?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "resident_manage");
    const parsed = residentConsentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("resident_consents").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      consent_type: data.consentType,
      granted: data.granted,
      granted_by_name: data.grantedByName || null,
      effective_from: data.effectiveFrom,
      expires_on: data.expiresOn,
      evidence_reference: data.evidenceReference || null,
      notes: data.notes || null,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.resident.consent_recorded",
      entityType: "resident_consent",
      entityId: data.residentId,
      metadata: { consentType: data.consentType, granted: data.granted },
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: "Consent recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Staff ------------------------------------------------------------------------

export async function saveStaffAction(input: {
  organisationId: string;
  email: string;
  jobTitle?: string;
  employmentStatus: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "staff_manage");
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const profile = await profileByEmail(data.email);
    if (!profile) {
      return {
        ok: false,
        message: "No HillCrest account uses that email.",
        fieldErrors: { email: ["No account found for this email."] },
      };
    }

    const supabase = await createClient();
    const { data: membership } = await supabase
      .from("organisation_memberships")
      .select("id")
      .eq("organisation_id", input.organisationId)
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return {
        ok: false,
        message:
          "Invite this person to the workspace first, then add their care staff profile.",
      };
    }

    const { data: existing } = await supabase
      .from("care_staff_profiles")
      .select("id")
      .eq("organisation_id", input.organisationId)
      .eq("user_id", profile.id)
      .maybeSingle();

    const payload = {
      organisation_id: input.organisationId,
      user_id: profile.id,
      job_title: data.jobTitle || null,
      employment_status: data.employmentStatus,
      start_date: data.startDate,
      end_date: data.endDate,
      notes: data.notes || null,
      created_by: user.id,
    };

    let staffId = existing?.id;
    if (staffId) {
      const { error } = await supabase
        .from("care_staff_profiles")
        .update(payload)
        .eq("id", staffId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("care_staff_profiles")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      staffId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.staff.saved",
      entityType: "care_staff_profile",
      entityId: staffId,
      metadata: { userId: profile.id },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Staff profile saved.", id: staffId };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveStaffQualificationAction(input: {
  organisationId: string;
  staffId: string;
  code: string;
  name: string;
  awardedOn?: string;
  expiresOn?: string;
  verificationStatus: string;
  evidenceReference?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "staff_manage");
    const parsed = staffQualificationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("staff_qualifications").upsert(
      {
        organisation_id: input.organisationId,
        staff_id: data.staffId,
        code: data.code.toUpperCase(),
        name: data.name,
        awarded_on: data.awardedOn,
        expires_on: data.expiresOn,
        verification_status: data.verificationStatus as
          | "unverified"
          | "pending"
          | "verified"
          | "rejected",
        evidence_reference: data.evidenceReference || null,
        created_by: user.id,
      },
      { onConflict: "staff_id,code" },
    );
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.staff.qualification_saved",
      entityType: "staff_qualification",
      entityId: data.staffId,
      metadata: { code: data.code },
    });
    revalidatePath("/dashboard/care-homes/staff");
    return { ok: true, message: "Qualification saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveStaffTrainingAction(input: {
  organisationId: string;
  staffId: string;
  title: string;
  completedOn: string;
  expiresOn?: string;
  evidenceReference?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "staff_manage");
    const parsed = staffTrainingSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("staff_training_records").insert({
      organisation_id: input.organisationId,
      staff_id: data.staffId,
      title: data.title,
      completed_on: data.completedOn,
      expires_on: data.expiresOn,
      evidence_reference: data.evidenceReference || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.staff.training_saved",
      entityType: "staff_training_record",
      entityId: data.staffId,
      metadata: { title: data.title },
    });
    revalidatePath("/dashboard/care-homes/staff");
    return { ok: true, message: "Training record saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveStaffDocumentAction(input: {
  organisationId: string;
  staffId: string;
  documentType: string;
  expiresOn?: string;
  fileReference?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "staff_manage");
    const parsed = staffDocumentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("staff_documents").insert({
      organisation_id: input.organisationId,
      staff_id: data.staffId,
      document_type: data.documentType,
      expires_on: data.expiresOn,
      file_reference: data.fileReference || null,
      notes: data.notes || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.staff.document_saved",
      entityType: "staff_document",
      entityId: data.staffId,
      metadata: { documentType: data.documentType },
    });
    revalidatePath("/dashboard/care-homes/staff");
    return { ok: true, message: "Document record saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveStaffAvailabilityAction(input: {
  organisationId: string;
  staffId: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "staff_manage");
    const parsed = staffAvailabilitySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    const availability: Record<string, { start: string; end: string }> = {};
    for (const day of days) {
      const value = data[day];
      if (!value) continue;
      const [start, end] = value.split("-");
      if (start >= end) {
        return {
          ok: false,
          message: `The ${day} end time must be after the start time.`,
          fieldErrors: { [day]: ["The end time must be after the start time."] },
        };
      }
      availability[day] = { start, end };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("care_staff_profiles")
      .update({ availability })
      .eq("id", data.staffId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.staff.saved",
      entityType: "care_staff_profile",
      entityId: data.staffId,
      metadata: { availability: true },
    });
    revalidatePath("/dashboard/care-homes/staff");
    return { ok: true, message: "Staff availability saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Shifts -----------------------------------------------------------------------

export async function saveShiftAction(input: {
  organisationId: string;
  facilityId: string;
  shiftId?: string;
  title?: string;
  startsAt: string;
  endsAt: string;
  requiredStaff: number;
  requiredQualification?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(input.organisationId, "shift_manage");
    assertCareFacility(workspace, input.facilityId);

    const parsed = shiftSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const startsAt = iso(data.startsAt);
    const endsAt = iso(data.endsAt);
    if (new Date(endsAt) <= new Date(startsAt)) {
      return {
        ok: false,
        message: "The shift must end after it starts.",
        fieldErrors: { endsAt: ["The shift must end after it starts."] },
      };
    }

    const payload = {
      organisation_id: input.organisationId,
      facility_id: data.facilityId,
      title: data.title || null,
      starts_at: startsAt,
      ends_at: endsAt,
      required_staff: data.requiredStaff,
      required_qualification: data.requiredQualification || null,
      notes: data.notes || null,
      created_by: user.id,
    };

    const supabase = await createClient();
    let shiftId = data.shiftId;

    if (shiftId) {
      const { error } = await supabase
        .from("shift_schedules")
        .update(payload)
        .eq("id", shiftId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("shift_schedules")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      shiftId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.saved",
      entityType: "shift_schedule",
      entityId: shiftId,
      metadata: { startsAt, endsAt },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Shift saved.", id: shiftId };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function updateShiftStatusAction(input: {
  organisationId: string;
  shiftId: string;
  status: "draft" | "published" | "completed" | "cancelled";
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "shift_manage");
    const supabase = await createClient();
    const { error } = await supabase
      .from("shift_schedules")
      .update({ status: input.status })
      .eq("id", input.shiftId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.saved",
      entityType: "shift_schedule",
      entityId: input.shiftId,
      metadata: { status: input.status },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: `Shift marked ${input.status}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function assignStaffToShiftAction(input: {
  organisationId: string;
  shiftId: string;
  staffUserId: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "shift_manage");
    const parsed = shiftAssignmentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const supabase = await createClient();
    const { error } = await supabase.from("shift_assignments").insert({
      organisation_id: input.organisationId,
      shift_id: parsed.data.shiftId,
      staff_user_id: parsed.data.staffUserId,
      status: "assigned",
      assigned_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.assignment_saved",
      entityType: "shift_assignment",
      entityId: parsed.data.shiftId,
      metadata: { staffUserId: parsed.data.staffUserId },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Staff assigned to the shift." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function removeShiftAssignmentAction(input: {
  organisationId: string;
  assignmentId: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "shift_manage");
    const supabase = await createClient();
    const { error } = await supabase
      .from("shift_assignments")
      .delete()
      .eq("id", input.assignmentId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.assignment_removed",
      entityType: "shift_assignment",
      entityId: input.assignmentId,
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Assignment removed." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordShiftAttendanceAction(input: {
  organisationId: string;
  assignmentId: string;
  clockInAt: string;
  clockOutAt?: string;
  breakMinutes: number;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "shift_manage");
    const parsed = shiftAttendanceSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("shift_attendance").upsert(
      {
        organisation_id: input.organisationId,
        assignment_id: data.assignmentId,
        clock_in_at: iso(data.clockInAt),
        clock_out_at: data.clockOutAt ? iso(data.clockOutAt) : null,
        break_minutes: data.breakMinutes,
        notes: data.notes || null,
        recorded_by: user.id,
      },
      { onConflict: "assignment_id" },
    );
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.attendance_saved",
      entityType: "shift_attendance",
      entityId: data.assignmentId,
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Attendance saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function submitShiftHandoverAction(input: {
  organisationId: string;
  shiftId: string;
  summary: string;
  outstandingTasks?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_record_manage");
    const parsed = shiftHandoverSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { data: shift } = await supabase
      .from("shift_schedules")
      .select("facility_id")
      .eq("id", data.shiftId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!shift) {
      return { ok: false, message: "Shift not found." };
    }

    const { error } = await supabase.from("shift_handovers").insert({
      organisation_id: input.organisationId,
      shift_id: data.shiftId,
      facility_id: shift.facility_id,
      summary: data.summary,
      outstanding_tasks: data.outstandingTasks || null,
      submitted_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.shift.handover_saved",
      entityType: "shift_handover",
      entityId: data.shiftId,
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Handover recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Care plans and records -------------------------------------------------------

export async function saveCarePlanAction(input: {
  organisationId: string;
  residentId: string;
  planId?: string;
  title: string;
  summary?: string;
  accessLevel: "standard" | "restricted";
  reviewDueOn?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_plan_manage");
    const parsed = carePlanSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    let planId = data.planId;
    const payload = {
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      title: data.title,
      summary: data.summary || null,
      access_level: data.accessLevel,
      review_due_on: data.reviewDueOn,
      created_by: user.id,
    };

    if (planId) {
      const { error } = await supabase
        .from("care_plans")
        .update(payload)
        .eq("id", planId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("care_plans")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      planId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.plan.saved",
      entityType: "care_plan",
      entityId: planId,
    });
    revalidateCare(input.organisationId);
    revalidatePath(`/dashboard/care-homes/plans/${planId}`);
    return {
      ok: true,
      message: "Care plan saved.",
      id: planId,
      redirectTo: `/dashboard/care-homes/plans/${planId}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveCarePlanVersionAction(input: {
  organisationId: string;
  planId: string;
  needs: string;
  goals?: string;
  responsibilities?: string;
  risks?: string;
  reviewCadence?: string;
  changeSummary: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_plan_manage");
    const parsed = carePlanVersionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { data: plan } = await supabase
      .from("care_plans")
      .select("id, resident_id")
      .eq("id", data.planId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!plan) {
      return { ok: false, message: "Care plan not found." };
    }

    const { data: latest } = await supabase
      .from("care_plan_versions")
      .select("version_number")
      .eq("plan_id", data.planId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const versionNumber = (latest?.version_number ?? 0) + 1;

    const { data: inserted, error } = await supabase
      .from("care_plan_versions")
      .insert({
        organisation_id: input.organisationId,
        plan_id: data.planId,
        resident_id: plan.resident_id,
        version_number: versionNumber,
        content: {
          needs: data.needs,
          goals: data.goals || "",
          responsibilities: data.responsibilities || "",
          risks: data.risks || "",
          reviewCadence: data.reviewCadence || "",
        },
        change_summary: data.changeSummary,
        created_by: user.id,
      })
      .select("id, version_number")
      .single();
    if (error || !inserted) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    await supabase
      .from("care_plans")
      .update({ current_version_id: inserted.id })
      .eq("id", data.planId)
      .eq("organisation_id", input.organisationId);

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.plan.version_saved",
      entityType: "care_plan_version",
      entityId: inserted.id,
      metadata: { planId: data.planId, version: inserted.version_number },
    });
    revalidatePath(`/dashboard/care-homes/plans/${data.planId}`);
    return { ok: true, message: `Version ${inserted.version_number} saved.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function changeCarePlanStatusAction(input: {
  organisationId: string;
  planId: string;
  status: "pending_approval" | "active" | "rejected" | "archived";
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_plan_manage");
    const supabase = await createClient();
    const { error } = await supabase
      .from("care_plans")
      .update({
        status: input.status,
        approved_by: input.status === "active" ? user.id : null,
      })
      .eq("id", input.planId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.plan.status_changed",
      entityType: "care_plan",
      entityId: input.planId,
      metadata: { status: input.status },
    });
    revalidatePath("/dashboard/care-homes/plans");
    revalidatePath(`/dashboard/care-homes/plans/${input.planId}`);
    return { ok: true, message: `Care plan marked ${input.status.replaceAll("_", " ")}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveCareTaskAction(input: {
  organisationId: string;
  residentId: string;
  carePlanId?: string;
  title: string;
  category: string;
  instructions?: string;
  scheduleTimes?: string;
  requiresTwoStaff: boolean;
  requiredQualification?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_plan_manage");
    const parsed = careTaskSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("care_tasks").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      care_plan_id: data.carePlanId || null,
      title: data.title,
      category: data.category as
        | "personal_care"
        | "meals_hydration"
        | "mobility"
        | "activities"
        | "observation"
        | "clinical"
        | "other",
      instructions: data.instructions || null,
      schedule_times: (data.scheduleTimes || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      requires_two_staff: data.requiresTwoStaff,
      required_qualification: data.requiredQualification || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.record.saved",
      entityType: "care_task",
      entityId: data.residentId,
      metadata: { title: data.title },
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: "Care task added." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordCareAction(input: {
  organisationId: string;
  residentId: string;
  taskId?: string;
  shiftId?: string;
  status: "completed" | "refused" | "not_done" | "deferred";
  completedAt: string;
  assistanceNotes?: string;
  mealOffered?: string;
  mealConsumed?: string;
  hydrationMl?: number;
  mobilityNotes?: string;
  observations?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_record_manage");
    const parsed = careRecordSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("care_task_records").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      task_id: data.taskId || null,
      shift_id: data.shiftId || null,
      recorded_by: user.id,
      status: data.status,
      completed_at: iso(data.completedAt),
      assistance_notes: data.assistanceNotes || null,
      meal_offered: data.mealOffered || null,
      meal_consumed: data.mealConsumed || null,
      hydration_ml: data.hydrationMl ?? null,
      mobility_notes: data.mobilityNotes || null,
      observations: data.observations || null,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.record.saved",
      entityType: "care_task_record",
      entityId: data.residentId,
      metadata: { status: data.status, taskId: data.taskId || null },
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: "Care record saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewCareRecordAction(input: {
  organisationId: string;
  recordId: string;
  reviewOutcome: "accepted" | "follow_up_required" | "escalated";
  reviewNotes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "care_plan_manage");
    const parsed = careRecordReviewSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("care_task_records")
      .update({
        review_outcome: data.reviewOutcome,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: data.reviewNotes || null,
      })
      .eq("id", input.recordId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.record.reviewed",
      entityType: "care_task_record",
      entityId: input.recordId,
      metadata: { outcome: data.reviewOutcome },
    });
    revalidatePath("/dashboard/care-homes");
    return { ok: true, message: "Care record reviewed." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Medication -------------------------------------------------------------------

export async function scheduleMedicationAction(input: {
  organisationId: string;
  residentId: string;
  medicationName: string;
  doseText?: string;
  route?: string;
  scheduledAt: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "medication_manage");
    const parsed = medicationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { data: resident } = await supabase
      .from("residents")
      .select("facility_id")
      .eq("id", data.residentId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!resident) {
      return { ok: false, message: "Resident not found." };
    }

    const { error } = await supabase.from("medication_records").insert({
      organisation_id: input.organisationId,
      resident_id: data.residentId,
      facility_id: resident.facility_id,
      medication_name: data.medicationName,
      dose_text: data.doseText || null,
      route: data.route || null,
      scheduled_at: iso(data.scheduledAt),
      notes: data.notes || null,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.medication.scheduled",
      entityType: "medication_record",
      entityId: data.residentId,
      metadata: { medicationName: data.medicationName },
    });
    revalidatePath(`/dashboard/care-homes/residents/${data.residentId}`);
    return { ok: true, message: "Medication scheduled." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordMedicationStatusAction(input: {
  organisationId: string;
  medicationRecordId: string;
  status: "administered" | "refused" | "held" | "omitted";
  reason?: string;
  witnessedByEmail?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "medication_manage");
    const parsed = medicationStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    let witnessedBy: string | null = null;
    if (data.witnessedByEmail) {
      const witness = await profileByEmail(data.witnessedByEmail);
      if (!witness) {
        return {
          ok: false,
          message: "No account matches the witness email.",
          fieldErrors: { witnessedByEmail: ["No account found."] },
        };
      }
      witnessedBy = witness.id;
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("medication_records")
      .update({
        status: data.status,
        reason: data.reason || null,
        witnessed_by: witnessedBy,
      })
      .eq("id", input.medicationRecordId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.medication.recorded",
      entityType: "medication_record",
      entityId: input.medicationRecordId,
      metadata: { status: data.status },
    });
    revalidatePath("/dashboard/care-homes/medication");
    return { ok: true, message: `Medication marked ${data.status}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

// Incidents --------------------------------------------------------------------

export async function reportIncidentAction(input: {
  organisationId: string;
  facilityId: string;
  residentId?: string;
  category: string;
  severity: string;
  occurredAt: string;
  description: string;
  immediateAction?: string;
  isSafeguarding: boolean;
  externalReference?: string;
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "incident_manage",
    );
    assertCareFacility(workspace, input.facilityId);

    const parsed = incidentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from("incidents")
      .insert({
        organisation_id: input.organisationId,
        facility_id: data.facilityId,
        resident_id: data.residentId || null,
        category: data.category as
          | "fall"
          | "injury"
          | "safeguarding"
          | "medication"
          | "missing_person"
          | "property"
          | "other",
        severity: data.severity as "low" | "medium" | "high" | "critical",
        occurred_at: iso(data.occurredAt),
        reported_by: user.id,
        description: data.description,
        immediate_action: data.immediateAction || null,
        is_safeguarding: data.isSafeguarding,
        external_reference: data.externalReference || null,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.incident.reported",
      entityType: "incident",
      entityId: inserted.id,
      metadata: { category: data.category, severity: data.severity },
    });
    revalidateCare(input.organisationId);
    return {
      ok: true,
      message: "Incident reported.",
      id: inserted.id,
      redirectTo: `/dashboard/care-homes/incidents/${inserted.id}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function updateIncidentAction(input: {
  organisationId: string;
  incidentId: string;
  status: "open" | "investigating" | "resolved" | "closed";
  severity: "low" | "medium" | "high" | "critical";
  reviewerEmail?: string;
  closureNotes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "incident_manage");
    const parsed = incidentUpdateSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    let reviewerId: string | null | undefined;
    if (data.reviewerEmail) {
      const reviewer = await profileByEmail(data.reviewerEmail);
      if (!reviewer) {
        return {
          ok: false,
          message: "No account matches the reviewer email.",
          fieldErrors: { reviewerEmail: ["No account found."] },
        };
      }
      reviewerId = reviewer.id;
    }

    const supabase = await createClient();
    const payload: {
      status: typeof data.status;
      severity: typeof data.severity;
      closure_notes: string | null;
      assigned_reviewer?: string;
    } = {
      status: data.status,
      severity: data.severity,
      closure_notes: data.closureNotes || null,
    };
    if (reviewerId) payload.assigned_reviewer = reviewerId;

    const { error } = await supabase
      .from("incidents")
      .update(payload)
      .eq("id", input.incidentId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.incident.updated",
      entityType: "incident",
      entityId: input.incidentId,
      metadata: { status: data.status, severity: data.severity },
    });
    revalidatePath("/dashboard/care-homes/incidents");
    revalidatePath(`/dashboard/care-homes/incidents/${input.incidentId}`);
    return { ok: true, message: "Incident updated." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function addIncidentActionAction(input: {
  organisationId: string;
  incidentId: string;
  action: string;
  ownerEmail?: string;
  dueOn?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "incident_manage");
    const parsed = incidentActionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    let ownerId: string | null = null;
    if (data.ownerEmail) {
      const owner = await profileByEmail(data.ownerEmail);
      if (!owner) {
        return {
          ok: false,
          message: "No account matches the owner email.",
          fieldErrors: { ownerEmail: ["No account found."] },
        };
      }
      ownerId = owner.id;
    }

    const supabase = await createClient();
    const { error } = await supabase.from("incident_actions").insert({
      organisation_id: input.organisationId,
      incident_id: data.incidentId,
      action: data.action,
      owner_id: ownerId,
      due_on: data.dueOn,
      notes: data.notes || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.incident.action_saved",
      entityType: "incident_action",
      entityId: data.incidentId,
    });
    revalidatePath(`/dashboard/care-homes/incidents/${data.incidentId}`);
    return { ok: true, message: "Corrective action added." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Inventory, suppliers and expenses -------------------------------------------

export async function saveInventoryItemAction(input: {
  organisationId: string;
  facilityId: string;
  itemId?: string;
  sku: string;
  name: string;
  category?: string;
  unit: string;
  reorderLevel: number;
  openingQuantity?: number;
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "inventory_manage",
    );
    assertCareFacility(workspace, input.facilityId);
    const parsed = inventoryItemSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const payload = {
      organisation_id: input.organisationId,
      facility_id: data.facilityId,
      sku: data.sku,
      name: data.name,
      category: data.category || null,
      unit: data.unit,
      reorder_level: data.reorderLevel,
      created_by: user.id,
    };

    let itemId = data.itemId;
    if (itemId) {
      const { error } = await supabase
        .from("inventory_items")
        .update(payload)
        .eq("id", itemId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("inventory_items")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      itemId = inserted.id;
    }

    if (data.openingQuantity && data.openingQuantity > 0) {
      const { error } = await supabase.from("inventory_movements").insert({
        organisation_id: input.organisationId,
        item_id: itemId,
        movement_type: "opening",
        quantity_delta: data.openingQuantity,
        reason: "Opening balance",
        recorded_by: user.id,
      });
      if (error) {
        return { ok: false, message: friendlyDbMessage(error.message) };
      }
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.inventory.item_saved",
      entityType: "inventory_item",
      entityId: itemId,
      metadata: { sku: data.sku },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Inventory item saved.", id: itemId };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordInventoryMovementAction(input: {
  organisationId: string;
  itemId: string;
  movementType: string;
  quantity: number;
  reason?: string;
  reference?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "inventory_manage");
    const parsed = inventoryMovementSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const delta =
      data.movementType === "issue" || data.movementType === "wastage"
        ? -Math.abs(data.quantity)
        : data.movementType === "adjustment"
          ? data.quantity
          : Math.abs(data.quantity);

    const supabase = await createClient();
    const { error } = await supabase.from("inventory_movements").insert({
      organisation_id: input.organisationId,
      item_id: data.itemId,
      movement_type: data.movementType as
        | "opening"
        | "purchase"
        | "issue"
        | "adjustment"
        | "wastage"
        | "return",
      quantity_delta: delta,
      reason: data.reason || null,
      reference: data.reference || null,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.inventory.movement_recorded",
      entityType: "inventory_movement",
      entityId: data.itemId,
      metadata: { type: data.movementType, delta },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Stock movement recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function saveSupplierAction(input: {
  organisationId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "inventory_manage");
    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").insert({
      organisation_id: input.organisationId,
      name: data.name,
      contact_name: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      created_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.supplier.saved",
      entityType: "supplier",
      entityId: input.organisationId,
      metadata: { name: data.name },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Supplier saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordExpenseAction(input: {
  organisationId: string;
  facilityId: string;
  category: string;
  description?: string;
  amount: string;
  incurredOn: string;
  paymentStatus: string;
  paymentMethod?: string;
  receiptReference?: string;
  supplierId?: string;
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "expense_manage",
    );
    assertCareFacility(workspace, input.facilityId);
    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("expense_records").insert({
      organisation_id: input.organisationId,
      facility_id: data.facilityId,
      category: data.category,
      description: data.description || null,
      amount_minor_units: amount,
      incurred_on: data.incurredOn,
      payment_status: data.paymentStatus as
        | "unpaid"
        | "paid"
        | "reimbursed"
        | "void",
      payment_method: data.paymentMethod || null,
      receipt_reference: data.receiptReference || null,
      supplier_id: data.supplierId || null,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.expense.saved",
      entityType: "expense_record",
      entityId: input.organisationId,
      metadata: { category: data.category, amount },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Expense recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function createPurchaseRequestAction(input: {
  organisationId: string;
  facilityId: string;
  neededBy?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    estimatedUnitCost: string;
    inventoryItemId?: string;
  }[];
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "expense_manage",
    );
    assertCareFacility(workspace, input.facilityId);
    const parsed = purchaseRequestSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const items = data.items.map((item) => ({
      ...item,
      estimatedUnitCostMinorUnits: parseMoney(item.estimatedUnitCost),
    }));
    if (items.some((item) => item.estimatedUnitCostMinorUnits === null)) {
      return { ok: false, message: "Enter a valid estimate for every item." };
    }

    const supabase = await createClient();
    const { data: request, error } = await supabase
      .from("purchase_requests")
      .insert({
        organisation_id: input.organisationId,
        facility_id: data.facilityId,
        requested_by: user.id,
        status: "submitted",
        needed_by: data.neededBy,
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (error || !request) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    const { error: itemError } = await supabase
      .from("purchase_request_items")
      .insert(
        items.map((item) => ({
          organisation_id: input.organisationId,
          request_id: request.id,
          inventory_item_id: item.inventoryItemId || null,
          description: item.description,
          quantity: item.quantity,
          estimated_unit_cost_minor_units: item.estimatedUnitCostMinorUnits ?? 0,
        })),
      );
    if (itemError) {
      return { ok: false, message: friendlyDbMessage(itemError.message) };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.purchase_request.saved",
      entityType: "purchase_request",
      entityId: request.id,
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: "Purchase request submitted.", id: request.id };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewPurchaseRequestAction(input: {
  organisationId: string;
  requestId: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "expense_approve");
    const parsed = purchaseRequestDecisionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("purchase_requests")
      .update({
        status: data.decision,
        rejection_reason: data.decision === "rejected" ? data.reason || "Rejected" : null,
      })
      .eq("id", data.requestId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.purchase_request.reviewed",
      entityType: "purchase_request",
      entityId: data.requestId,
      metadata: { decision: data.decision },
    });
    revalidateCare(input.organisationId);
    return { ok: true, message: `Purchase request ${data.decision}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

// Billing ----------------------------------------------------------------------

export async function createInvoiceAction(input: {
  organisationId: string;
  facilityId: string;
  residentId?: string;
  payerName: string;
  payerContact?: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: { description: string; quantity: number; unitPrice: string }[];
}): Promise<CareActionResult> {
  try {
    const { user, workspace } = await requireAction(
      input.organisationId,
      "invoice_manage",
    );
    assertCareFacility(workspace, input.facilityId);
    const parsed = invoiceSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    if (data.dueDate < data.issueDate) {
      return {
        ok: false,
        message: "The due date must be on or after the issue date.",
        fieldErrors: { dueDate: ["The due date must be on or after the issue date."] },
      };
    }

    const items = data.items.map((item) => ({
      ...item,
      unitPriceMinorUnits: parseMoney(item.unitPrice),
    }));
    if (items.some((item) => item.unitPriceMinorUnits === null)) {
      return { ok: false, message: "Enter a valid unit price for every line." };
    }

    const supabase = await createClient();
    const { data: invoice, error } = await supabase
      .from("service_invoices")
      .insert({
        organisation_id: input.organisationId,
        facility_id: data.facilityId,
        resident_id: data.residentId || null,
        payer_name: data.payerName,
        payer_contact: data.payerContact || null,
        invoice_number: "",
        issue_date: data.issueDate,
        due_date: data.dueDate,
        notes: data.notes || null,
        created_by: user.id,
      })
      .select("id, invoice_number")
      .single();
    if (error || !invoice) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    const { error: itemError } = await supabase
      .from("service_invoice_items")
      .insert(
        items.map((item) => ({
          organisation_id: input.organisationId,
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price_minor_units: item.unitPriceMinorUnits ?? 0,
        })),
      );
    if (itemError) return { ok: false, message: friendlyDbMessage(itemError.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.invoice.created",
      entityType: "service_invoice",
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoice_number },
    });
    revalidateCare(input.organisationId);
    return {
      ok: true,
      message: `Invoice ${invoice.invoice_number} created as a draft.`,
      id: invoice.id,
      redirectTo: `/dashboard/care-homes/invoices/${invoice.id}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function issueInvoiceAction(input: {
  organisationId: string;
  invoiceId: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "invoice_manage");
    const parsed = invoiceIssueSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);

    const supabase = await createClient();
    const { data: invoice } = await supabase
      .from("service_invoices")
      .select("total_minor_units")
      .eq("id", parsed.data.invoiceId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!invoice || Number(invoice.total_minor_units) <= 0) {
      return { ok: false, message: "Add at least one line item before issuing." };
    }

    const { error } = await supabase
      .from("service_invoices")
      .update({ status: "issued" })
      .eq("id", parsed.data.invoiceId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.invoice.issued",
      entityType: "service_invoice",
      entityId: parsed.data.invoiceId,
    });
    revalidatePath("/dashboard/care-homes/invoices");
    revalidatePath(`/dashboard/care-homes/invoices/${parsed.data.invoiceId}`);
    return { ok: true, message: "Invoice issued." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordInvoicePaymentAction(input: {
  organisationId: string;
  invoiceId: string;
  amount: string;
  paidAt: string;
  method: string;
  reference?: string;
  receiptReference?: string;
  notes?: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "invoice_manage");
    const parsed = servicePaymentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("service_payments").insert({
      organisation_id: input.organisationId,
      invoice_id: data.invoiceId,
      amount_minor_units: amount,
      paid_at: iso(data.paidAt),
      method: data.method as
        | "cash"
        | "bank_transfer"
        | "card"
        | "cheque"
        | "other",
      reference: data.reference || null,
      receipt_reference: data.receiptReference || null,
      notes: data.notes || null,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.invoice.payment_recorded",
      entityType: "service_payment",
      entityId: data.invoiceId,
      metadata: { amount },
    });
    revalidatePath("/dashboard/care-homes/invoices");
    revalidatePath(`/dashboard/care-homes/invoices/${data.invoiceId}`);
    return { ok: true, message: "Payment recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordInvoiceRefundAction(input: {
  organisationId: string;
  paymentId: string;
  amount: string;
  reason: string;
}): Promise<CareActionResult> {
  try {
    const { user } = await requireAction(input.organisationId, "invoice_manage");
    const parsed = serviceRefundSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }

    const supabase = await createClient();
    const { data: payment } = await supabase
      .from("service_payments")
      .select("invoice_id, organisation_id")
      .eq("id", data.paymentId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!payment) {
      return { ok: false, message: "Payment not found." };
    }

    const { error } = await supabase.from("service_refunds").insert({
      organisation_id: input.organisationId,
      payment_id: data.paymentId,
      invoice_id: payment.invoice_id,
      amount_minor_units: amount,
      reason: data.reason,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "care.invoice.refund_recorded",
      entityType: "service_refund",
      entityId: data.paymentId,
      metadata: { amount },
    });
    revalidatePath("/dashboard/care-homes/invoices");
    return { ok: true, message: "Refund recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}
