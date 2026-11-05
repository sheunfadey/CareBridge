"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CareActionButton,
  CareDialogForm,
  CareForm,
  type CareField,
} from "@/features/care/components/care-form";
import {
  addIncidentActionAction,
  addResidentContactAction,
  assignStaffToShiftAction,
  changeCarePlanStatusAction,
  createInvoiceAction,
  createPurchaseRequestAction,
  issueInvoiceAction,
  linkResidentFamilyAction,
  recordCareAction,
  recordExpenseAction,
  recordInventoryMovementAction,
  recordInvoicePaymentAction,
  recordInvoiceRefundAction,
  recordMedicationStatusAction,
  recordResidentConsentAction,
  removeShiftAssignmentAction,
  reportIncidentAction,
  reviewPurchaseRequestAction,
  reviewCareRecordAction,
  revokeResidentFamilyAction,
  saveCarePlanAction,
  saveCarePlanVersionAction,
  saveCareTaskAction,
  saveFacilityAction,
  saveInventoryItemAction,
  saveResidentAction,
  saveShiftAction,
  saveStaffAction,
  saveStaffAvailabilityAction,
  saveStaffDocumentAction,
  saveStaffQualificationAction,
  saveStaffTrainingAction,
  saveSupplierAction,
  scheduleMedicationAction,
  submitShiftHandoverAction,
  updateIncidentAction,
  updateShiftStatusAction,
} from "@/features/care/actions";
import type { CareActionResult } from "@/features/care/actions";
import { formatMoney } from "@/lib/format";
import {
  CARE_EMPLOYMENT_STATUSES,
  CARE_INCIDENT_CATEGORIES,
  CARE_INCIDENT_SEVERITIES,
  CARE_INCIDENT_STATUSES,
  CARE_PLAN_ACCESS_LEVELS,
  CARE_RECORD_STATUSES,
  CARE_TASK_CATEGORIES,
  EXPENSE_PAYMENT_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  MEDICATION_STATUSES,
  RESIDENT_STATUSES,
  SERVICE_PAYMENT_METHODS,
  careEmploymentStatusLabels,
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
  carePlanAccessLabels,
  careRecordStatusLabels,
  careTaskCategoryLabels,
  expensePaymentStatusLabels,
  inventoryMovementTypeLabels,
  medicationStatusLabels,
  residentStatusLabels,
  servicePaymentMethodLabels,
} from "@/lib/validation/care";
import type { ResidentOption, StaffOption } from "@/server/care/queries";

type Values = Record<string, unknown>;
type InputOf<T> = T extends (input: infer I) => Promise<CareActionResult> ? I : never;

function optionsFrom<K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
  emptyLabel?: string,
): { value: string; label: string }[] {
  return [
    ...(emptyLabel ? [{ value: "", label: emptyLabel }] : []),
    ...keys.map((key) => ({ value: key, label: labels[key] })),
  ];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal(): string {
  return new Date().toISOString().slice(0, 16);
}

function cast<T>(values: Values, extra: Values): InputOf<T> {
  return { ...extra, ...values } as unknown as InputOf<T>;
}

// Facilities -------------------------------------------------------------------

export function FacilityDialogForm({
  organisationId,
  facility,
}: {
  organisationId: string;
  facility?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    capacity: number | null;
  };
}) {
  const fields: CareField[] = [
    { name: "name", label: "Facility name", required: true, defaultValue: facility?.name },
    { name: "capacity", label: "Capacity", type: "number", min: 1, defaultValue: facility?.capacity ?? "" },
    { name: "city", label: "City", defaultValue: facility?.city ?? "" },
    { name: "state", label: "State", defaultValue: facility?.state ?? "" },
    { name: "phone", label: "Phone", defaultValue: facility?.phone ?? "" },
    { name: "email", label: "Email", type: "email", defaultValue: facility?.email ?? "" },
    { name: "address", label: "Address", type: "textarea", defaultValue: facility?.address ?? "" },
  ];

  return (
    <CareDialogForm
      trigger={facility ? "Edit facility" : "Add facility"}
      triggerVariant={facility ? "outline" : "default"}
      title={facility ? "Edit facility" : "Add a care facility"}
      description="Facilities belong to this care workspace. Residents and shifts are recorded against a facility."
      submitLabel="Save facility"
      fields={fields}
      action={(values) =>
        saveFacilityAction(
          cast<typeof saveFacilityAction>(values, {
            organisationId,
            facilityId: facility?.id,
          }),
        )
      }
    />
  );
}

// Residents --------------------------------------------------------------------

