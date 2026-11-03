import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CareWorkspace } from "@/server/care/access";
import type {
  CarePlanStatus,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  InventoryMovementType,
  MedicationStatus,
  ResidentStatus,
  ServiceInvoiceStatus,
  ShiftStatus,
} from "@/types/database";

export type ResidentListItem = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  roomNumber: string | null;
  status: ResidentStatus;
  admissionDate: string;
  careLevel: string | null;
  facilityId: string;
  facilityName: string | null;
};

export type CareDashboard = {
  residentCount: number;
  activeResidents: number;
  onLeaveResidents: number;
  activeStaff: number;
  shiftsToday: number;
  coverageGaps: number;
  openIncidents: number;
  highSeverityIncidents: number;
  lowStock: {
    itemId: string;
    name: string;
    unit: string;
    currentQuantity: number;
    reorderLevel: number;
  }[];
  outstandingInvoices: {
    invoiceId: string;
    invoiceNumber: string;
    payerName: string;
    outstandingMinorUnits: number;
    daysOverdue: number;
    status: ServiceInvoiceStatus;
  }[];
  outstandingMinorUnits: number;
  expiringCompliance: number;
  occupancy: {
    facilityId: string;
    facilityName: string;
    activeResidents: number;
    capacity: number | null;
    occupancyPercent: number | null;
  }[];
  upcomingShifts: {
    id: string;
    title: string | null;
    startsAt: string;
    endsAt: string;
    requiredStaff: number;
    assignedStaff: number;
    status: ShiftStatus;
  }[];
  recentIncidents: {
    id: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    status: IncidentStatus;
    occurredAt: string;
    residentName: string | null;
  }[];
};

