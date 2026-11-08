# Care-home workflows

A care workspace is an organisation of type `care_home` or `home_care_agency`.
Routes live under `/dashboard/care-homes`. Access requires organisation
membership and the relevant care permission.

## Facilities and residents

1. Owner/manager creates a facility (`resident_manage`). Facility limits are
   enforced by the subscription plan.
2. Resident records are created against a facility. The organisation is derived
   from the facility and cannot be changed across tenants.
3. Contacts record emergency contacts and authorised representatives.
4. Family accounts are linked by email through `resident_relationships`. Family
   members see only linked residents; access can be revoked.
5. The family portal (`/dashboard/family`) shows basic residency information.
   `summary` links cannot read the full resident row or care tables; `full` links
   keep full resident/contact/standard-plan access. Incidents, medication, daily
   notes and billing are never shown in the family portal.
6. Consent history is append-only: withdraw or change consent by adding a new
   row.
7. Opening a resident record writes a `resident_access_events` entry. Managers
   can view the latest access events on the resident page.

## Staff

- Staff profiles require an active workspace membership.
- Qualifications, training and documents record expiry dates.
- Weekly availability is edited from the staff page (e.g. `08:00-16:00` per day);
  blank days are unavailable.
- A shift can require a qualification code. Assignment is rejected unless the
  worker has a verified, unexpired qualification with that code.
- Staff see their own records; `staff_manage` can see and edit the organisation's
  staff records.

## Shifts and handover

- Roster shows the next 14 days grouped by day.
- Shifts define start/end, required staff and optional qualification.
- Assignments reject overlapping shifts and inactive members.
- Nothing is auto-assigned.
- Attendance records clock-in/out and break minutes.
- Handover records the shift summary and outstanding tasks.
- Statuses: draft, published, completed, cancelled.

## Daily care

- Care tasks define personal care, meals/hydration, mobility, activities,
  observations, clinical or other tasks.
- Care records capture outcome, completed time, assistance, meal/hydration,
  mobility and observations.
- Records may be reviewed by a supervisor with `care_plan_manage`; review locks
  the record against further edits by the recorder.
- Record only information relevant to care delivery.

## Care plans

- Plans are versioned. Versions are immutable; changes create a new version with
  a change summary.
- Workflow: draft → pending approval → active → archived, with rejection.
- Restricted plans are visible only to `care_plan_manage`.
- HillCrest does not diagnose conditions or replace clinical judgement.

## Medication

- Administration records require `medication_manage`.
- Staff record medication name, dose as prescribed (free text), route, schedule,
  administration time, administering/witnessing staff and outcome.
- Administered records are immutable; corrections are new audited events.
- No autonomous recommendations, dose calculations or interaction checks.

## Incidents

- Categories: fall, injury, safeguarding, medication, missing person, property,
  other.
- Severity: low, medium, high, critical.
- Status: open, investigating, resolved, closed.
- A reviewer and closure notes are required before closing.
- Corrective actions track owner, due date, status and notes.
- Incident records are restricted to incident permissions; family accounts do
  not see them.
- The application does not imply that a notification guarantees emergency
  assistance. Follow the organisation's emergency procedure.

## Inventory and expenses

- Items define SKU, unit, category and reorder level.
- Balances are derived from append-only movements: opening, purchase, issue,
  adjustment, wastage, return.
- Movements cannot be edited or deleted.
- Suppliers and campaign/operational expenses are recorded separately.
- Purchase requests are created from the expenses page and reviewed by a user
  with `expense_approve`; a request is a single-line request in the current UI.
- Receiving a purchase line writes a stock movement.

## Billing

- Invoices are created as drafts with line items; totals are derived.
- Invoice numbers are allocated per organisation and month.
- Payments and refunds are append-only; overpayment/over-refund is rejected.
- Outstanding balances and ageing are exposed in reports.

## Subscription and read-only behaviour

- Care module access depends on the organisation plan.
- User/facility limits are enforced in the database.
- Suspended/expired subscriptions make the workspace read-only: writes fail, but
  resident/care records remain readable and exportable. A billing dispute must
  never hide critical care information.

## Reports

Occupancy, staffing coverage, training compliance, incidents, inventory,
expenses and outstanding invoices are available in the care workspace and the
unified reporting catalogue where permitted.
