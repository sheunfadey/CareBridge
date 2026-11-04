import { describe, expect, it } from "vitest";

import {
  CARE_EMPLOYMENT_STATUSES,
  CARE_INCIDENT_CATEGORIES,
  CARE_INCIDENT_SEVERITIES,
  CARE_INCIDENT_STATUSES,
  CARE_PLAN_ACCESS_LEVELS,
  CARE_PLAN_STATUSES,
  CARE_RECORD_STATUSES,
  CARE_TASK_CATEGORIES,
  EXPENSE_PAYMENT_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  MEDICATION_STATUSES,
  RESIDENT_STATUSES,
  SERVICE_INVOICE_STATUSES,
  SERVICE_PAYMENT_METHODS,
  SHIFT_ASSIGNMENT_STATUSES,
  SHIFT_STATUSES,
  careDateSchema,
  careDateTimeSchema,
  careEmploymentStatusLabels,
  careIncidentCategoryLabels,
  careIncidentSeverityLabels,
  careIncidentStatusLabels,
  carePlanAccessLabels,
  carePlanStatusLabels,
  careRecordStatusLabels,
  careTaskCategoryLabels,
  expensePaymentStatusLabels,
  incidentSchema,
  inventoryMovementSchema,
  invoiceSchema,
  medicationStatusLabels,
  residentContactSchema,
  residentSchema,
  residentStatusLabels,
  serviceInvoiceStatusLabels,
  servicePaymentMethodLabels,
  shiftAssignmentStatusLabels,
  shiftSchema,
  shiftStatusLabels,
  staffAvailabilitySchema,
} from "@/lib/validation/care";

