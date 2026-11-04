# Database schema

The schema is forward-only. Migrations live in `supabase/migrations/` and are
applied in numeric order. Types are generated from the live project into
`src/types/database.ts`; the hand-written enum aliases at the bottom must be
preserved.

## Migration map

| Migration | Scope |
| --- | --- |
| `0001` | Core identity: profiles, organisations, memberships, roles, permissions, invitations, verifications, audit logs |
| `0002` | RLS policies |
| `0003` | Role and permission seed |
| `0004` | Invitation acceptance |
| `0005` | Membership insert tightening |
| `0006` | Notifications |
| `0007`–`0008` | Academy: programmes, courses, modules, lessons, resources, enrolments, progress, completion, certificates |
| `0009` | Employment: placement providers, listings, applications, jobs, job applications |
| `0010` | Super-admin bootstrap guard |
| `0011`–`0013` | Placement execution: placements, logs, attendance, evaluations, incidents, interviews, offers, agreement fixes |
| `0014`–`0015` | Payments, referral partners, attribution, commission ledger, payouts, reconciliation and published policy reads |
| `0016`–`0020` | Care operations: permissions, residents, staff, shifts, care plans, medication, incidents, inventory, purchases, expenses, invoices and reporting views |
| `0021`–`0024` | Charity: campaigns, reviews, donations, allocations, expenses, scholarship programmes/applications/awards, impact reports |
| `0025`–`0029` | Subscriptions, plans, lifecycle events, subscription payments, feature limits, read-only guards and immediate-cancellation correction |

## Core tenancy

- `organisations` (`care_home`, `home_care_agency`, `charity`, `training_provider`,
  `recruitment_partner`, `employer`/corporate, `platform_academy`).
- `profiles`, `organisation_memberships`, `user_role_assignments`,
  `organisation_invitations`.
- `roles`, `permissions`, `role_permissions`.
- `audit_logs`, `notifications`, `user_notification_preferences`.

## Academy

`programmes`, `courses`, `course_modules`, `lessons`, `learning_resources`,
`course_enrolments`, `lesson_progress`, `completion_records`, `certificates`.

Enrolment source: `self`, `organisation`, `scholarship`, `platform`.

## Employment and placements

`placement_providers`, `internship_listings`, `internship_applications`,
`internship_placements`, `internship_logs`, `internship_attendance`,
`internship_evaluations`, `internship_incidents`, `internship_completion_records`,
`employers`/`job_postings`, `job_applications`, `interviews`, `job_offers`,
`internship_offers`.

## Payments and referrals

`payment_transactions`, `payment_webhook_events`, `payment_refunds`,
`referral_partners`, `referral_attributions`, `referral_commission_policies`,
`referral_commissions`, `referral_commission_events`,
`referral_payout_accounts`, `referral_payout_requests`,
`referral_payout_items`, `referral_partner_balances` (view).

## Care operations

`care_facilities`, `residents`, `resident_contacts`, `resident_relationships`,
`resident_consents`, `resident_access_events`, `care_staff_profiles`,
`staff_qualifications`, `staff_training_records`, `staff_documents`,
`shift_schedules`, `shift_assignments`, `shift_attendance`, `shift_handovers`,
`care_tasks`, `care_task_records`, `care_plans`, `care_plan_versions`,
`care_plan_assignments`, `medication_records`, `medication_record_events`,
`incidents`, `incident_actions`, `suppliers`, `inventory_items`,
`inventory_movements`, `purchase_requests`, `purchase_request_items`,
`purchases`, `purchase_items`, `expense_records`, `service_invoices`,
`service_invoice_items`, `service_payments`, `service_refunds`.

Reporting views: `care_occupancy`, `care_staffing_coverage`,
`care_training_compliance`, `care_incident_summary`, `care_inventory_status`,
`care_expense_summary`, `care_invoice_ageing`.

## Charity and scholarships

`charity_campaigns`, `campaign_reviews`, `donations`, `campaign_allocations`,
`campaign_expenses`, `scholarship_programmes`, `scholarship_applications`,
`scholarship_awards`, `impact_reports`.

Reporting views: `charity_public_campaign_progress`,
`charity_public_donors`, `charity_campaign_finance`,
`charity_scholarship_outcomes`.

## Subscriptions

`subscription_plans`, `organisation_subscriptions`, `subscription_events`,
`subscription_payments`.

Helper functions: `subscription_effective_status`, `organisation_can_write`,
`organisation_has_module`, `organisation_can_add_member`,
`organisation_can_add_facility`.

## Key invariants

1. Tenant rows carry `organisation_id`; RLS joins to active memberships and
   permissions.
2. Money is integer minor units. Payments require verified provider outcomes.
3. Commission, inventory, consent, medication, invoice/payment and subscription
   payment histories are append-only or immutable-field guarded.
4. Shift assignments reject overlaps and missing verified qualifications.
5. Care plan versions are immutable; restricted plans are hidden from general
   staff.
6. Donations are created only from verified payment transactions.
7. Scholarship acceptance creates at most one scholarship enrolment.
8. Subscription module/limit/read-only guards run after organisation-scope
   triggers; suspended workspaces are read-only but records remain readable.
9. Immediate subscription cancellation is immediately effective
   (`0029_cancelled_effective_status.sql`).

## Changing the schema

1. Add a new migration; never edit an applied one.
2. Add RLS and, where relevant, guards/triggers.
3. Update `src/types/database.ts` from generated types.
4. Update registry seeds when permissions/roles change.
5. Extend `supabase/tests/rls_isolation.sql` for new isolation rules.
6. Run lint, typecheck, tests, RLS and build.
