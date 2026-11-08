# Phase 7 — Care-home operations: schema outline

Source: `HillCrest_Plan.txt` §14 (care home and home-care operations) and §35
(data model). This document fixes the tenancy model, invariants and table shape
before the migrations are written.

## Tenancy model

- A care workspace is an existing `organisations` row of type `care_home` or
  `home_care_agency` (created through onboarding, already supported).
- `care_facilities` sits under an organisation. One organisation may operate
  several facilities (a home-care agency may use a single "service base").
  Every operational row carries **both** `organisation_id` and, where relevant,
  `facility_id`, so RLS never needs a join to resolve the tenant.
- Staff are existing organisation members with a `care_staff_profiles` row and
  org-scoped role assignments. No new identity model.
- Family access is **explicit**: `resident_relationships` links an auth user to a
  resident. `family_member` holders only see residents they are linked to; they
  never see incidents, medication, billing or other residents.

## Modules and tables

### A. Facilities, residents, consents
- `care_facilities` — organisation, name, address, city/state, phone/email,
  capacity, status (`active|inactive`), created_by.
- `residents` — facility/org, internal reference, names, DOB, gender, room,
  admission/discharge dates, status (`active|on_leave|discharged|deceased`),
  care level, mobility, dietary, communication and accessibility needs,
  care requirements, GP/medical notes (free text, no diagnosis).
- `resident_contacts` — emergency contacts and authorised representatives
  (name, relationship, phone, email, priority, flags, notes).
- `resident_relationships` — portal access for family members (user, resident,
  relationship, access level `summary|full`, invited/revoked timestamps).
- `resident_consents` — consent type, granted/withdrawn, effective/expiry dates,
  granted_by, evidence reference, notes. Append-only history (withdraw creates a
  new row rather than overwriting).
- `resident_access_events` — append-only view log written when a staff member
  opens a resident record (actor, resident, action, timestamp).

### B. Staff
- `care_staff_profiles` — organisation, user, job title, employment status
  (`active|on_leave|suspended|ended`), start/end dates, weekly availability
  (jsonb), notes.
- `staff_qualifications` — staff profile, qualification code/name, awarded date,
  expiry date, verification status, evidence reference.
- `staff_training_records` — staff profile, training title, completed/expiry
  dates, evidence reference.
- `staff_documents` — staff profile, document type, expiry date, status, file
  reference. Expiry drives compliance reporting.

### C. Shifts
- `shift_schedules` — facility, title, starts_at/ends_at, required staff count,
  optional required qualification, notes, status
  (`draft|published|completed|cancelled`).
- `shift_assignments` — shift, staff user, status
  (`assigned|confirmed|declined|absent|completed|cancelled`), assigned_by.
  A database guard rejects: inactive membership, overlapping shifts for the same
  worker, and assignment when the shift's required qualification is missing or
  expired. Nothing is auto-assigned.
- `shift_attendance` — assignment, clock in/out, break minutes, source, notes,
  recorded_by.
- `shift_handovers` — shift, facility, summary, outstanding tasks, submitted_by,
  accepted_by/at.

### D. Daily care records
- `care_tasks` — care plan, resident, title, category (personal care, meals,
  mobility, activities, observation, clinical task), instructions, schedule
  times, requires two staff, required qualification.
- `care_task_records` — task, resident, shift, recorded_by, status
  (`completed|refused|not_done|deferred`), completed_at, assistance notes,
  meal/hydration amounts, mobility notes, observations, supervisor review
  (reviewed_by/at, notes, outcome). Only care-relevant fields.

### E. Care plans
- `care_plans` — resident, title, summary, access level
  (`standard|restricted`), status (`draft|pending_approval|active|archived`),
  current version, review due, approved_by/at, archived_at.
- `care_plan_versions` — append-only: plan, version number, structured content
  (jsonb: needs, goals, responsibilities, risks, review cadence), change summary,
  created_by/at, approved_by/at. Updates to an existing version are blocked.
- `care_plan_assignments` — plan/version, staff user, responsibility, due date.

### F. Medication (administration records only)
- `medication_records` — resident, facility, medication name as prescribed,
  dose text (free text), route, scheduled_at, administered_at,
  administered_by, witnessed_by, status
  (`scheduled|administered|refused|held|omitted`), reason, notes.
- No dose calculation, recommendation or interaction logic. Values are entered
  by authorised staff. Core fields are immutable once `administered`; a status
  change is recorded in `medication_record_events` (from/to, actor, reason).
- Requires `medication_manage`; `care_staff` only receives it when granted per
  organisation (not by default in the UI, but seeded as an explicit grant).

### G. Incidents
- `incidents` — facility, optional resident, category (fall, injury,
  safeguarding, medication, missing_person, property, other), severity
  (`low|medium|high|critical`), occurred_at, reported_by, description,
  immediate action, status (`open|investigating|resolved|closed`, reusing the
  Phase 5 incident vocabulary),
  assigned reviewer, closure notes, safeguarding flag, external reference.
- `incident_actions` — corrective action, owner, due_at, status, completed_at,
  notes.
- Restricted to `incident_view` / `incident_manage`; family members and general
  staff without the permission never read incidents. Escalation contact details
  live in `organisations.settings` and the UI states that notifications do not
  guarantee emergency response.

### H. Inventory
- `inventory_items` — facility, sku, name, category, unit, reorder level,
  `current_quantity` (cache only), status.