describe("care date validation", () => {
  it("accepts valid dates and rejects impossible ones", () => {
    expect(careDateSchema.parse("2026-11-03")).toBe("2026-11-03");
    expect(careDateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(careDateSchema.safeParse("03/11/2026").success).toBe(false);
    expect(careDateSchema.safeParse("").success).toBe(false);
  });

  it("validates datetime-local values", () => {
    expect(careDateTimeSchema.safeParse("2026-11-03T08:30").success).toBe(true);
    expect(careDateTimeSchema.safeParse("not a date").success).toBe(false);
  });
});

describe("care status labels", () => {
  it("labels every resident status", () => {
    for (const status of RESIDENT_STATUSES) {
      expect(residentStatusLabels[status]).toBeTruthy();
    }
  });

  it("labels shifts, assignments and care records", () => {
    for (const status of SHIFT_STATUSES) expect(shiftStatusLabels[status]).toBeTruthy();
    for (const status of SHIFT_ASSIGNMENT_STATUSES) {
      expect(shiftAssignmentStatusLabels[status]).toBeTruthy();
    }
    for (const status of CARE_RECORD_STATUSES) {
      expect(careRecordStatusLabels[status]).toBeTruthy();
    }
    for (const category of CARE_TASK_CATEGORIES) {
      expect(careTaskCategoryLabels[category]).toBeTruthy();
    }
  });

  it("labels employment, plan, incident and medication statuses", () => {
    for (const status of CARE_EMPLOYMENT_STATUSES) {
      expect(careEmploymentStatusLabels[status]).toBeTruthy();
    }
    for (const status of CARE_PLAN_STATUSES) {
      expect(carePlanStatusLabels[status]).toBeTruthy();
    }
    for (const access of CARE_PLAN_ACCESS_LEVELS) {
      expect(carePlanAccessLabels[access]).toBeTruthy();
    }
    for (const category of CARE_INCIDENT_CATEGORIES) {
      expect(careIncidentCategoryLabels[category]).toBeTruthy();
    }
    for (const severity of CARE_INCIDENT_SEVERITIES) {
      expect(careIncidentSeverityLabels[severity]).toBeTruthy();
    }
    for (const status of CARE_INCIDENT_STATUSES) {
      expect(careIncidentStatusLabels[status]).toBeTruthy();
    }
    for (const status of MEDICATION_STATUSES) {
      expect(medicationStatusLabels[status]).toBeTruthy();
    }
  });

  it("labels inventory, expenses, invoices and payment methods", () => {
    for (const type of INVENTORY_MOVEMENT_TYPES) {
      expect(type).toBeTruthy();
    }
    for (const status of EXPENSE_PAYMENT_STATUSES) {
      expect(expensePaymentStatusLabels[status]).toBeTruthy();
    }
    for (const status of SERVICE_INVOICE_STATUSES) {
      expect(serviceInvoiceStatusLabels[status]).toBeTruthy();
    }
    for (const method of SERVICE_PAYMENT_METHODS) {
      expect(servicePaymentMethodLabels[method]).toBeTruthy();
    }
  });
});

describe("resident validation", () => {
  const base = {
    facilityId: "11111111-1111-4111-8111-111111111111",
    reference: "R-100",
    firstName: "Ada",
    lastName: "Okafor",
    admissionDate: "2026-11-03",
    status: "active" as const,
  };

  it("parses a valid resident and normalises empty dates", () => {
    const parsed = residentSchema.parse(base);
    expect(parsed.reference).toBe("R-100");
    expect(parsed.dateOfBirth).toBeNull();
    expect(parsed.dischargeDate).toBeNull();
  });

  it("requires a facility and names", () => {
    expect(
      residentSchema.safeParse({ ...base, facilityId: "not-a-uuid" }).success,
    ).toBe(false);
    expect(
      residentSchema.safeParse({ ...base, firstName: "" }).success,
    ).toBe(false);
  });

  it("validates contact flags and priority", () => {
    const parsed = residentContactSchema.parse({
      residentId: base.facilityId,
      name: "Grace Okafor",
      isEmergency: true,
      isAuthorisedRepresentative: false,
      priority: 1,
    });
    expect(parsed.isEmergency).toBe(true);
    expect(
      residentContactSchema.safeParse({
        residentId: base.facilityId,
        name: "Grace",
        priority: 0,
      }).success,
    ).toBe(false);
  });
});

describe("shift validation", () => {
  it("rejects malformed shift windows", () => {
    const valid = {
      facilityId: "11111111-1111-4111-8111-111111111111",
      startsAt: "2026-11-03T08:00",
      endsAt: "2026-11-03T20:00",
      requiredStaff: 2,
    };
    expect(shiftSchema.safeParse(valid).success).toBe(true);
    expect(
      shiftSchema.safeParse({ ...valid, startsAt: "2026-11-03" }).success,
    ).toBe(false);
    expect(
      shiftSchema.safeParse({ ...valid, requiredStaff: 0 }).success,
    ).toBe(false);
  });
});

describe("incident validation", () => {
  it("requires a meaningful description and a valid occurrence time", () => {
    const valid = {
      facilityId: "11111111-1111-4111-8111-111111111111",
      category: "fall" as const,
      severity: "high" as const,
      occurredAt: "2026-11-03T14:30",
      description: "Resident fell in the corridor and was assisted.",
      isSafeguarding: false,
    };
    expect(incidentSchema.safeParse(valid).success).toBe(true);
    expect(
      incidentSchema.safeParse({ ...valid, description: "short" }).success,
    ).toBe(false);
  });
});

describe("care money records", () => {
  it("requires positive stock movement quantities", () => {
    expect(
      inventoryMovementSchema.safeParse({
        itemId: "11111111-1111-4111-8111-111111111111",
        movementType: "issue",
        quantity: 2,
      }).success,
    ).toBe(true);
    expect(
      inventoryMovementSchema.safeParse({
        itemId: "11111111-1111-4111-8111-111111111111",
        movementType: "issue",
        quantity: 0,
      }).success,
    ).toBe(false);
  });

  it("requires at least one invoice line", () => {
    const base = {
      facilityId: "11111111-1111-4111-8111-111111111111",
      payerName: "Payer",
      issueDate: "2026-11-03",
      dueDate: "2026-12-03",
      items: [],
    };
    expect(invoiceSchema.safeParse(base).success).toBe(false);
    expect(
      invoiceSchema.safeParse({
        ...base,
        items: [{ description: "Care fee", quantity: 1, unitPrice: "5000" }],
      }).success,
    ).toBe(true);
  });
});

describe("staff availability", () => {
  const base = {
    staffId: "11111111-1111-4111-8111-111111111111",
    monday: "08:00-16:00",
  };

  it("accepts weekly availability windows", () => {
    expect(staffAvailabilitySchema.safeParse(base).success).toBe(true);
    expect(
      staffAvailabilitySchema.safeParse({ ...base, sunday: "10:30-18:00" }).success,
    ).toBe(true);
  });

  it("rejects malformed times", () => {
    expect(
      staffAvailabilitySchema.safeParse({ ...base, monday: "8-4" }).success,
    ).toBe(false);
    expect(
      staffAvailabilitySchema.safeParse({ ...base, monday: "08:00-25:00" }).success,
    ).toBe(false);
  });
});