function startOfToday(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function endOfToday(): string {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function residentName(first: string | null, last: string | null): string | null {
  if (!first && !last) return null;
  return [first, last].filter(Boolean).join(" ");
}

export async function getCareDashboard(
  workspace: CareWorkspace,
  facilityId?: string | null,
): Promise<CareDashboard> {
  const supabase = await createClient();
  const organisationId = workspace.organisationId;

  let residentsQuery = supabase
    .from("residents")
    .select("id, status, facility_id")
    .eq("organisation_id", organisationId);
  if (facilityId) residentsQuery = residentsQuery.eq("facility_id", facilityId);

  const [
    residentsResult,
    staffResult,
    shiftsResult,
    coverageResult,
    incidentsResult,
    stockResult,
    invoicesResult,
    complianceResult,
    occupancyResult,
  ] = await Promise.all([
    residentsQuery,
    supabase
      .from("care_staff_profiles")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .eq("employment_status", "active"),
    supabase
      .from("shift_schedules")
      .select("id, title, starts_at, ends_at, required_staff, status")
      .eq("organisation_id", organisationId)
      .gte("starts_at", startOfToday())
      .lt("starts_at", endOfToday())
      .neq("status", "cancelled")
      .order("starts_at"),
    supabase
      .from("care_staffing_coverage")
      .select("shift_id, coverage_gap, required_staff, assigned_staff, starts_at, status")
      .eq("organisation_id", organisationId)
      .gte("starts_at", startOfToday())
      .lt("starts_at", endOfToday())
      .neq("status", "cancelled"),
    supabase
      .from("incidents")
      .select("id, category, severity, status, occurred_at, resident_id")
      .eq("organisation_id", organisationId)
      .neq("status", "closed")
      .order("occurred_at", { ascending: false })
      .limit(20),
    supabase
      .from("care_inventory_status")
      .select("item_id, name, unit, current_quantity, reorder_level, below_reorder")
      .eq("organisation_id", organisationId)
      .eq("below_reorder", true)
      .order("name")
      .limit(10),
    supabase
      .from("care_invoice_ageing")
      .select(
        "invoice_id, invoice_number, payer_name, outstanding_minor_units, days_overdue, status",
      )
      .eq("organisation_id", organisationId)
      .gt("outstanding_minor_units", 0)
      .order("days_overdue", { ascending: false })
      .limit(10),
    supabase
      .from("care_training_compliance")
      .select(
        "staff_id, expired_training, expired_qualifications, unverified_qualifications, expired_documents",
      )
      .eq("organisation_id", organisationId),
    supabase
      .from("care_occupancy")
      .select(
        "facility_id, facility_name, active_residents, capacity, occupancy_percent",
      )
      .eq("organisation_id", organisationId),
  ]);

  const residents = residentsResult.data ?? [];
  const shifts = shiftsResult.data ?? [];
  const coverage = coverageResult.data ?? [];
  const incidents = incidentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const compliance = complianceResult.data ?? [];

  const residentIds = Array.from(
    new Set(incidents.map((incident) => incident.resident_id).filter(Boolean)),
  ) as string[];
  const residentNames = new Map<string, string | null>();
  if (residentIds.length > 0) {
    const { data } = await supabase
      .from("residents")
      .select("id, first_name, last_name")
      .in("id", residentIds);
    for (const row of data ?? []) {
      residentNames.set(row.id, residentName(row.first_name, row.last_name));
    }
  }

  const assignmentCounts = new Map(
    coverage.map((row) => [row.shift_id, Number(row.assigned_staff ?? 0)]),
  );

  return {
    residentCount: residents.length,
    activeResidents: residents.filter((row) => row.status === "active").length,
    onLeaveResidents: residents.filter((row) => row.status === "on_leave").length,
    activeStaff: staffResult.count ?? 0,
    shiftsToday: shifts.length,
    coverageGaps: coverage.reduce(
      (total, row) => total + Number(row.coverage_gap ?? 0),
      0,
    ),
    openIncidents: incidents.length,
    highSeverityIncidents: incidents.filter(
      (row) => row.severity === "high" || row.severity === "critical",
    ).length,
    lowStock: (stockResult.data ?? []).map((row) => ({
      itemId: row.item_id ?? "",
      name: row.name ?? "Unnamed item",
      unit: row.unit ?? "unit",
      currentQuantity: Number(row.current_quantity ?? 0),
      reorderLevel: Number(row.reorder_level ?? 0),
    })),
    outstandingInvoices: invoices.map((row) => ({
      invoiceId: row.invoice_id ?? "",
      invoiceNumber: row.invoice_number ?? "",
      payerName: row.payer_name ?? "",
      outstandingMinorUnits: Number(row.outstanding_minor_units ?? 0),
      daysOverdue: Number(row.days_overdue ?? 0),
      status: row.status as ServiceInvoiceStatus,
    })),
    outstandingMinorUnits: invoices.reduce(
      (total, row) => total + Number(row.outstanding_minor_units ?? 0),
      0,
    ),
    expiringCompliance: compliance.filter(
      (row) =>
        Number(row.expired_training ?? 0) > 0 ||
        Number(row.expired_qualifications ?? 0) > 0 ||
        Number(row.unverified_qualifications ?? 0) > 0 ||
        Number(row.expired_documents ?? 0) > 0,
    ).length,
    occupancy: (occupancyResult.data ?? []).map((row) => ({
      facilityId: row.facility_id ?? "",
      facilityName: row.facility_name ?? "Facility",
      activeResidents: Number(row.active_residents ?? 0),
      capacity: row.capacity,
      occupancyPercent:
        row.occupancy_percent === null ? null : Number(row.occupancy_percent),
    })),
    upcomingShifts: shifts.map((shift) => ({
      id: shift.id,
      title: shift.title,
      startsAt: shift.starts_at,
      endsAt: shift.ends_at,
      requiredStaff: shift.required_staff,
      assignedStaff: assignmentCounts.get(shift.id) ?? 0,
      status: shift.status as ShiftStatus,
    })),
    recentIncidents: incidents.slice(0, 6).map((incident) => ({
      id: incident.id,
      category: incident.category as IncidentCategory,
      severity: incident.severity as IncidentSeverity,
      status: incident.status as IncidentStatus,
      occurredAt: incident.occurred_at,
      residentName: incident.resident_id
        ? residentNames.get(incident.resident_id) ?? null
        : null,
    })),
  };
}

export async function listResidents(
  workspace: CareWorkspace,
  options: {
    facilityId?: string | null;
    status?: ResidentStatus | "all";
    search?: string;
  } = {},
): Promise<ResidentListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("residents")
    .select(
      "id, reference, first_name, last_name, preferred_name, room_number, status, admission_date, care_level, facility_id",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("last_name")
    .limit(200);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);
  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options.search?.trim()) {
    const search = options.search.trim();
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,reference.ilike.%${search}%,room_number.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const facilityNames = new Map(
    workspace.facilities.map((facility) => [facility.id, facility.name]),
  );

  return data.map((row) => ({
    id: row.id,
    reference: row.reference,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    roomNumber: row.room_number,
    status: row.status as ResidentStatus,
    admissionDate: row.admission_date,
    careLevel: row.care_level,
    facilityId: row.facility_id,
    facilityName: facilityNames.get(row.facility_id) ?? null,
  }));
}

export type ResidentRecord = {
  resident: ResidentListItem & {
    dateOfBirth: string | null;
    gender: string | null;
    dischargeDate: string | null;
    mobilityNotes: string | null;
    dietaryNotes: string | null;
    communicationNotes: string | null;
    accessibilityNeeds: string | null;
    careRequirements: string | null;
    medicalNotes: string | null;
  };
  contacts: {
    id: string;
    name: string;
    relationship: string | null;
    phone: string | null;
    email: string | null;
    isEmergency: boolean;
    isAuthorisedRepresentative: boolean;
    priority: number;
  }[];
  relationships: {
    id: string;
    userId: string;
    relationship: string | null;
    accessLevel: string;
    revokedAt: string | null;
  }[];
  consents: {
    id: string;
    consentType: string;
    granted: boolean;
    grantedByName: string | null;
    effectiveFrom: string;
    expiresOn: string | null;
    withdrawnAt: string | null;
    notes: string | null;
  }[];
  carePlans: {
    id: string;
    title: string;
    status: CarePlanStatus;
    accessLevel: string;
    reviewDueOn: string | null;
    approvedAt: string | null;
    versionCount: number;
  }[];
  medication: {
    id: string;
    medicationName: string;
    doseText: string | null;
    route: string | null;
    scheduledAt: string;
    administeredAt: string | null;
    status: MedicationStatus;
  }[];
  recentRecords: {
    id: string;
    status: string;
    completedAt: string | null;
    observations: string | null;
    recordedAt: string;
  }[];
  incidents: {
    id: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    status: IncidentStatus;
    occurredAt: string;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: ServiceInvoiceStatus;
    totalMinorUnits: number;
    amountPaidMinorUnits: number;
    dueDate: string;
  }[];
};

export async function getResidentRecord(
  workspace: CareWorkspace,
  residentId: string,
): Promise<ResidentRecord | null> {
  const supabase = await createClient();
  const { data: resident, error } = await supabase
    .from("residents")
    .select("*")
    .eq("id", residentId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !resident) return null;

  const [contacts, relationships, consents, plans, medication, records, incidents, invoices] =
    await Promise.all([
      supabase
        .from("resident_contacts")
        .select(
          "id, name, relationship, phone, email, is_emergency, is_authorised_representative, priority",
        )
        .eq("resident_id", residentId)
        .order("priority"),
      supabase
        .from("resident_relationships")
        .select("id, user_id, relationship, access_level, revoked_at")
        .eq("resident_id", residentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("resident_consents")
        .select(
          "id, consent_type, granted, granted_by_name, effective_from, expires_on, withdrawn_at, notes",
        )
        .eq("resident_id", residentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("care_plans")
        .select("id, title, status, access_level, review_due_on, approved_at")
        .eq("resident_id", residentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("medication_records")
        .select("id, medication_name, dose_text, route, scheduled_at, administered_at, status")
        .eq("resident_id", residentId)
        .order("scheduled_at", { ascending: false })
        .limit(12),
      supabase
        .from("care_task_records")
        .select("id, status, completed_at, observations, created_at")
        .eq("resident_id", residentId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("incidents")
        .select("id, category, severity, status, occurred_at")
        .eq("resident_id", residentId)
        .order("occurred_at", { ascending: false })
        .limit(8),
      supabase
        .from("service_invoices")
        .select("id, invoice_number, status, total_minor_units, amount_paid_minor_units, due_date")
        .eq("resident_id", residentId)
        .order("issue_date", { ascending: false })
        .limit(8),
    ]);

  const planIds = (plans.data ?? []).map((plan) => plan.id);
  const versionCounts = new Map<string, number>();
  if (planIds.length > 0) {
    const { data } = await supabase
      .from("care_plan_versions")
      .select("plan_id")
      .in("plan_id", planIds);
    for (const row of data ?? []) {
      versionCounts.set(row.plan_id, (versionCounts.get(row.plan_id) ?? 0) + 1);
    }
  }

  const facilityName =
    workspace.facilities.find((facility) => facility.id === resident.facility_id)?.name ??
    null;

  return {
    resident: {
      id: resident.id,
      reference: resident.reference,
      firstName: resident.first_name,
      lastName: resident.last_name,
      preferredName: resident.preferred_name,
      roomNumber: resident.room_number,
      status: resident.status as ResidentStatus,
      admissionDate: resident.admission_date,
      careLevel: resident.care_level,
      facilityId: resident.facility_id,
      facilityName,
      dateOfBirth: resident.date_of_birth,
      gender: resident.gender,
      dischargeDate: resident.discharge_date,
      mobilityNotes: resident.mobility_notes,
      dietaryNotes: resident.dietary_notes,
      communicationNotes: resident.communication_notes,
      accessibilityNeeds: resident.accessibility_needs,
      careRequirements: resident.care_requirements,
      medicalNotes: resident.medical_notes,
    },
    contacts: (contacts.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      relationship: row.relationship,
      phone: row.phone,
      email: row.email,
      isEmergency: row.is_emergency,
      isAuthorisedRepresentative: row.is_authorised_representative,
      priority: row.priority,
    })),
    relationships: (relationships.data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      relationship: row.relationship,
      accessLevel: row.access_level,
      revokedAt: row.revoked_at,
    })),
    consents: (consents.data ?? []).map((row) => ({
      id: row.id,
      consentType: row.consent_type,
      granted: row.granted,
      grantedByName: row.granted_by_name,
      effectiveFrom: row.effective_from,
      expiresOn: row.expires_on,
      withdrawnAt: row.withdrawn_at,
      notes: row.notes,
    })),
    carePlans: (plans.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as CarePlanStatus,
      accessLevel: row.access_level,
      reviewDueOn: row.review_due_on,
      approvedAt: row.approved_at,
      versionCount: versionCounts.get(row.id) ?? 0,
    })),
    medication: (medication.data ?? []).map((row) => ({
      id: row.id,
      medicationName: row.medication_name,
      doseText: row.dose_text,
      route: row.route,
      scheduledAt: row.scheduled_at,
      administeredAt: row.administered_at,
      status: row.status as MedicationStatus,
    })),
    recentRecords: (records.data ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      completedAt: row.completed_at,
      observations: row.observations,
      recordedAt: row.created_at,
    })),
    incidents: (incidents.data ?? []).map((row) => ({
      id: row.id,
      category: row.category as IncidentCategory,
      severity: row.severity as IncidentSeverity,
      status: row.status as IncidentStatus,
      occurredAt: row.occurred_at,
    })),
    invoices: (invoices.data ?? []).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      status: row.status as ServiceInvoiceStatus,
      totalMinorUnits: Number(row.total_minor_units),
      amountPaidMinorUnits: Number(row.amount_paid_minor_units),
      dueDate: row.due_date,
    })),
  };
}