- `inventory_movements` — append-only, item, movement type
  (`opening|purchase|issue|adjustment|wastage|return`), quantity delta,
  reference, reason, recorded_by. A trigger applies the delta to
  `inventory_items.current_quantity`; direct edits to the cached quantity are
  rejected. Movements cannot be updated or deleted.
- `suppliers` — organisation-level supplier records.

### I. Purchases and expenses
- `purchase_requests` + `purchase_request_items` — draft → submitted → approved /
  rejected → ordered → received / cancelled. Approval requires
  `expense_approve`.
- `purchases` + `purchase_items` — received purchases linked to supplier and
  optional request; receiving stock writes inventory movements.
- `expense_records` — category, supplier/purchase link, amount (minor units),
  incurred_on, payment status, method, receipt reference.

### J. Billing
- `service_invoices` — facility, optional resident, payer name/contact, invoice
  number (`INV-YYYYMM-####` per organisation), issue/due dates, status
  (`draft|issued|partially_paid|paid|overdue|void`), subtotal/total/paid,
  currency, notes.
- `service_invoice_items` — description, quantity, unit price, amount.
- `service_payments` — invoice, amount, paid_at, method, reference, receipt,
  recorded_by.
- `service_refunds` — payment, amount, reason, refunded_at, recorded_by.
- Totals and outstanding balances are derived by the database, not typed in.

## Money and numbering

- All money is `bigint` minor units (kobo), currency defaults to `NGN`.
- Amounts must be `> 0`; refunds cannot exceed the payment; payments cannot
  exceed the invoice total.
- Invoice numbers are allocated by a trigger from a per-organisation sequence
  table, not by the client.

## Permissions added in this phase

`shift_view`, `shift_manage`, `care_record_manage`, `medication_manage`,
`staff_manage`, `inventory_view`, `inventory_manage`, `expense_manage`,
`expense_approve`, `invoice_view`, `invoice_manage`, `care_report_view`.

Role mapping:
- `care_home_owner` — everything in the phase, including approvals.
- `care_home_manager` — all operational permissions except expense approval and
  destructive facility changes.
- `care_staff` — `shift_view`, `care_record_manage`, `resident_view`,
  `incident_view`/`incident_manage`. Medication is **not** granted by default.
- `care_medication_staff` — a new least-privilege role for senior staff who are
  authorised to record medication administration. The organisation decides who
  receives it.
- `family_member` — no organisation-wide permission. Access is granted only
  through `resident_relationships` (see the security correction below).
- `finance_officer` — `invoice_view`, `expense_approve`, `care_report_view`
  (cross-tenant reporting remains RLS-scoped).
- `compliance_officer` — `incident_view`, `care_report_view`, `compliance_view`.

### Security correction carried by this phase

`family_member` previously held `resident_view`, which is organisation-wide and
would have exposed every resident to any linked family account. Migration
`0016` removes that mapping. Family access is now resolved exclusively through an
unrevoked `resident_relationships` row inside `can_access_resident()`.

## Invariants enforced in the database

1. Every operational row is organisation-scoped; RLS checks
   `has_permission(permission, organisation_id)` and, for personal data, an
   explicit facility/resident relationship.
2. Residents cannot be moved between organisations; facility changes are audited.
3. A staff assignment cannot overlap another active assignment and must satisfy
   the shift's required qualification.
4. Care plan versions are immutable; only status transitions are allowed on the
   plan header.
5. Inventory quantity changes only through movement rows; movements are
   append-only.
6. Medication administration cannot be edited after the fact; corrections are
   new event rows.
7. Incident closure requires closure notes and a reviewer.
8. Invoice payment/refund totals cannot exceed the invoice or payment.
9. Billing, expenses and inventory movements are append-only financial history.
10. Sensitive records (incidents, medication, restricted care plans, billing)
    are hidden from `resident_view`-only users.

## Reporting views

`care_occupancy`, `care_staffing_coverage`, `care_training_compliance`,
`care_incident_summary`, `care_inventory_status`, `care_expense_summary`,
`care_invoice_ageing`, `care_outstanding_balances`. Each is
`security_invoker = true` so the caller's RLS applies, and each aggregates only
counts/amounts — never resident names — for viewers without resident permission.

## Implementation slices

1. **0016** — care permissions, `care_medication_staff`, role mappings and the
   `family_member` access correction.
2. **0017** — facilities, residents, contacts, relationships, consents and access
   history.
3. **0018** — staff, qualifications, training, documents, shifts, attendance,
   handovers, daily care tasks/records and care plans/versions/assignments.
4. **0019** — medication records/events, incidents/actions, suppliers, inventory
   items/movements, purchase requests/purchases and expenses.
5. **0020** — service invoices/items/payments/refunds, invoice numbering and the
   reporting views.
6. **Backend + UI** — server queries/actions per module, care-home workspace
   routes, resident record, rosters, care recording, incident register,
   inventory, expenses, invoices and reports.
7. **Verification** — unit tests, RLS isolation fixtures, lint/typecheck/test/
   build, authenticated smoke test with disposable data.

**Status:** migrations `0016`-`0020` are applied to the live Supabase project,
the RLS isolation suite covers the Phase 7 tables, and the core care workspace UI
is implemented (workspace overview, residents, staff, roster, daily care, care
plans, medication, incidents, inventory, expenses, invoices and reports). The
remaining polish items are tracked in `docs/KNOWN_LIMITATIONS.md` (family portal,
purchase-request UI, availability editor, access-history UI, delivery-backed
notifications and a calendar grid). The SQL was additionally exercised against
an embedded PostgreSQL instance with 34 RLS/invariant assertions before it was
applied to the live project.
