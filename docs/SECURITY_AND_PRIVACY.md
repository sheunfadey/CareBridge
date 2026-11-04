# Security and privacy

## Authentication

- Supabase Auth handles registration, email confirmation, login, logout and
  password reset.
- Sessions use `@supabase/ssr` cookies and are refreshed by middleware.
- Privileged roles (`super_admin`, `platform_support`, `finance_officer`,
  `compliance_officer`) cannot be granted through organisation invitations or
  self-service.
- A user cannot assign themselves a role or set `is_super_admin`; RLS and a
  database trigger block escalation.
- The first super admin is bootstrapped only through a trusted database
  connection (`0010_super_admin_bootstrap.sql`).

## Authorisation

Three layers must agree:

1. **Database RLS** is authoritative. Every tenant-owned table is organisation
   scoped and uses `has_permission`, `is_org_member` or record ownership.
2. **Server actions and route handlers** call permission guards before writing
   and use the request-scoped Supabase client, so RLS still applies.
3. **UI gating** hides unavailable actions but is never the only control.

Permissions are defined once in `src/lib/permissions/registry.ts` and mirrored
in the database seed/migrations. Subscription module and limit guards are
enforced by database triggers.

## Sensitive data

| Data | Protection |
| --- | --- |
| Resident records and contacts | `resident_view`/`resident_manage`; family members only via an unrevoked `resident_relationships` row |
| Care plans | Restricted plans only visible to `care_plan_manage`; standard plans to staff with `resident_view` |
| Medication | `medication_manage`; administered rows immutable; status changes audited |
| Incidents | `incident_view`/`incident_manage`; family accounts excluded |
| Invoices and payments | `invoice_view`/`invoice_manage` or finance permissions; donors see only their own donations |
| Scholarship applications | Applicant and scholarship reviewers only |
| Subscription billing | `subscription_view`/`subscription_manage`; platform status/period changes only by `billing_manage` |
| Staff documents | `staff_manage` or the staff member themselves |

Resident record views are written to `resident_access_events` through a
security-definer RPC after the caller's access is checked.

## Financial integrity

- Money is stored as integer minor units; floating point is never used.
- Payments only become successful after server-side provider verification.
- Webhooks verify the HMAC signature and are idempotent by provider event id.
- Commission, inventory, consent, medication and invoice/payment histories are
  append-only or guarded by immutable-field triggers.
- Subscription payments are a separate append-only ledger from training,
  donations and referral payouts.
- Refunds and reversals are new records, not edits to prior history.

## Audit logging

`audit_logs` records privileged and financial actions, including:

- organisation/member/role changes;
- payment verification/refunds and referral decisions;
- care, charity and scholarship actions;
- plan changes, subscription status changes and payment recording;
- report exports (`report.exported`) with report key, filters, row count and
  timestamp.

Audit writes must not break a user flow; failures are logged server-side.

## Secrets

- Only `NEXT_PUBLIC_*` variables reach the browser.
- `SUPABASE_SERVICE_ROLE_KEY` and Paystack secrets are server-only.
- The service-role client is used only for trusted operations after permission
  checks (payment application, platform admin queries, email lookup and
  applicant profile display).
- Rotate compromised keys immediately and redeploy. Never commit `.env.local`.

## Data minimisation and exports

- Resident records collect only care-relevant information.
- Reports avoid resident names in aggregates.
- CSV exports require `report_export`, are capped at 5,000 rows and are audited.
- Public campaign pages expose only opted-in display names and amounts, never
  donor contact details.
- Employment outcomes are only reported when marked shareable.

## Transport and browser protections

- HTTPS/HSTS in production.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and
  `Permissions-Policy` are set in `next.config.ts`.
- Cookies are HTTP-only via Supabase SSR defaults.
- No third-party analytics scripts are embedded.

## Incident response

1. Contain: revoke keys, disable affected accounts, restrict the deployment.
2. Assess: scope, data categories, tenant impact, whether financial records were
   altered.
3. Preserve evidence: audit logs, provider payloads, database snapshots.
4. Notify: follow applicable legal/regulatory and contractual obligations; do not
   claim approval or certification without evidence.
5. Recover: restore from backup if integrity is in doubt, rotate secrets and
   verify RLS tests.
6. Review: add a regression test and update this document.

## Privacy requests

Support access, correction and deletion requests through a documented process.
Prefer deactivation/retention rules over hard deletion where care or financial
records must be retained. Do not delete financial history to satisfy a request
without legal review.