export type StaffListItem = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  jobTitle: string | null;
  employmentStatus: string;
  startDate: string | null;
  endDate: string | null;
  qualifications: number;
  expiringQualifications: number;
  expiredTraining: number;
  expiredDocuments: number;
};

export async function listStaff(
  workspace: CareWorkspace,
): Promise<StaffListItem[]> {
  const supabase = await createClient();
  const { data: staff, error } = await supabase
    .from("care_staff_profiles")
    .select("id, user_id, job_title, employment_status, start_date, end_date")
    .eq("organisation_id", workspace.organisationId)
    .order("created_at");

  if (error || !staff) return [];

  const staffIds = staff.map((row) => row.id);
  const userIds = staff.map((row) => row.user_id);

  const [profiles, qualifications, training, documents] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").in("id", userIds),
    supabase
      .from("staff_qualifications")
      .select("staff_id, expires_on, verification_status")
      .in("staff_id", staffIds),
    supabase
      .from("staff_training_records")
      .select("staff_id, expires_on")
      .in("staff_id", staffIds),
    supabase
      .from("staff_documents")
      .select("staff_id, expires_on")
      .in("staff_id", staffIds),
  ]);

  const profileMap = new Map(
    (profiles.data ?? []).map((row) => [row.id, row]),
  );
  const today = new Date().toISOString().slice(0, 10);

  return staff.map((row) => {
    const profile = profileMap.get(row.user_id);
    const quals = (qualifications.data ?? []).filter(
      (item) => item.staff_id === row.id,
    );
    return {
      id: row.id,
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      jobTitle: row.job_title,
      employmentStatus: row.employment_status,
      startDate: row.start_date,
      endDate: row.end_date,
      qualifications: quals.length,
      expiringQualifications: quals.filter(
        (item) =>
          item.verification_status !== "verified" ||
          (item.expires_on !== null && item.expires_on < today),
      ).length,
      expiredTraining: (training.data ?? []).filter(
        (item) =>
          item.staff_id === row.id &&
          item.expires_on !== null &&
          item.expires_on < today,
      ).length,
      expiredDocuments: (documents.data ?? []).filter(
        (item) =>
          item.staff_id === row.id &&
          item.expires_on !== null &&
          item.expires_on < today,
      ).length,
    };
  });
}

export type StaffOption = {
  userId: string;
  fullName: string | null;
  email: string | null;
  jobTitle: string | null;
};

export async function listStaffOptions(
  workspace: CareWorkspace,
): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("care_staff_profiles")
    .select("user_id, job_title")
    .eq("organisation_id", workspace.organisationId)
    .eq("employment_status", "active");

  if (!data || data.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      data.map((row) => row.user_id),
    );

  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row]));
  return data.map((row) => ({
    userId: row.user_id,
    fullName: profileMap.get(row.user_id)?.full_name ?? null,
    email: profileMap.get(row.user_id)?.email ?? null,
    jobTitle: row.job_title,
  }));
}

export type ShiftListItem = {
  id: string;
  facilityId: string;
  title: string | null;
  startsAt: string;
  endsAt: string;
  requiredStaff: number;
  requiredQualification: string | null;
  status: ShiftStatus;
  notes: string | null;
  assignedStaff: number;
  coverageGap: number;
  assignments: {
    id: string;
    staffUserId: string;
    fullName: string | null;
    status: string;
  }[];
  handover: string | null;
};

