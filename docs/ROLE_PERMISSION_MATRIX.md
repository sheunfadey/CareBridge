# Role and permission matrix

Source of truth: `src/lib/permissions/registry.ts` (application) and the
`roles`/`permissions`/`role_permissions` seed migrations (database). A role may
be assigned platform-wide (`organisation_id = null`) or scoped to one
organisation; `has_permission(permission, organisation_id)` is the authoritative
check.

## Permission keys by area

| Area | Permissions |
| --- | --- |
| Platform | `platform_settings_manage`, `organisation_review`, `organisation_manage`, `organisation_delete` |
| Users | `user_view`, `user_invite`, `user_role_assign` |
| Academy | `course_view`, `course_manage`, `course_publish`, `learning_material_manage`, `assessment_grade`, `assessment_manage`, `practical_assessment_record` |
| Employment | `internship_manage`, `internship_supervise`, `job_manage`, `job_apply`, `candidate_view` |
| Care records | `resident_view`, `resident_manage`, `care_plan_manage`, `care_record_manage`, `care_report_view` |
| Shifts/staff | `shift_view`, `shift_manage`, `staff_manage` |
| Medication/incidents | `medication_manage`, `incident_view`, `incident_manage` |
| Inventory/expenses | `inventory_view`, `inventory_manage`, `expense_manage`, `expense_approve` |
| Billing | `invoice_view`, `invoice_manage`, `payment_review`, `refund_process` |
| Referrals | `referral_rules_manage`, `commission_approve`, `payout_approve` |
| Charity | `charity_campaign_manage`, `charity_campaign_approve`, `donor_report_view`, `scholarship_manage`, `scholarship_review` |
| Subscriptions | `subscription_view`, `subscription_manage`, `billing_manage` |
| Reporting | `report_view`, `report_export` |
| Compliance | `compliance_view`, `audit_log_view` |

## Role matrix

| Role | Capabilities |
| --- | --- |
| `super_admin` | All permissions; platform administration, all tenants and billing |
| `platform_support` | Read-oriented support: users, organisations, courses, incidents, compliance, audit, subscription view |
| `training_admin` | Academy management and publishing, assessments, internships, financial reporting, organisation subscription and reports |
| `instructor` | Course view, learning materials, assessment grading, practical assessment recording |
| `caregiver` | Course view and job applications |
| `internship_supervisor` | Internship supervision/management, incident view/manage |
| `employer` | Job management, candidate view, user view, organisation subscription and reports |
| `care_home_owner` | Full care workspace (residents, plans, staff, shifts, care records, medication, incidents, inventory, expenses, invoices), referrals, payments review, subscription management and reports |
| `care_home_manager` | Care operations except expense approval and platform billing; subscription view and reports |
| `care_staff` | Resident view, incident view/manage, shift view, care recording |
| `care_medication_staff` | Care staff permissions plus medication administration |
| `referral_partner` | No organisation permission; partner dashboard is scoped by partner ownership |
| `charity_admin` | Campaigns, donor reporting, scholarships, organisation subscription and reports; cannot approve its own campaigns |
| `donor` | Own donation history/receipts only; no organisation-wide permission |
| `finance_officer` | Payment review, refunds, referral rules/commissions/payouts, invoices, expense approval, platform billing and reports |
| `compliance_officer` | Compliance, incidents, organisation review, audit, campaign approval, scholarship review and reports |
| `family_member` | No organisation-wide permission; resident access only through an explicit `resident_relationships` row |

## Key separation-of-duty rules

- A campaign manager cannot approve the same campaign; approval needs
  `charity_campaign_approve` (compliance officer/super admin).
- Organisation owners can change plan/cycle and cancel/resume, but only
  platform billing can set status, trial/period or suspension fields.
- Payouts require finance approval; provider transfers also require explicit
  environment enablement.
- Refunds and financial adjustments are recorded as new history, never edits.
- Report exports require `report_export` and are audited.

## Adding a role or permission

1. Update `src/lib/permissions/registry.ts` (categories, keys, role mapping,
   labels, `RoleKey`).
2. Add a migration inserting the permission and role mappings.
3. Update UI gating and server guards.
4. Add/extend permission registry tests.
5. Run the RLS suite if policies change.
