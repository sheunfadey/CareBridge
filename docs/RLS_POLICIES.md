# RLS policies

RLS is enabled on every tenant-owned table. It is the authoritative access
control; server-side guards and UI gating are additional layers.

## Helper functions

- `is_super_admin()` — reads `profiles.is_super_admin` for `auth.uid()`.
- `is_org_member(org)` — active membership.
- `has_permission(permission, org)` — permission from platform-wide or
  organisation-scoped role assignments.
- `current_organisation_ids()` — active organisations for the caller.
- `can_access_resident(resident, permission)` — staff permission or an explicit,
  unrevoked family relationship.
- `subscription_effective_status(org)`, `organisation_can_write(org)`,
  `organisation_has_module(org, module)`, `organisation_can_add_member(org)`,
  `organisation_can_add_facility(org)` — subscription/feature limits.

## Tenant isolation

- Rows are scoped by `organisation_id`; select policies require membership or a
  relevant organisation-scoped permission.
- Writes require the specific permission and, for organisation-owned rows, the
  row's organisation.
- Cross-tenant reads fail even when a row id is known.
- Super administrators bypass tenant checks only through `is_super_admin()`.

## Personal and sensitive data

- Residents: staff with `resident_view` see their organisation; family members
  only where `resident_relationships` links them and is not revoked.
- Care plans: restricted plans require `care_plan_manage`; standard plans are
  visible to `resident_view` staff.
- Medication: `medication_manage` only.
- Incidents: `incident_view`/`incident_manage` only.
- Staff records: `staff_manage` or the staff member themselves.
- Invoices: `invoice_view`/`invoice_manage` or finance permissions.
- Scholarship applications: applicant or scholarship reviewers/managers.
- Donations: donor or charity staff with donor reporting/campaign management.
- Subscriptions: `subscription_view`/`subscription_manage` or platform
  `billing_manage`.

## Public read policies

- Approved public charity campaigns (`is_public = true`, status `approved`).
- Open public scholarship programmes.
- Published impact reports.
- Public campaign aggregates and opted-in donor acknowledgements are exposed
  through security-definer views that never reveal donor contact details.

## Append-only and immutable records

Triggers protect:

- referral commission ledger fields and status transitions;
- payment refunds, inventory movements, purchase lines, campaign allocations and
  campaign expenses;
- resident consents and medication records;
- care plan versions;
- service payments/refunds;
- subscription payments.

Corrections are new records, not edits.

## Read-only subscriptions

When a subscription is past due, suspended or expired:

- writes to primary academy, employment, care and charity tables are rejected by
  `guard_subscription_writable`;
- reads and CSV exports remain available;
- the UI shows a read-only banner and links to billing.

## Service role

The service-role key bypasses RLS and is used only for trusted operations after a
permission check, such as applying verified payments, platform billing queries,
email lookups and applicant profile display. It is never shipped to the browser.

## Testing

`supabase/tests/rls_isolation.sql` creates two tenants plus donor/family/staff
users and asserts:

- cross-tenant reads/writes fail;
- self-referral, self-approval and financial fabrication fail;
- family members see only linked residents;
- staff cannot read medication/invoices or create residents;
- scholarship applicants cannot change awards or approve themselves;
- subscriptions are private, owners cannot change status/periods, suspended
  workspaces are read-only, and module limits are enforced.

Run `npm run db:test:rls` and expect `RLS_ISOLATION_PASS`.

## Changing policies

1. New tables: enable RLS and add explicit select/insert/update/delete policies.
2. Prefer `has_permission(..., organisation_id)` over client-supplied roles.
3. Add fixtures/assertions to the RLS test.
4. Never weaken a policy without a documented reason and a regression test.