export async function listShifts(
  workspace: CareWorkspace,
  options: { facilityId?: string | null; from?: Date; to?: Date } = {},
): Promise<ShiftListItem[]> {
  const supabase = await createClient();
  const from = options.from ?? new Date();
  const to = options.to ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  let query = supabase
    .from("shift_schedules")
    .select(
      "id, facility_id, title, starts_at, ends_at, required_staff, required_qualification, status, notes",
    )
    .eq("organisation_id", workspace.organisationId)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString())
    .order("starts_at")
    .limit(200);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);

  const [{ data: shifts, error }, { data: coverage }, { data: handovers }] =
    await Promise.all([
      query,
      supabase
        .from("care_staffing_coverage")
        .select("shift_id, assigned_staff, coverage_gap")
        .eq("organisation_id", workspace.organisationId)
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString()),
      supabase
        .from("shift_handovers")
        .select("shift_id, summary, submitted_at")
        .eq("organisation_id", workspace.organisationId)
        .order("submitted_at", { ascending: false }),
    ]);

  if (error || !shifts) return [];

  const shiftIds = shifts.map((shift) => shift.id);
  const { data: assignments } = shiftIds.length
    ? await supabase
        .from("shift_assignments")
        .select("id, shift_id, staff_user_id, status")
        .in("shift_id", shiftIds)
    : { data: [] as { id: string; shift_id: string; staff_user_id: string; status: string }[] };

  const userIds = Array.from(
    new Set((assignments ?? []).map((row) => row.staff_user_id)),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const nameMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));
  const coverageMap = new Map(
    (coverage ?? []).map((row) => [row.shift_id, row]),
  );
  const handoverMap = new Map<string, string>();
  for (const row of handovers ?? []) {
    if (!handoverMap.has(row.shift_id)) handoverMap.set(row.shift_id, row.summary);
  }

  return shifts.map((shift) => ({
    id: shift.id,
    facilityId: shift.facility_id,
    title: shift.title,
    startsAt: shift.starts_at,
    endsAt: shift.ends_at,
    requiredStaff: shift.required_staff,
    requiredQualification: shift.required_qualification,
    status: shift.status as ShiftStatus,
    notes: shift.notes,
    assignedStaff: Number(coverageMap.get(shift.id)?.assigned_staff ?? 0),
    coverageGap: Number(coverageMap.get(shift.id)?.coverage_gap ?? 0),
    assignments: (assignments ?? [])
      .filter((row) => row.shift_id === shift.id)
      .map((row) => ({
        id: row.id,
        staffUserId: row.staff_user_id,
        fullName: nameMap.get(row.staff_user_id) ?? null,
        status: row.status,
      })),
    handover: handoverMap.get(shift.id) ?? null,
  }));
}

export type CarePlanListItem = {
  id: string;
  residentId: string;
  residentName: string | null;
  title: string;
  status: CarePlanStatus;
  accessLevel: string;
  reviewDueOn: string | null;
  approvedAt: string | null;
  versionCount: number;
};

export async function listCarePlans(
  workspace: CareWorkspace,
  facilityId?: string | null,
): Promise<CarePlanListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("care_plans")
    .select(
      "id, resident_id, title, status, access_level, review_due_on, approved_at, created_at",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (facilityId) {
    const residentIds = await supabase
      .from("residents")
      .select("id")
      .eq("facility_id", facilityId);
    const ids = (residentIds.data ?? []).map((row) => row.id);
    if (ids.length === 0) return [];
    query = query.in("resident_id", ids);
  }

  const { data: plans, error } = await query;
  if (error || !plans) return [];

  const residentIds = Array.from(new Set(plans.map((row) => row.resident_id)));
  const [{ data: residents }, { data: versions }] = await Promise.all([
    supabase
      .from("residents")
      .select("id, first_name, last_name")
      .in("id", residentIds),
    supabase
      .from("care_plan_versions")
      .select("plan_id")
      .in(
        "plan_id",
        plans.map((row) => row.id),
      ),
  ]);

  const residentMap = new Map(
    (residents ?? []).map((row) => [
      row.id,
      residentName(row.first_name, row.last_name),
    ]),
  );
  const versionCounts = new Map<string, number>();
  for (const row of versions ?? []) {
    versionCounts.set(row.plan_id, (versionCounts.get(row.plan_id) ?? 0) + 1);
  }

  return plans.map((row) => ({
    id: row.id,
    residentId: row.resident_id,
    residentName: residentMap.get(row.resident_id) ?? null,
    title: row.title,
    status: row.status as CarePlanStatus,
    accessLevel: row.access_level,
    reviewDueOn: row.review_due_on,
    approvedAt: row.approved_at,
    versionCount: versionCounts.get(row.id) ?? 0,
  }));
}

export type IncidentListItem = {
  id: string;
  facilityId: string;
  residentId: string | null;
  residentName: string | null;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  isSafeguarding: boolean;
  occurredAt: string;
  description: string;
  assignedReviewer: string | null;
  closedAt: string | null;
  actionCount: number;
};

export async function listIncidents(
  workspace: CareWorkspace,
  options: {
    facilityId?: string | null;
    status?: IncidentStatus | "all";
    severity?: IncidentSeverity | "all";
  } = {},
): Promise<IncidentListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("incidents")
    .select(
      "id, facility_id, resident_id, category, severity, status, is_safeguarding, occurred_at, description, assigned_reviewer, closed_at",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);
  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options.severity && options.severity !== "all") {
    query = query.eq("severity", options.severity);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const residentIds = Array.from(
    new Set(data.map((row) => row.resident_id).filter(Boolean)),
  ) as string[];
  const reviewerIds = Array.from(
    new Set(data.map((row) => row.assigned_reviewer).filter(Boolean)),
  ) as string[];

  const [{ data: residents }, { data: reviewers }, { data: actions }] =
    await Promise.all([
      residentIds.length
        ? supabase
            .from("residents")
            .select("id, first_name, last_name")
            .in("id", residentIds)
        : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
      reviewerIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", reviewerIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      supabase
        .from("incident_actions")
        .select("incident_id")
        .eq("organisation_id", workspace.organisationId),
    ]);

  const residentMap = new Map(
    (residents ?? []).map((row) => [
      row.id,
      residentName(row.first_name, row.last_name),
    ]),
  );
  const reviewerMap = new Map(
    (reviewers ?? []).map((row) => [row.id, row.full_name]),
  );
  const actionCounts = new Map<string, number>();
  for (const row of actions ?? []) {
    actionCounts.set(row.incident_id, (actionCounts.get(row.incident_id) ?? 0) + 1);
  }

  return data.map((row) => ({
    id: row.id,
    facilityId: row.facility_id,
    residentId: row.resident_id,
    residentName: row.resident_id
      ? residentMap.get(row.resident_id) ?? null
      : null,
    category: row.category as IncidentCategory,
    severity: row.severity as IncidentSeverity,
    status: row.status as IncidentStatus,
    isSafeguarding: row.is_safeguarding,
    occurredAt: row.occurred_at,
    description: row.description,
    assignedReviewer: row.assigned_reviewer
      ? reviewerMap.get(row.assigned_reviewer) ?? null
      : null,
    closedAt: row.closed_at,
    actionCount: actionCounts.get(row.id) ?? 0,
  }));
}

