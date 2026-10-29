import type { RoleKey } from "@/types/database";

/**
 * Central permission registry. Every permission is defined once here and mapped
 * to roles. This mirrors the database seed (see supabase/migrations) so that
 * server-side checks, RLS and UI gating all agree.
 */

export const PERMISSION_CATEGORIES = [
  "platform_settings",
  "organisation_management",
  "user_management",
  "course_management",
  "learning_materials",
  "assessments",
  "internship_administration",
  "employment_recruitment",
  "resident_records",
  "care_plans",
  "care_records",
  "medication",
  "shift_management",
  "staff_management",
  "incidents",
  "inventory",
  "expenses",
  "billing",
  "financial_reporting",
  "payment_review",
  "refunds",
  "referral_rules",
  "commission_approval",
  "payout_approval",
  "charity_campaigns",
  "donor_reporting",
  "compliance_records",
  "audit_logs",
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export const PERMISSIONS = {
  // Platform
  platform_settings_manage: "platform_settings",
  organisation_review: "organisation_management",
  organisation_manage: "organisation_management",
  organisation_delete: "organisation_management",

  // Users & access
  user_view: "user_management",
  user_invite: "user_management",
  user_role_assign: "user_management",

  // Academy
  course_view: "course_management",
  course_manage: "course_management",
  course_publish: "course_management",
  learning_material_manage: "learning_materials",
  assessment_grade: "assessments",
  assessment_manage: "assessments",
  practical_assessment_record: "assessments",

  // Internship & employment
  internship_manage: "internship_administration",
  internship_supervise: "internship_administration",
  job_manage: "employment_recruitment",
  job_apply: "employment_recruitment",
  candidate_view: "employment_recruitment",

  // Care operations
  resident_view: "resident_records",
  resident_manage: "resident_records",
  care_plan_manage: "care_plans",
  incident_view: "incidents",
  incident_manage: "incidents",
  shift_view: "shift_management",
  shift_manage: "shift_management",
  care_record_manage: "care_records",
  medication_manage: "medication",
  staff_manage: "staff_management",
  inventory_view: "inventory",
  inventory_manage: "inventory",
  expense_manage: "expenses",
  expense_approve: "expenses",
  invoice_view: "billing",
  invoice_manage: "billing",
  care_report_view: "resident_records",

  // Finance
  financial_report_view: "financial_reporting",
  payment_review: "payment_review",
  refund_process: "refunds",
  referral_rules_manage: "referral_rules",
  commission_approve: "commission_approval",
  payout_approve: "payout_approval",

  // Charity
  charity_campaign_manage: "charity_campaigns",
  charity_campaign_approve: "charity_campaigns",
  donor_report_view: "donor_reporting",

  // Compliance
  compliance_view: "compliance_records",
  audit_log_view: "audit_logs",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

/**
 * Role → permissions. A role may also hold permissions scoped to a specific
 * organisation (see user_role_assignments.organisation_id).
 */
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS,

  platform_support: [
    "user_view",
    "organisation_review",
    "course_view",
    "incident_view",
    "compliance_view",
    "audit_log_view",
  ],

  training_admin: [
    "user_view",
    "user_invite",
    "course_view",
    "course_manage",
    "course_publish",
    "learning_material_manage",
    "assessment_manage",
    "assessment_grade",
    "practical_assessment_record",
    "internship_manage",
    "financial_report_view",
  ],

  instructor: [
    "course_view",
    "learning_material_manage",
    "assessment_grade",
    "practical_assessment_record",
  ],

  caregiver: ["course_view", "job_apply"],

  internship_supervisor: [
    "internship_supervise",
    "internship_manage",
    "incident_view",
    "incident_manage",
  ],

  employer: ["job_manage", "candidate_view", "user_view"],

  care_home_owner: [
    "user_view",
    "user_invite",
    "user_role_assign",
    "resident_view",
    "resident_manage",
    "care_plan_manage",
    "incident_view",
    "incident_manage",
    "compliance_view",
    "financial_report_view",
    "payment_review",
    "shift_view",
    "shift_manage",
    "care_record_manage",
    "medication_manage",
    "staff_manage",
    "inventory_view",
    "inventory_manage",
    "expense_manage",
    "expense_approve",
    "invoice_view",
    "invoice_manage",
    "care_report_view",
  ],

  care_home_manager: [
    "user_view",
    "resident_view",
    "resident_manage",
    "care_plan_manage",
    "incident_view",
    "incident_manage",
    "compliance_view",
    "shift_view",
    "shift_manage",
    "care_record_manage",
    "medication_manage",
    "staff_manage",
    "inventory_view",
    "inventory_manage",
    "expense_manage",
    "invoice_view",
    "invoice_manage",
    "care_report_view",
  ],

  care_staff: [
    "resident_view",
    "incident_view",
    "incident_manage",
    "shift_view",
    "care_record_manage",
  ],

  // Senior care staff who are authorised to record medication administration.
  // The organisation decides who receives this role; it is never automatic.
  care_medication_staff: [
    "resident_view",
    "incident_view",
    "incident_manage",
    "shift_view",
    "care_record_manage",
    "medication_manage",
  ],

  referral_partner: [],

  charity_admin: [
    "charity_campaign_manage",
    "donor_report_view",
    "financial_report_view",
  ],

  donor: [],

  finance_officer: [
    "financial_report_view",
    "payment_review",
    "refund_process",
    "referral_rules_manage",
    "commission_approve",
    "payout_approve",
    "audit_log_view",
    "invoice_view",
    "expense_approve",
    "care_report_view",
  ],

  compliance_officer: [
    "compliance_view",
    "incident_view",
    "organisation_review",
    "audit_log_view",
    "care_report_view",
  ],

  family_member: [],
};

/** Roles that can only be granted by privileged administrators. */
export const PRIVILEGED_ROLES: RoleKey[] = [
  "super_admin",
  "platform_support",
  "finance_officer",
  "compliance_officer",
];

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Super administrator",
  platform_support: "Platform support",
  training_admin: "Training administrator",
  instructor: "Instructor",
  caregiver: "Caregiver / student",
  internship_supervisor: "Internship supervisor",
  employer: "Employer / recruiter",
  care_home_owner: "Care home owner",
  care_home_manager: "Care home manager",
  care_staff: "Care staff",
  care_medication_staff: "Senior care staff (medication)",
  referral_partner: "Referral partner",
  charity_admin: "Charity administrator",
  donor: "Donor",
  finance_officer: "Finance officer",
  compliance_officer: "Compliance officer",
  family_member: "Family member",
};

export function permissionsForRoles(roles: RoleKey[]): Set<PermissionKey> {
  const result = new Set<PermissionKey>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      result.add(permission);
    }
  }
  return result;
}