export function ResidentDialogForm({
  organisationId,
  facilities,
  resident,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  resident?: {
    id: string;
    facilityId: string;
    reference: string;
    firstName: string;
    lastName: string;
    preferredName: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    roomNumber: string | null;
    admissionDate: string;
    dischargeDate: string | null;
    status: string;
    careLevel: string | null;
    mobilityNotes: string | null;
    dietaryNotes: string | null;
    communicationNotes: string | null;
    accessibilityNeeds: string | null;
    careRequirements: string | null;
    medicalNotes: string | null;
  };
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: resident?.facilityId ?? facilities[0]?.id,
      options: facilities.map((facility) => ({ value: facility.id, label: facility.name })),
    },
    { name: "reference", label: "Internal reference", required: true, defaultValue: resident?.reference },
    { name: "firstName", label: "First name", required: true, defaultValue: resident?.firstName },
    { name: "lastName", label: "Last name", required: true, defaultValue: resident?.lastName },
    { name: "preferredName", label: "Preferred name", defaultValue: resident?.preferredName ?? "" },
    { name: "dateOfBirth", label: "Date of birth", type: "date", defaultValue: resident?.dateOfBirth ?? "" },
    { name: "gender", label: "Gender", defaultValue: resident?.gender ?? "" },
    { name: "roomNumber", label: "Room", defaultValue: resident?.roomNumber ?? "" },
    { name: "admissionDate", label: "Admission date", type: "date", required: true, defaultValue: resident?.admissionDate ?? today() },
    { name: "dischargeDate", label: "Discharge date", type: "date", defaultValue: resident?.dischargeDate ?? "" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: resident?.status ?? "active",
      options: optionsFrom(RESIDENT_STATUSES, residentStatusLabels),
    },
    { name: "careLevel", label: "Care level", defaultValue: resident?.careLevel ?? "" },
    { name: "mobilityNotes", label: "Mobility needs", type: "textarea", defaultValue: resident?.mobilityNotes ?? "" },
    { name: "dietaryNotes", label: "Dietary needs", type: "textarea", defaultValue: resident?.dietaryNotes ?? "" },
    { name: "communicationNotes", label: "Communication needs", type: "textarea", defaultValue: resident?.communicationNotes ?? "" },
    { name: "accessibilityNeeds", label: "Accessibility needs", type: "textarea", defaultValue: resident?.accessibilityNeeds ?? "" },
    { name: "careRequirements", label: "Care requirements", type: "textarea", defaultValue: resident?.careRequirements ?? "" },
    { name: "medicalNotes", label: "Medical notes", type: "textarea", defaultValue: resident?.medicalNotes ?? "", help: "Record observations and professional guidance. CareBridge does not diagnose." },
  ];

  return (
    <CareDialogForm
      trigger={resident ? "Edit resident" : "Add resident"}
      triggerVariant={resident ? "outline" : "default"}
      title={resident ? "Edit resident record" : "Add a resident"}
      description="Only collect information relevant to care delivery. Access is logged and restricted."
      submitLabel="Save resident"
      fields={fields}
      action={(values) =>
        saveResidentAction(
          cast<typeof saveResidentAction>(values, {
            organisationId,
            residentId: resident?.id,
          }),
        )
      }
    />
  );
}