export type IncidentDetail = IncidentListItem & {
  immediateAction: string | null;
  closureNotes: string | null;
  externalReference: string | null;
  actions: {
    id: string;
    action: string;
    ownerId: string | null;
    ownerName: string | null;
    dueOn: string | null;
    status: string;
    completedAt: string | null;
    notes: string | null;
  }[];
};

export async function getIncidentDetail(
  workspace: CareWorkspace,
  incidentId: string,
): Promise<IncidentDetail | null> {
  const supabase = await createClient();
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", incidentId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !incident) return null;

  const [{ data: resident }, { data: reviewer }, { data: actions }] =
    await Promise.all([
      incident.resident_id
        ? supabase
            .from("residents")
            .select("first_name, last_name")
            .eq("id", incident.resident_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      incident.assigned_reviewer
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("id", incident.assigned_reviewer)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("incident_actions")
        .select("id, action, owner_id, due_on, status, completed_at, notes")
        .eq("incident_id", incidentId)
        .order("created_at"),
    ]);

  const ownerIds = Array.from(
    new Set((actions ?? []).map((row) => row.owner_id).filter(Boolean)),
  ) as string[];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const ownerMap = new Map((owners ?? []).map((row) => [row.id, row.full_name]));

  return {
    id: incident.id,
    facilityId: incident.facility_id,
    residentId: incident.resident_id,
    residentName: resident
      ? residentName(resident.first_name, resident.last_name)
      : null,
    category: incident.category as IncidentCategory,
    severity: incident.severity as IncidentSeverity,
    status: incident.status as IncidentStatus,
    isSafeguarding: incident.is_safeguarding,
    occurredAt: incident.occurred_at,
    description: incident.description,
    assignedReviewer: reviewer?.full_name ?? null,
    closedAt: incident.closed_at,
    actionCount: (actions ?? []).length,
    immediateAction: incident.immediate_action,
    closureNotes: incident.closure_notes,
    externalReference: incident.external_reference,
    actions: (actions ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      ownerId: row.owner_id,
      ownerName: row.owner_id ? ownerMap.get(row.owner_id) ?? null : null,
      dueOn: row.due_on,
      status: row.status,
      completedAt: row.completed_at,
      notes: row.notes,
    })),
  };
}

// Inventory, purchasing and expenses -------------------------------------------

export type InventoryListItem = {
  itemId: string;
  facilityId: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  reorderLevel: number;
  currentQuantity: number;
  belowReorder: boolean;
};

export async function listInventory(
  workspace: CareWorkspace,
  options: { facilityId?: string | null; search?: string } = {},
): Promise<InventoryListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("care_inventory_status")
    .select(
      "item_id, facility_id, sku, name, category, unit, reorder_level, current_quantity, below_reorder",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("name")
    .limit(300);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);
  if (options.search?.trim()) {
    const search = options.search.trim();
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    itemId: row.item_id ?? "",
    facilityId: row.facility_id ?? "",
    sku: row.sku ?? "",
    name: row.name ?? "",
    category: row.category,
    unit: row.unit ?? "unit",
    reorderLevel: Number(row.reorder_level ?? 0),
    currentQuantity: Number(row.current_quantity ?? 0),
    belowReorder: Boolean(row.below_reorder),
  }));
}

export type InventoryMovementItem = {
  id: string;
  itemId: string;
  itemName: string;
  movementType: InventoryMovementType;
  quantityDelta: number;
  reference: string | null;
  reason: string | null;
  recordedByName: string | null;
  createdAt: string;
};

export async function listInventoryMovements(
  workspace: CareWorkspace,
  itemId?: string,
): Promise<InventoryMovementItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("inventory_movements")
    .select("id, item_id, movement_type, quantity_delta, reference, reason, recorded_by, created_at")
    .eq("organisation_id", workspace.organisationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (itemId) query = query.eq("item_id", itemId);

  const { data, error } = await query;
  if (error || !data) return [];

  const itemIds = Array.from(new Set(data.map((row) => row.item_id)));
  const userIds = Array.from(
    new Set(data.map((row) => row.recorded_by).filter(Boolean)),
  ) as string[];

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase.from("inventory_items").select("id, name").in("id", itemIds),
    userIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const itemMap = new Map((items ?? []).map((row) => [row.id, row.name]));
  const nameMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return data.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemName: itemMap.get(row.item_id) ?? "Unknown item",
    movementType: row.movement_type as InventoryMovementType,
    quantityDelta: Number(row.quantity_delta),
    reference: row.reference,
    reason: row.reason,
    recordedByName: row.recorded_by
      ? nameMap.get(row.recorded_by) ?? null
      : null,
    createdAt: row.created_at,
  }));
}

export type SupplierListItem = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
};

export async function listSuppliers(
  workspace: CareWorkspace,
): Promise<SupplierListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, contact_name, email, phone, status")
    .eq("organisation_id", workspace.organisationId)
    .order("name");

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
  }));
}

export type ExpenseListItem = {
  id: string;
  category: string;
  description: string | null;
  amountMinorUnits: number;
  currency: string;
  incurredOn: string;
  paymentStatus: string;
  paymentMethod: string | null;
  receiptReference: string | null;
  supplierName: string | null;
};

export async function listExpenses(
  workspace: CareWorkspace,
  facilityId?: string | null,
): Promise<ExpenseListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("expense_records")
    .select(
      "id, category, description, amount_minor_units, currency, incurred_on, payment_status, payment_method, receipt_reference, supplier_id",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("incurred_on", { ascending: false })
    .limit(200);

  if (facilityId) query = query.eq("facility_id", facilityId);

  const { data, error } = await query;
  if (error || !data) return [];

  const supplierIds = Array.from(
    new Set(data.map((row) => row.supplier_id).filter(Boolean)),
  ) as string[];
  const { data: suppliers } = supplierIds.length
    ? await supabase.from("suppliers").select("id, name").in("id", supplierIds)
    : { data: [] as { id: string; name: string }[] };
  const supplierMap = new Map((suppliers ?? []).map((row) => [row.id, row.name]));

  return data.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    amountMinorUnits: Number(row.amount_minor_units),
    currency: row.currency,
    incurredOn: row.incurred_on,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    receiptReference: row.receipt_reference,
    supplierName: row.supplier_id
      ? supplierMap.get(row.supplier_id) ?? null
      : null,
  }));
}

// Billing ----------------------------------------------------------------------

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  facilityId: string;
  residentId: string | null;
  residentName: string | null;
  payerName: string;
  issueDate: string;
  dueDate: string;
  status: ServiceInvoiceStatus;
  totalMinorUnits: number;
  amountPaidMinorUnits: number;
  outstandingMinorUnits: number;
};

export async function listInvoices(
  workspace: CareWorkspace,
  options: { facilityId?: string | null; status?: ServiceInvoiceStatus | "all" } = {},
): Promise<InvoiceListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("service_invoices")
    .select(
      "id, invoice_number, facility_id, resident_id, payer_name, issue_date, due_date, status, total_minor_units, amount_paid_minor_units",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("issue_date", { ascending: false })
    .limit(200);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);
  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const residentIds = Array.from(
    new Set(data.map((row) => row.resident_id).filter(Boolean)),
  ) as string[];
  const { data: residents } = residentIds.length
    ? await supabase
        .from("residents")
        .select("id, first_name, last_name")
        .in("id", residentIds)
    : { data: [] as { id: string; first_name: string; last_name: string }[] };
  const residentMap = new Map(
    (residents ?? []).map((row) => [
      row.id,
      residentName(row.first_name, row.last_name),
    ]),
  );

  return data.map((row) => {
    const total = Number(row.total_minor_units);
    const paid = Number(row.amount_paid_minor_units);
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      facilityId: row.facility_id,
      residentId: row.resident_id,
      residentName: row.resident_id
        ? residentMap.get(row.resident_id) ?? null
        : null,
      payerName: row.payer_name,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: row.status as ServiceInvoiceStatus,
      totalMinorUnits: total,
      amountPaidMinorUnits: paid,
      outstandingMinorUnits: Math.max(total - paid, 0),
    };
  });
}

export type InvoiceDetail = InvoiceListItem & {
  payerContact: string | null;
  notes: string | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPriceMinorUnits: number;
    lineTotalMinorUnits: number;
  }[];
  payments: {
    id: string;
    amountMinorUnits: number;
    paidAt: string;
    method: string;
    reference: string | null;
    receiptReference: string | null;
  }[];
  refunds: {
    id: string;
    paymentId: string;
    amountMinorUnits: number;
    reason: string;
    refundedAt: string;
  }[];
  paidMinorUnits: number;
  refundedMinorUnits: number;
};

export async function getInvoiceDetail(
  workspace: CareWorkspace,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("service_invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !invoice) return null;

  const [{ data: items }, { data: payments }, { data: refunds }] =
    await Promise.all([
      supabase
        .from("service_invoice_items")
        .select("id, description, quantity, unit_price_minor_units, line_total_minor_units")
        .eq("invoice_id", invoiceId)
        .order("created_at"),
      supabase
        .from("service_payments")
        .select("id, amount_minor_units, paid_at, method, reference, receipt_reference")
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: false }),
      supabase
        .from("service_refunds")
        .select("id, payment_id, amount_minor_units, reason, refunded_at")
        .eq("invoice_id", invoiceId)
        .order("refunded_at", { ascending: false }),
    ]);

  const { data: resident } = invoice.resident_id
    ? await supabase
        .from("residents")
        .select("first_name, last_name")
        .eq("id", invoice.resident_id)
        .maybeSingle()
    : { data: null };

  const total = Number(invoice.total_minor_units);
  const paid = Number(invoice.amount_paid_minor_units);
  const refunded = (refunds ?? []).reduce(
    (sum, row) => sum + Number(row.amount_minor_units),
    0,
  );

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    facilityId: invoice.facility_id,
    residentId: invoice.resident_id,
    residentName: resident
      ? residentName(resident.first_name, resident.last_name)
      : null,
    payerName: invoice.payer_name,
    payerContact: invoice.payer_contact,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status as ServiceInvoiceStatus,
    totalMinorUnits: total,
    amountPaidMinorUnits: paid,
    outstandingMinorUnits: Math.max(total - paid, 0),
    notes: invoice.notes,
    items: (items ?? []).map((row) => ({
      id: row.id,
      description: row.description,
      quantity: Number(row.quantity),
      unitPriceMinorUnits: Number(row.unit_price_minor_units),
      lineTotalMinorUnits: Number(row.line_total_minor_units),
    })),
    payments: (payments ?? []).map((row) => ({
      id: row.id,
      amountMinorUnits: Number(row.amount_minor_units),
      paidAt: row.paid_at,
      method: row.method,
      reference: row.reference,
      receiptReference: row.receipt_reference,
    })),
    refunds: (refunds ?? []).map((row) => ({
      id: row.id,
      paymentId: row.payment_id,
      amountMinorUnits: Number(row.amount_minor_units),
      reason: row.reason,
      refundedAt: row.refunded_at,
    })),
    paidMinorUnits: paid,
    refundedMinorUnits: refunded,
  };
}

// Daily care records -----------------------------------------------------------

export type CareRecordListItem = {
  id: string;
  residentId: string;
  residentName: string | null;
  taskTitle: string | null;
  status: string;
  completedAt: string | null;
  observations: string | null;
  recordedByName: string | null;
  reviewOutcome: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
};