export function ContactDialogForm({ organisationId, residentId }: { organisationId: string; residentId: string }) {
  const fields: CareField[] = [
    { name: "name", label: "Contact name", required: true },
    { name: "relationship", label: "Relationship", placeholder: "Daughter, GP, social worker" },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email", type: "email" },
    { name: "priority", label: "Priority", type: "number", min: 1, defaultValue: 1 },
    { name: "isEmergency", label: "Emergency contact", type: "checkbox" },
    { name: "isAuthorisedRepresentative", label: "Authorised representative", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add contact"
      triggerVariant="outline"
      title="Add a contact"
      description="Emergency contacts and authorised representatives."
      submitLabel="Add contact"
      fields={fields}
      action={(values) =>
        addResidentContactAction(
          cast<typeof addResidentContactAction>(values, { organisationId, residentId }),
        )
      }
    />
  );
}

export function RelationshipDialogForm({ organisationId, residentId }: { organisationId: string; residentId: string }) {
  const fields: CareField[] = [
    { name: "email", label: "Family member account email", type: "email", required: true, help: "They must already have a CareBridge account." },
    { name: "relationship", label: "Relationship" },
    {
      name: "accessLevel",
      label: "Access level",
      type: "select",
      required: true,
      defaultValue: "summary",
      options: [
        { value: "summary", label: "Summary" },
        { value: "full", label: "Full care record" },
      ],
    },
  ];
  return (
    <CareDialogForm
      trigger="Link family member"
      triggerVariant="outline"
      title="Link a family member"
      description="Linking is explicit and can be revoked. Family accounts never see other residents."
      submitLabel="Link account"
      fields={fields}
      action={(values) =>
        linkResidentFamilyAction(
          cast<typeof linkResidentFamilyAction>(values, { organisationId, residentId }),
        )
      }
    />
  );
}

export function RevokeFamilyButton({
  organisationId,
  residentId,
  relationshipId,
}: {
  organisationId: string;
  residentId: string;
  relationshipId: string;
}) {
  return (
    <CareActionButton
      label="Revoke"
      variant="ghost"
      confirm="Revoke this family member's access?"
      extra={{ organisationId, residentId, relationshipId }}
      action={(values) =>
        revokeResidentFamilyAction(cast<typeof revokeResidentFamilyAction>(values, {}))
      }
    />
  );
}

export function ConsentDialogForm({ organisationId, residentId }: { organisationId: string; residentId: string }) {
  const fields: CareField[] = [
    {
      name: "consentType",
      label: "Consent type",
      type: "select",
      required: true,
      options: [
        { value: "care", label: "Care delivery" },
        { value: "medical", label: "Medical information" },
        { value: "data_sharing", label: "Data sharing" },
        { value: "photography", label: "Photography" },
        { value: "research", label: "Research" },
        { value: "other", label: "Other" },
      ],
    },
    { name: "granted", label: "Consent granted", type: "checkbox", defaultValue: true },
    { name: "effectiveFrom", label: "Effective from", type: "date", required: true, defaultValue: today() },
    { name: "expiresOn", label: "Expires on", type: "date" },
    { name: "grantedByName", label: "Granted by" },
    { name: "evidenceReference", label: "Evidence reference" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record consent"
      triggerVariant="outline"
      title="Record consent"
      description="Consent history is append-only. Record a new entry to withdraw or change consent."
      submitLabel="Record consent"
      fields={fields}
      action={(values) =>
        recordResidentConsentAction(
          cast<typeof recordResidentConsentAction>(values, { organisationId, residentId }),
        )
      }
    />
  );
}

// Staff ------------------------------------------------------------------------

export function StaffDialogForm({ organisationId }: { organisationId: string }) {
  const fields: CareField[] = [
    { name: "email", label: "Staff account email", type: "email", required: true, help: "The person must already be a workspace member." },
    { name: "jobTitle", label: "Job title" },
    {
      name: "employmentStatus",
      label: "Employment status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: optionsFrom(CARE_EMPLOYMENT_STATUSES, careEmploymentStatusLabels),
    },
    { name: "startDate", label: "Start date", type: "date", defaultValue: today() },
    { name: "endDate", label: "End date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add staff profile"
      title="Add a care staff profile"
      description="Staff records hold qualifications, training and document expiry dates."
      submitLabel="Save staff profile"
      fields={fields}
      action={(values) =>
        saveStaffAction(cast<typeof saveStaffAction>(values, { organisationId }))
      }
    />
  );
}

export function QualificationDialogForm({ organisationId, staffId }: { organisationId: string; staffId: string }) {
  const fields: CareField[] = [
    { name: "code", label: "Qualification code", required: true, help: "Used to match shift requirements, e.g. DEMENTIA." },
    { name: "name", label: "Qualification name", required: true },
    { name: "awardedOn", label: "Awarded on", type: "date" },
    { name: "expiresOn", label: "Expires on", type: "date" },
    {
      name: "verificationStatus",
      label: "Verification",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { value: "unverified", label: "Unverified" },
        { value: "pending", label: "Pending" },
        { value: "verified", label: "Verified" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    { name: "evidenceReference", label: "Evidence reference" },
  ];
  return (
    <CareDialogForm
      trigger="Add qualification"
      triggerVariant="outline"
      title="Add a qualification"
      submitLabel="Save qualification"
      fields={fields}
      action={(values) =>
        saveStaffQualificationAction(
          cast<typeof saveStaffQualificationAction>(values, { organisationId, staffId }),
        )
      }
    />
  );
}

export function TrainingDialogForm({ organisationId, staffId }: { organisationId: string; staffId: string }) {
  const fields: CareField[] = [
    { name: "title", label: "Training title", required: true },
    { name: "completedOn", label: "Completed on", type: "date", required: true, defaultValue: today() },
    { name: "expiresOn", label: "Expires on", type: "date" },
    { name: "evidenceReference", label: "Evidence reference" },
  ];
  return (
    <CareDialogForm
      trigger="Add training"
      triggerVariant="outline"
      title="Add a training record"
      submitLabel="Save training"
      fields={fields}
      action={(values) =>
        saveStaffTrainingAction(
          cast<typeof saveStaffTrainingAction>(values, { organisationId, staffId }),
        )
      }
    />
  );
}

export function DocumentDialogForm({ organisationId, staffId }: { organisationId: string; staffId: string }) {
  const fields: CareField[] = [
    { name: "documentType", label: "Document type", required: true, placeholder: "DBS, right to work, ID" },
    { name: "expiresOn", label: "Expires on", type: "date" },
    { name: "fileReference", label: "File reference" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add document"
      triggerVariant="outline"
      title="Add a document record"
      submitLabel="Save document"
      fields={fields}
      action={(values) =>
        saveStaffDocumentAction(
          cast<typeof saveStaffDocumentAction>(values, { organisationId, staffId }),
        )
      }
    />
  );
}

export function StaffAvailabilityDialogForm({
  organisationId,
  staffId,
  availability,
}: {
  organisationId: string;
  staffId: string;
  availability: unknown;
}) {
  const dayValue = (day: string) => {
    if (!availability || typeof availability !== "object") return "";
    const value = (availability as Record<string, { start?: string; end?: string }>)[
      day
    ];
    return value?.start && value?.end ? `${value.start}-${value.end}` : "";
  };

  const fields: CareField[] = (
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
  ).map((day) => ({
    name: day,
    label: day.charAt(0).toUpperCase() + day.slice(1),
    placeholder: "08:00-16:00",
    defaultValue: dayValue(day),
    help: "Leave blank if unavailable. Use HH:MM-HH:MM.",
  }));

  return (
    <CareDialogForm
      trigger="Availability"
      triggerVariant="ghost"
      title="Staff availability"
      description="Weekly availability is used when planning shifts. It is advisory; assignments still pass the qualification and overlap guards."
      submitLabel="Save availability"
      fields={fields}
      action={(values) =>
        saveStaffAvailabilityAction(
          cast<typeof saveStaffAvailabilityAction>(values, {
            organisationId,
            staffId,
          }),
        )
      }
    />
  );
}

// Shifts -----------------------------------------------------------------------

export function ShiftDialogForm({
  organisationId,
  facilities,
  defaultFacilityId,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  defaultFacilityId?: string;
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: defaultFacilityId ?? facilities[0]?.id,
      options: facilities.map((facility) => ({ value: facility.id, label: facility.name })),
    },
    { name: "title", label: "Shift title", placeholder: "Day shift, Night shift" },
    { name: "startsAt", label: "Starts", type: "datetime-local", required: true, defaultValue: nowLocal() },
    { name: "endsAt", label: "Ends", type: "datetime-local", required: true },
    { name: "requiredStaff", label: "Required staff", type: "number", min: 1, defaultValue: 1 },
    { name: "requiredQualification", label: "Required qualification code", help: "Assignments are rejected when this qualification is missing or unverified." },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add shift"
      title="Create a shift"
      description="Nothing is auto-assigned. Each assignment is checked for overlap and required qualifications."
      submitLabel="Save shift"
      fields={fields}
      action={(values) =>
        saveShiftAction(cast<typeof saveShiftAction>(values, { organisationId }))
      }
    />
  );
}

export function AssignStaffForm({
  organisationId,
  shiftId,
  staff,
}: {
  organisationId: string;
  shiftId: string;
  staff: StaffOption[];
}) {
  const fields: CareField[] = [
    {
      name: "staffUserId",
      label: "Staff member",
      type: "select",
      required: true,
      options: staff.map((member) => ({
        value: member.userId,
        label: [member.fullName ?? member.email, member.jobTitle]
          .filter(Boolean)
          .join(" · "),
      })),
    },
  ];
  return (
    <CareForm
      columns={1}
      submitLabel="Assign"
      fields={fields}
      action={(values) =>
        assignStaffToShiftAction(
          cast<typeof assignStaffToShiftAction>(values, { organisationId, shiftId }),
        )
      }
    />
  );
}

export function HandoverDialogForm({ organisationId, shiftId }: { organisationId: string; shiftId: string }) {
  const fields: CareField[] = [
    { name: "summary", label: "Shift summary", type: "textarea", required: true },
    { name: "outstandingTasks", label: "Outstanding tasks", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record handover"
      triggerVariant="outline"
      title="Record a shift handover"
      submitLabel="Save handover"
      fields={fields}
      action={(values) =>
        submitShiftHandoverAction(
          cast<typeof submitShiftHandoverAction>(values, { organisationId, shiftId }),
        )
      }
    />
  );
}

export function ShiftStatusButtons({ organisationId, shiftId, status }: { organisationId: string; shiftId: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <CareActionButton
          label="Publish"
          extra={{ organisationId, shiftId, status: "published" }}
          action={(values) => updateShiftStatusAction(cast<typeof updateShiftStatusAction>(values, {}))}
        />
      ) : null}
      {status !== "completed" && status !== "cancelled" ? (
        <CareActionButton
          label="Mark completed"
          extra={{ organisationId, shiftId, status: "completed" }}
          action={(values) => updateShiftStatusAction(cast<typeof updateShiftStatusAction>(values, {}))}
        />
      ) : null}
      {status !== "cancelled" ? (
        <CareActionButton
          label="Cancel"
          variant="ghost"
          confirm="Cancel this shift?"
          extra={{ organisationId, shiftId, status: "cancelled" }}
          action={(values) => updateShiftStatusAction(cast<typeof updateShiftStatusAction>(values, {}))}
        />
      ) : null}
    </div>
  );
}

export function RemoveAssignmentButton({ organisationId, assignmentId }: { organisationId: string; assignmentId: string }) {
  return (
    <CareActionButton
      label="Remove"
      variant="ghost"
      confirm="Remove this assignment?"
      extra={{ organisationId, assignmentId }}
      action={(values) => removeShiftAssignmentAction(cast<typeof removeShiftAssignmentAction>(values, {}))}
    />
  );
}

// Care plans and records -------------------------------------------------------

export function CarePlanDialogForm({
  organisationId,
  residentId,
  plan,
}: {
  organisationId: string;
  residentId: string;
  plan?: { id: string; title: string; summary: string | null; accessLevel: string; reviewDueOn: string | null };
}) {
  const fields: CareField[] = [
    { name: "title", label: "Plan title", required: true, defaultValue: plan?.title },
    {
      name: "accessLevel",
      label: "Access level",
      type: "select",
      required: true,
      defaultValue: plan?.accessLevel ?? "standard",
      options: optionsFrom(CARE_PLAN_ACCESS_LEVELS, carePlanAccessLabels),
    },
    { name: "reviewDueOn", label: "Review due", type: "date", defaultValue: plan?.reviewDueOn ?? "" },
    { name: "summary", label: "Summary", type: "textarea", defaultValue: plan?.summary ?? "" },
  ];
  return (
    <CareDialogForm
      trigger={plan ? "Edit plan details" : "New care plan"}
      triggerVariant={plan ? "outline" : "default"}
      title={plan ? "Edit care plan" : "Create a care plan"}
      description="Care plans are versioned and approved. Restricted plans are hidden from general staff."
      submitLabel="Save plan"
      fields={fields}
      action={(values) =>
        saveCarePlanAction(
          cast<typeof saveCarePlanAction>(values, {
            organisationId,
            residentId,
            planId: plan?.id,
          }),
        )
      }
    />
  );
}

export function CarePlanVersionDialogForm({ organisationId, planId }: { organisationId: string; planId: string }) {
  const fields: CareField[] = [
    { name: "needs", label: "Assessed needs", type: "textarea", required: true },
    { name: "goals", label: "Goals", type: "textarea" },
    { name: "responsibilities", label: "Responsibilities", type: "textarea" },
    { name: "risks", label: "Risks and mitigations", type: "textarea" },
    { name: "reviewCadence", label: "Review cadence", placeholder: "Monthly" },
    { name: "changeSummary", label: "What changed", type: "textarea", required: true },
  ];
  return (
    <CareDialogForm
      trigger="Add version"
      title="Add a care plan version"
      description="Versions are immutable. Create a new version for every change."
      submitLabel="Save version"
      fields={fields}
      action={(values) =>
        saveCarePlanVersionAction(
          cast<typeof saveCarePlanVersionAction>(values, { organisationId, planId }),
        )
      }
    />
  );
}

export function CarePlanStatusButtons({ organisationId, planId, status }: { organisationId: string; planId: string; status: string }) {
  const actions: { label: string; status: "pending_approval" | "active" | "rejected" | "archived"; variant?: "default" | "outline" }[] = [];
  if (status === "draft" || status === "rejected") actions.push({ label: "Submit for approval", status: "pending_approval" });
  if (status === "pending_approval") {
    actions.push({ label: "Approve and activate", status: "active", variant: "default" });
    actions.push({ label: "Reject", status: "rejected", variant: "outline" });
  }
  if (status === "active") actions.push({ label: "Archive", status: "archived", variant: "outline" });
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((item) => (
        <CareActionButton
          key={item.status}
          label={item.label}
          variant={item.variant ?? "outline"}
          extra={{ organisationId, planId, status: item.status }}
          action={(values) => changeCarePlanStatusAction(cast<typeof changeCarePlanStatusAction>(values, {}))}
        />
      ))}
    </div>
  );
}

export function CareRecordDialogForm({
  organisationId,
  residentId,
  residents,
}: {
  organisationId: string;
  residentId?: string;
  residents?: ResidentOption[];
}) {
  const fields: CareField[] = [
    ...(!residentId && residents
      ? [
          {
            name: "residentId",
            label: "Resident",
            type: "select" as const,
            required: true,
            options: residents.map((resident) => ({
              value: resident.id,
              label: `${resident.name} · ${resident.reference}`,
            })),
          },
        ]
      : []),
    {
      name: "status",
      label: "Outcome",
      type: "select",
      required: true,
      defaultValue: "completed",
      options: optionsFrom(CARE_RECORD_STATUSES, careRecordStatusLabels),
    },
    { name: "completedAt", label: "Recorded at", type: "datetime-local", required: true, defaultValue: nowLocal() },
    { name: "assistanceNotes", label: "Assistance provided", type: "textarea" },
    { name: "mealOffered", label: "Meal offered" },
    { name: "mealConsumed", label: "Meal consumed" },
    { name: "hydrationMl", label: "Hydration (ml)", type: "number", min: 0 },
    { name: "mobilityNotes", label: "Mobility notes", type: "textarea" },
    { name: "observations", label: "Observations", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record care"
      triggerVariant="outline"
      title="Record daily care"
      description="Record only information relevant to care delivery."
      submitLabel="Save record"
      fields={fields}
      action={(values) =>
        recordCareAction(
          cast<typeof recordCareAction>(values, {
            organisationId,
            residentId: residentId ?? (values.residentId as string | undefined),
          }),
        )
      }
    />
  );
}

export function CareRecordReviewForm({
  organisationId,
  recordId,
}: {
  organisationId: string;
  recordId: string;
}) {
  const fields: CareField[] = [
    {
      name: "reviewOutcome",
      label: "Review outcome",
      type: "select",
      required: true,
      defaultValue: "accepted",
      options: [
        { value: "accepted", label: "Accepted" },
        { value: "follow_up_required", label: "Follow-up required" },
        { value: "escalated", label: "Escalated" },
      ],
    },
    { name: "reviewNotes", label: "Review notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Review"
      triggerVariant="ghost"
      title="Review a care record"
      description="Reviewing locks the record against further edits by the recorder."
      submitLabel="Save review"
      fields={fields}
      action={(values) =>
        reviewCareRecordAction(
          cast<typeof reviewCareRecordAction>(values, { organisationId, recordId }),
        )
      }
    />
  );
}

export function CareTaskDialogForm({ organisationId, residentId }: { organisationId: string; residentId: string }) {
  const fields: CareField[] = [
    { name: "title", label: "Task title", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      defaultValue: "personal_care",
      options: optionsFrom(CARE_TASK_CATEGORIES, careTaskCategoryLabels),
    },
    { name: "instructions", label: "Instructions", type: "textarea" },
    { name: "scheduleTimes", label: "Schedule times", placeholder: "08:00, 13:00, 20:00" },
    { name: "requiredQualification", label: "Required qualification code" },
    { name: "requiresTwoStaff", label: "Requires two staff", type: "checkbox" },
  ];
  return (
    <CareDialogForm
      trigger="Add care task"
      triggerVariant="outline"
      title="Add a care task"
      submitLabel="Save task"
      fields={fields}
      action={(values) =>
        saveCareTaskAction(
          cast<typeof saveCareTaskAction>(values, { organisationId, residentId }),
        )
      }
    />
  );
}

// Medication -------------------------------------------------------------------

export function MedicationDialogForm({
  organisationId,
  residentId,
  residents,
}: {
  organisationId: string;
  residentId?: string;
  residents?: ResidentOption[];
}) {
  const fields: CareField[] = [
    ...(!residentId && residents
      ? [
          {
            name: "residentId",
            label: "Resident",
            type: "select" as const,
            required: true,
            options: residents.map((resident) => ({
              value: resident.id,
              label: `${resident.name} · ${resident.reference}`,
            })),
          },
        ]
      : []),
    { name: "medicationName", label: "Medication (as prescribed)", required: true },
    { name: "doseText", label: "Dose (free text)", placeholder: "As prescribed" },
    { name: "route", label: "Route", placeholder: "Oral" },
    { name: "scheduledAt", label: "Scheduled at", type: "datetime-local", required: true, defaultValue: nowLocal() },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Schedule medication"
      triggerVariant="outline"
      title="Schedule a medication record"
      description="CareBridge records administration only. It does not recommend medicines or calculate doses."
      submitLabel="Schedule"
      fields={fields}
      action={(values) =>
        scheduleMedicationAction(
          cast<typeof scheduleMedicationAction>(values, {
            organisationId,
            residentId: residentId ?? (values.residentId as string | undefined),
          }),
        )
      }
    />
  );
}

export function MedicationStatusForm({
  organisationId,
  medicationRecordId,
}: {
  organisationId: string;
  medicationRecordId: string;
}) {
  return (
    <CareDialogForm
      trigger="Record administration"
      triggerVariant="outline"
      title="Record medication administration"
      description="The administration record is immutable once saved."
      submitLabel="Save administration"
      fields={[
        {
          name: "status",
          label: "Outcome",
          type: "select",
          required: true,
          defaultValue: "administered",
          options: optionsFrom(MEDICATION_STATUSES.slice(1), medicationStatusLabels),
        },
        { name: "reason", label: "Reason (if refused, held or omitted)", type: "textarea" },
        { name: "witnessedByEmail", label: "Witness email", type: "email" },
      ]}
      action={(values) =>
        recordMedicationStatusAction(
          cast<typeof recordMedicationStatusAction>(values, {
            organisationId,
            medicationRecordId,
          }),
        )
      }
    />
  );
}

// Incidents --------------------------------------------------------------------

export function IncidentDialogForm({
  organisationId,
  facilities,
  residents,
  defaultFacilityId,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  residents: ResidentOption[];
  defaultFacilityId?: string;
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: defaultFacilityId ?? facilities[0]?.id,
      options: facilities.map((facility) => ({ value: facility.id, label: facility.name })),
    },
    {
      name: "residentId",
      label: "Resident (if relevant)",
      type: "select",
      options: residents.map((resident) => ({ value: resident.id, label: `${resident.name} · ${resident.reference}` })),
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: optionsFrom(CARE_INCIDENT_CATEGORIES, careIncidentCategoryLabels),
    },
    {
      name: "severity",
      label: "Severity",
      type: "select",
      required: true,
      defaultValue: "medium",
      options: optionsFrom(CARE_INCIDENT_SEVERITIES, careIncidentSeverityLabels),
    },
    { name: "occurredAt", label: "Occurred at", type: "datetime-local", required: true, defaultValue: nowLocal() },
    { name: "description", label: "What happened", type: "textarea", required: true },
    { name: "immediateAction", label: "Immediate action taken", type: "textarea" },
    { name: "isSafeguarding", label: "Safeguarding concern", type: "checkbox" },
    { name: "externalReference", label: "External reference" },
  ];
  return (
    <CareDialogForm
      trigger="Report incident"
      title="Report an incident"
      description="Follow your organisation's emergency procedure for urgent situations. This record does not contact emergency services."
      submitLabel="Report incident"
      fields={fields}
      action={(values) =>
        reportIncidentAction(cast<typeof reportIncidentAction>(values, { organisationId }))
      }
    />
  );
}

export function IncidentUpdateForm({
  organisationId,
  incidentId,
  status,
  severity,
}: {
  organisationId: string;
  incidentId: string;
  status: string;
  severity: string;
}) {
  const fields: CareField[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: status,
      options: optionsFrom(CARE_INCIDENT_STATUSES, careIncidentStatusLabels),
    },
    {
      name: "severity",
      label: "Severity",
      type: "select",
      required: true,
      defaultValue: severity,
      options: optionsFrom(CARE_INCIDENT_SEVERITIES, careIncidentSeverityLabels),
    },
    { name: "reviewerEmail", label: "Reviewer email", type: "email", help: "Required before the incident can be closed." },
    { name: "closureNotes", label: "Closure notes", type: "textarea", help: "Required when closing." },
  ];
  return (
    <CareForm
      submitLabel="Update incident"
      fields={fields}
      action={(values) =>
        updateIncidentAction(cast<typeof updateIncidentAction>(values, { organisationId, incidentId }))
      }
    />
  );
}

export function IncidentActionForm({ organisationId, incidentId }: { organisationId: string; incidentId: string }) {
  const fields: CareField[] = [
    { name: "action", label: "Corrective action", type: "textarea", required: true },
    { name: "ownerEmail", label: "Owner email", type: "email" },
    { name: "dueOn", label: "Due on", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add corrective action"
      triggerVariant="outline"
      title="Add a corrective action"
      submitLabel="Save action"
      fields={fields}
      action={(values) =>
        addIncidentActionAction(cast<typeof addIncidentActionAction>(values, { organisationId, incidentId }))
      }
    />
  );
}

// Inventory, suppliers and expenses -------------------------------------------

export function InventoryItemDialogForm({
  organisationId,
  facilities,
  defaultFacilityId,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  defaultFacilityId?: string;
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: defaultFacilityId ?? facilities[0]?.id,
      options: facilities.map((facility) => ({ value: facility.id, label: facility.name })),
    },
    { name: "sku", label: "SKU", required: true },
    { name: "name", label: "Item name", required: true },
    { name: "category", label: "Category" },
    { name: "unit", label: "Unit", required: true, defaultValue: "unit", placeholder: "box, pack, litre" },
    { name: "reorderLevel", label: "Reorder level", type: "number", min: 0, defaultValue: 0 },
    { name: "openingQuantity", label: "Opening quantity", type: "number", min: 0, step: "0.001", help: "Recorded as an opening stock movement." },
  ];
  return (
    <CareDialogForm
      trigger="Add inventory item"
      title="Add an inventory item"
      description="Balances are derived from append-only stock movements."
      submitLabel="Save item"
      fields={fields}
      action={(values) =>
        saveInventoryItemAction(cast<typeof saveInventoryItemAction>(values, { organisationId }))
      }
    />
  );
}

export function MovementDialogForm({
  organisationId,
  itemId,
  itemName,
  unit,
}: {
  organisationId: string;
  itemId: string;
  itemName: string;
  unit: string;
}) {
  const fields: CareField[] = [
    {
      name: "movementType",
      label: "Movement",
      type: "select",
      required: true,
      defaultValue: "issue",
      options: optionsFrom(INVENTORY_MOVEMENT_TYPES, inventoryMovementTypeLabels),
    },
    { name: "quantity", label: `Quantity (${unit})`, type: "number", required: true, step: "0.001", help: "For an adjustment, enter a negative number to reduce stock." },
    { name: "reason", label: "Reason", type: "textarea" },
    { name: "reference", label: "Reference" },
  ];
  return (
    <CareDialogForm
      trigger={`Record movement · ${itemName}`}
      triggerVariant="outline"
      title="Record a stock movement"
      submitLabel="Save movement"
      fields={fields}
      action={(values) =>
        recordInventoryMovementAction(
          cast<typeof recordInventoryMovementAction>(values, { organisationId, itemId }),
        )
      }
    />
  );
}

export function SupplierDialogForm({ organisationId }: { organisationId: string }) {
  const fields: CareField[] = [
    { name: "name", label: "Supplier name", required: true },
    { name: "contactName", label: "Contact name" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Add supplier"
      triggerVariant="outline"
      title="Add a supplier"
      submitLabel="Save supplier"
      fields={fields}
      action={(values) =>
        saveSupplierAction(cast<typeof saveSupplierAction>(values, { organisationId }))
      }
    />
  );
}

export function ExpenseDialogForm({
  organisationId,
  facilities,
  suppliers,
  defaultFacilityId,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  defaultFacilityId?: string;
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: defaultFacilityId ?? facilities[0]?.id,
      options: facilities.map((facility) => ({ value: facility.id, label: facility.name })),
    },
    { name: "category", label: "Category", required: true, placeholder: "Utilities, food, maintenance" },
    { name: "amount", label: "Amount (NGN)", required: true, placeholder: "0.00" },
    { name: "incurredOn", label: "Incurred on", type: "date", required: true, defaultValue: today() },
    {
      name: "paymentStatus",
      label: "Payment status",
      type: "select",
      required: true,
      defaultValue: "unpaid",
      options: optionsFrom(EXPENSE_PAYMENT_STATUSES, expensePaymentStatusLabels),
    },
    { name: "paymentMethod", label: "Payment method" },
    {
      name: "supplierId",
      label: "Supplier",
      type: "select",
      options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    },
    { name: "receiptReference", label: "Receipt reference" },
    { name: "description", label: "Description", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record expense"
      triggerVariant="outline"
      title="Record an expense"
      submitLabel="Save expense"
      fields={fields}
      action={(values) =>
        recordExpenseAction(cast<typeof recordExpenseAction>(values, { organisationId }))
      }
    />
  );
}

export function PurchaseRequestDialogForm({
  organisationId,
  facilityId,
  currency = "NGN",
}: {
  organisationId: string;
  facilityId: string;
  currency?: string;
}) {
  const fields: CareField[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      defaultValue: facilityId,
      options: [{ value: facilityId, label: "Current facility" }],
    },
    { name: "description", label: "Item description", required: true },
    { name: "quantity", label: "Quantity", type: "number", required: true, min: 0.001, step: "0.001", defaultValue: 1 },
    { name: "estimatedUnitCost", label: `Estimated unit cost (${currency})`, required: true, placeholder: "0.00" },
    { name: "neededBy", label: "Needed by", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="New purchase request"
      title="Create a purchase request"
      description="Requests are reviewed by someone with expense approval permission. This form creates a single-line request."
      submitLabel="Submit request"
      fields={fields}
      action={(values) =>
        createPurchaseRequestAction(
          cast<typeof createPurchaseRequestAction>(
            {
              facilityId: values.facilityId,
              neededBy: values.neededBy,
              notes: values.notes,
              items: [
                {
                  description: values.description,
                  quantity: Number(values.quantity),
                  estimatedUnitCost: values.estimatedUnitCost,
                },
              ],
            },
            { organisationId },
          ),
        )
      }
    />
  );
}

// Billing ----------------------------------------------------------------------

type InvoiceLine = { description: string; quantity: string; unitPrice: string };

export function InvoiceDialogForm({
  organisationId,
  facilities,
  residents,
  defaultFacilityId,
}: {
  organisationId: string;
  facilities: { id: string; name: string }[];
  residents: ResidentOption[];
  defaultFacilityId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerContact, setPayerContact] = useState("");
  const [facilityId, setFacilityId] = useState(defaultFacilityId ?? facilities[0]?.id ?? "");
  const [residentId, setResidentId] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  const totalMinor = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity || 0);
    const price = Number(line.unitPrice.replaceAll(",", "") || 0);
    return sum + Math.round(quantity * price * 100);
  }, 0);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        New invoice
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="mt-10 w-full max-w-3xl rounded-lg border border-border bg-background p-6 shadow-xl">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">Create an invoice</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoices are created as drafts. Issue the invoice when the lines are correct.
            </p>
            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Facility</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={facilityId} onChange={(event) => setFacilityId(event.target.value)}>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Resident (optional)</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={residentId} onChange={(event) => setResidentId(event.target.value)}>
                  <option value="">Not linked to a resident</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>{resident.name} · {resident.reference}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Payer name</Label>
                <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
              </div>
              <div>
                <Label>Payer contact</Label>
                <Input value={payerContact} onChange={(event) => setPayerContact(event.target.value)} />
              </div>
              <div>
                <Label>Issue date</Label>
                <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label>Line items</Label>
              {lines.map((line, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_140px_40px]">
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, description: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0.001}
                    step="0.001"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, quantity: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Unit price"
                    value={line.unitPrice}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, unitPrice: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={lines.length === 1}
                    onClick={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLines((current) => [...current, { description: "", quantity: "1", unitPrice: "" }])}
              >
                Add line
              </Button>
            </div>

            <div>
              <Label className="mt-4 block">Notes</Label>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <p className="mt-3 text-sm font-medium text-brand-strong">
              Total: {formatMoney(totalMinor, "NGN")}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await createInvoiceAction({
                      organisationId,
                      facilityId,
                      residentId: residentId || undefined,
                      payerName,
                      payerContact: payerContact || undefined,
                      issueDate,
                      dueDate,
                      notes: notes || undefined,
                      items: lines.map((line) => ({
                        description: line.description,
                        quantity: Number(line.quantity),
                        unitPrice: line.unitPrice,
                      })),
                    });
                    if (result.ok) {
                      setOpen(false);
                      if (result.redirectTo) router.push(result.redirectTo);
                      router.refresh();
                    } else {
                      setError(result.message);
                    }
                  });
                }}
              >
                {isPending ? "Creating…" : "Create draft"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PaymentDialogForm({ organisationId, invoiceId }: { organisationId: string; invoiceId: string }) {
  const fields: CareField[] = [
    { name: "amount", label: "Amount (NGN)", required: true, placeholder: "0.00" },
    { name: "paidAt", label: "Paid at", type: "datetime-local", required: true, defaultValue: nowLocal() },
    {
      name: "method",
      label: "Method",
      type: "select",
      required: true,
      defaultValue: "bank_transfer",
      options: optionsFrom(SERVICE_PAYMENT_METHODS, servicePaymentMethodLabels),
    },
    { name: "reference", label: "Reference" },
    { name: "receiptReference", label: "Receipt reference" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Record payment"
      title="Record a payment"
      description="Payments are append-only. Record a refund to reverse a payment."
      submitLabel="Save payment"
      fields={fields}
      action={(values) =>
        recordInvoicePaymentAction(cast<typeof recordInvoicePaymentAction>(values, { organisationId, invoiceId }))
      }
    />
  );
}

export function RefundDialogForm({ organisationId, paymentId }: { organisationId: string; paymentId: string }) {
  const fields: CareField[] = [
    { name: "amount", label: "Amount (NGN)", required: true, placeholder: "0.00" },
    { name: "reason", label: "Reason", type: "textarea", required: true },
  ];
  return (
    <CareDialogForm
      trigger="Refund"
      triggerVariant="ghost"
      title="Record a refund"
      submitLabel="Save refund"
      fields={fields}
      action={(values) =>
        recordInvoiceRefundAction(cast<typeof recordInvoiceRefundAction>(values, { organisationId, paymentId }))
      }
    />
  );
}

export function IssueInvoiceButton({ organisationId, invoiceId }: { organisationId: string; invoiceId: string }) {
  return (
    <CareActionButton
      label="Issue invoice"
      extra={{ organisationId, invoiceId }}
      action={(values) => issueInvoiceAction(cast<typeof issueInvoiceAction>(values, {}))}
    />
  );
}

export function PurchaseReviewButtons({ organisationId, requestId }: { organisationId: string; requestId: string }) {
  return (
    <div className="flex gap-2">
      <CareActionButton
        label="Approve"
        extra={{ organisationId, requestId, decision: "approved" }}
        action={(values) => reviewPurchaseRequestAction(cast<typeof reviewPurchaseRequestAction>(values, {}))}
      />
      <CareActionButton
        label="Reject"
        variant="ghost"
        confirm="Reject this purchase request?"
        extra={{ organisationId, requestId, decision: "rejected", reason: "Rejected by finance" }}
        action={(values) => reviewPurchaseRequestAction(cast<typeof reviewPurchaseRequestAction>(values, {}))}
      />
    </div>
  );
}