export async function listCareRecords(
  workspace: CareWorkspace,
  options: { facilityId?: string | null; date?: string } = {},
): Promise<CareRecordListItem[]> {
  const supabase = await createClient();
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);

  let query = supabase
    .from("care_task_records")
    .select(
      "id, resident_id, task_id, status, completed_at, observations, recorded_by, review_outcome, reviewed_at, review_notes",
    )
    .eq("organisation_id", workspace.organisationId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (options.facilityId) {
    const residents = await supabase
      .from("residents")
      .select("id")
      .eq("facility_id", options.facilityId);
    const ids = (residents.data ?? []).map((row) => row.id);
    if (ids.length === 0) return [];
    query = query.in("resident_id", ids);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const residentIds = Array.from(new Set(data.map((row) => row.resident_id)));
  const taskIds = Array.from(
    new Set(data.map((row) => row.task_id).filter(Boolean)),
  ) as string[];
  const userIds = Array.from(
    new Set(data.map((row) => row.recorded_by).filter(Boolean)),
  ) as string[];

  const [{ data: residents }, { data: tasks }, { data: profiles }] =
    await Promise.all([
      supabase.from("residents").select("id, first_name, last_name").in("id", residentIds),
      taskIds.length
        ? supabase.from("care_tasks").select("id, title").in("id", taskIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      userIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    ]);

  const residentMap = new Map(
    (residents ?? []).map((row) => [
      row.id,
      residentName(row.first_name, row.last_name),
    ]),
  );
  const taskMap = new Map((tasks ?? []).map((row) => [row.id, row.title]));
  const nameMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return data.map((row) => ({
    id: row.id,
    residentId: row.resident_id,
    residentName: residentMap.get(row.resident_id) ?? null,
    taskTitle: row.task_id ? taskMap.get(row.task_id) ?? null : null,
    status: row.status,
    completedAt: row.completed_at,
    observations: row.observations,
    recordedByName: row.recorded_by ? nameMap.get(row.recorded_by) ?? null : null,
    reviewOutcome: row.review_outcome,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
  }));
}

// Medication -------------------------------------------------------------------

export type MedicationListItem = {
  id: string;
  residentId: string;
  residentName: string | null;
  medicationName: string;
  doseText: string | null;
  route: string | null;
  scheduledAt: string;
  administeredAt: string | null;
  status: MedicationStatus;
  notes: string | null;
};

export async function listMedication(
  workspace: CareWorkspace,
  options: { facilityId?: string | null; residentId?: string } = {},
): Promise<MedicationListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("medication_records")
    .select(
      "id, resident_id, medication_name, dose_text, route, scheduled_at, administered_at, status, notes",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("scheduled_at", { ascending: false })
    .limit(200);

  if (options.facilityId) query = query.eq("facility_id", options.facilityId);
  if (options.residentId) query = query.eq("resident_id", options.residentId);

  const { data, error } = await query;
  if (error || !data) return [];

  const residentIds = Array.from(new Set(data.map((row) => row.resident_id)));
  const { data: residents } = await supabase
    .from("residents")
    .select("id, first_name, last_name")
    .in("id", residentIds);
  const residentMap = new Map(
    (residents ?? []).map((row) => [
      row.id,
      residentName(row.first_name, row.last_name),
    ]),
  );

  return data.map((row) => ({
    id: row.id,
    residentId: row.resident_id,
    residentName: residentMap.get(row.resident_id) ?? null,
    medicationName: row.medication_name,
    doseText: row.dose_text,
    route: row.route,
    scheduledAt: row.scheduled_at,
    administeredAt: row.administered_at,
    status: row.status as MedicationStatus,
    notes: row.notes,
  }));
}

// Shared form data -------------------------------------------------------------

export type ResidentOption = {
  id: string;
  name: string;
  reference: string;
  facilityId: string;
};

export async function listResidentOptions(
  workspace: CareWorkspace,
  facilityId?: string | null,
): Promise<ResidentOption[]> {
  const supabase = await createClient();
  let query = supabase
    .from("residents")
    .select("id, first_name, last_name, reference, facility_id")
    .eq("organisation_id", workspace.organisationId)
    .in("status", ["active", "on_leave"])
    .order("last_name")
    .limit(300);
  if (facilityId) query = query.eq("facility_id", facilityId);

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: residentName(row.first_name, row.last_name) ?? row.reference,
    reference: row.reference,
    facilityId: row.facility_id,
  }));
}

export type CarePlanDetail = {
  plan: {
    id: string;
    residentId: string;
    residentName: string | null;
    title: string;
    summary: string | null;
    status: CarePlanStatus;
    accessLevel: string;
    reviewDueOn: string | null;
    approvedAt: string | null;
  };
  versions: {
    id: string;
    versionNumber: number;
    content: Record<string, unknown>;
    changeSummary: string | null;
    createdAt: string;
    approvedAt: string | null;
  }[];
  assignments: {
    id: string;
    staffUserId: string;
    staffName: string | null;
    responsibility: string;
    dueOn: string | null;
    completedAt: string | null;
  }[];
};

export async function getCarePlanDetail(
  workspace: CareWorkspace,
  planId: string,
): Promise<CarePlanDetail | null> {
  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("care_plans")
    .select("*")
    .eq("id", planId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !plan) return null;

  const [{ data: resident }, { data: versions }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("residents")
        .select("first_name, last_name")
        .eq("id", plan.resident_id)
        .maybeSingle(),
      supabase
        .from("care_plan_versions")
        .select("id, version_number, content, change_summary, created_at, approved_at")
        .eq("plan_id", planId)
        .order("version_number", { ascending: false }),
      supabase
        .from("care_plan_assignments")
        .select("id, staff_user_id, responsibility, due_on, completed_at")
        .eq("plan_id", planId)
        .order("created_at"),
    ]);

  const userIds = Array.from(
    new Set((assignments ?? []).map((row) => row.staff_user_id)),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return {
    plan: {
      id: plan.id,
      residentId: plan.resident_id,
      residentName: resident
        ? residentName(resident.first_name, resident.last_name)
        : null,
      title: plan.title,
      summary: plan.summary,
      status: plan.status as CarePlanStatus,
      accessLevel: plan.access_level,
      reviewDueOn: plan.review_due_on,
      approvedAt: plan.approved_at,
    },
    versions: (versions ?? []).map((row) => ({
      id: row.id,
      versionNumber: row.version_number,
      content: (row.content ?? {}) as Record<string, unknown>,
      changeSummary: row.change_summary,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
    })),
    assignments: (assignments ?? []).map((row) => ({
      id: row.id,
      staffUserId: row.staff_user_id,
      staffName: nameMap.get(row.staff_user_id) ?? null,
      responsibility: row.responsibility,
      dueOn: row.due_on,
      completedAt: row.completed_at,
    })),
  };
}

export type CareReports = {
  occupancy: {
    facilityId: string;
    facilityName: string;
    capacity: number | null;
    activeResidents: number;
    occupancyPercent: number | null;
  }[];
  staffing: {
    shiftId: string;
    startsAt: string;
    endsAt: string;
    requiredStaff: number;
    assignedStaff: number;
    coverageGap: number;
    status: string;
  }[];
  compliance: {
    staffId: string;
    userId: string;
    staffName: string | null;
    expiredTraining: number;
    expiredQualifications: number;
    unverifiedQualifications: number;
    expiredDocuments: number;
  }[];
  incidents: {
    facilityId: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    status: IncidentStatus;
    incidentCount: number;
    safeguardingCount: number;
  }[];
  inventory: {
    itemId: string;
    name: string;
    unit: string;
    currentQuantity: number;
    reorderLevel: number;
    belowReorder: boolean;
  }[];
  expenses: {
    month: string;
    category: string;
    expenseCount: number;
    totalMinorUnits: number;
  }[];
  ageing: {
    invoiceId: string;
    invoiceNumber: string;
    payerName: string;
    status: ServiceInvoiceStatus;
    totalMinorUnits: number;
    outstandingMinorUnits: number;
    daysOverdue: number;
  }[];
};

export async function getCareReports(
  workspace: CareWorkspace,
  facilityId?: string | null,
): Promise<CareReports> {
  const supabase = await createClient();
  const organisationId = workspace.organisationId;

  const applyFacility = <T extends { eq: (column: string, value: string) => T }>(
    query: T,
  ): T => (facilityId ? query.eq("facility_id", facilityId) : query);

  const [occupancy, staffing, compliance, incidents, inventory, expenses, ageing] =
    await Promise.all([
      applyFacility(
        supabase
          .from("care_occupancy")
          .select("facility_id, facility_name, capacity, active_residents, occupancy_percent")
          .eq("organisation_id", organisationId),
      ),
      applyFacility(
        supabase
          .from("care_staffing_coverage")
          .select("shift_id, starts_at, ends_at, required_staff, assigned_staff, coverage_gap, status")
          .eq("organisation_id", organisationId)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(100),
      ),
      supabase
        .from("care_training_compliance")
        .select(
          "staff_id, user_id, expired_training, expired_qualifications, unverified_qualifications, expired_documents",
        )
        .eq("organisation_id", organisationId),
      applyFacility(
        supabase
          .from("care_incident_summary")
          .select("facility_id, category, severity, status, incident_count, safeguarding_count")
          .eq("organisation_id", organisationId),
      ),
      applyFacility(
        supabase
          .from("care_inventory_status")
          .select("item_id, name, unit, current_quantity, reorder_level, below_reorder")
          .eq("organisation_id", organisationId)
          .order("name"),
      ),
      applyFacility(
        supabase
          .from("care_expense_summary")
          .select("month, category, expense_count, total_minor_units")
          .eq("organisation_id", organisationId)
          .order("month", { ascending: false })
          .limit(60),
      ),
      applyFacility(
        supabase
          .from("care_invoice_ageing")
          .select(
            "invoice_id, invoice_number, payer_name, status, total_minor_units, outstanding_minor_units, days_overdue",
          )
          .eq("organisation_id", organisationId)
          .order("days_overdue", { ascending: false }),
      ),
    ]);

  const staffIds = (compliance.data ?? [])
    .map((row) => row.user_id)
    .filter((id): id is string => Boolean(id));
  const { data: profiles } = staffIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", staffIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameMap = new Map((profiles ?? []).map((row) => [row.id, row.full_name]));

  return {
    occupancy: (occupancy.data ?? []).map((row) => ({
      facilityId: row.facility_id ?? "",
      facilityName: row.facility_name ?? "Facility",
      capacity: row.capacity,
      activeResidents: Number(row.active_residents ?? 0),
      occupancyPercent:
        row.occupancy_percent === null ? null : Number(row.occupancy_percent),
    })),
    staffing: (staffing.data ?? []).map((row) => ({
      shiftId: row.shift_id ?? "",
      startsAt: row.starts_at ?? "",
      endsAt: row.ends_at ?? "",
      requiredStaff: Number(row.required_staff ?? 0),
      assignedStaff: Number(row.assigned_staff ?? 0),
      coverageGap: Number(row.coverage_gap ?? 0),
      status: row.status ?? "draft",
    })),
    compliance: (compliance.data ?? []).map((row) => ({
      staffId: row.staff_id ?? "",
      userId: row.user_id ?? "",
      staffName: row.user_id ? nameMap.get(row.user_id) ?? null : null,
      expiredTraining: Number(row.expired_training ?? 0),
      expiredQualifications: Number(row.expired_qualifications ?? 0),
      unverifiedQualifications: Number(row.unverified_qualifications ?? 0),
      expiredDocuments: Number(row.expired_documents ?? 0),
    })),
    incidents: (incidents.data ?? []).map((row) => ({
      facilityId: row.facility_id ?? "",
      category: row.category as IncidentCategory,
      severity: row.severity as IncidentSeverity,
      status: row.status as IncidentStatus,
      incidentCount: Number(row.incident_count ?? 0),
      safeguardingCount: Number(row.safeguarding_count ?? 0),
    })),
    inventory: (inventory.data ?? []).map((row) => ({
      itemId: row.item_id ?? "",
      name: row.name ?? "",
      unit: row.unit ?? "unit",
      currentQuantity: Number(row.current_quantity ?? 0),
      reorderLevel: Number(row.reorder_level ?? 0),
      belowReorder: Boolean(row.below_reorder),
    })),
    expenses: (expenses.data ?? []).map((row) => ({
      month: row.month ?? "",
      category: row.category ?? "",
      expenseCount: Number(row.expense_count ?? 0),
      totalMinorUnits: Number(row.total_minor_units ?? 0),
    })),
    ageing: (ageing.data ?? []).map((row) => ({
      invoiceId: row.invoice_id ?? "",
      invoiceNumber: row.invoice_number ?? "",
      payerName: row.payer_name ?? "",
      status: row.status as ServiceInvoiceStatus,
      totalMinorUnits: Number(row.total_minor_units ?? 0),
      outstandingMinorUnits: Number(row.outstanding_minor_units ?? 0),
      daysOverdue: Number(row.days_overdue ?? 0),
    })),
  };
}
