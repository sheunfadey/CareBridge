# Known Limitations

This document tracks features that are incomplete, disabled, or awaiting
external configuration. It is updated as each phase lands.

## Current state: Phases 2-7 implemented (Phase 7 core modules); Phase 8 not started

### Implemented and verified

- **Supabase project** `teejjgzkvvgmsvtblncr` is active and healthy. Migrations
  `0001`-`0020` are applied and in sync. The earlier project
  (`ggizvtzlhdciykfmdsjl`) was deleted; this project replaces it.
- **Identity & multi-tenancy schema**: `profiles`, `organisations`,
  `organisation_memberships`, `roles`, `permissions`, `role_permissions`,
  `user_role_assignments`, `organisation_invitations`,
  `organisation_verifications`, `user_consents`,
  `user_notification_preferences`, `audit_logs`, notifications.
- **Row Level Security** on every tenant-owned table, with helper functions
  `has_permission`, `is_super_admin`, `current_organisation_ids`, `is_org_member`.
- **Auth flows**: register, email verification callback, login, logout, forgot
  password, reset password, and post-signup onboarding.
- **Organisations**: create, invite members, revoke invitations, assign roles,
  remove members, accept invitations (via the SECURITY DEFINER
  `accept_invitation` RPC).
- **Audit logging** (`src/server/audit/record-audit.ts`).
- **Email abstraction** (`src/lib/email/*`): branded templates, a Resend HTTP
  provider and a console fallback.
- **Platform administration** (`src/server/admin/*`, `/dashboard/admin`):
  super-admin-only, uses the service-role client when available and reports the
  capability as unavailable otherwise.
- **Academy (Phase 4)**: programmes, courses, modules, lessons, enrolments,
  progress, certificates, provider management and public certificate
  verification.
- **Internships (Phase 5)**: placement providers, listings, applications,
  provider review, placements, supervision, weekly logbooks, attendance,
  evaluations, incidents, completion records and agreement acceptance.
- **Employment (Phase 5)**: job postings with draft/publish/close lifecycle,
  applications, applicant review, withdrawal, interviews and offers.
- **Payments (Phase 6, complete; live provider pending credentials)**: Paystack
  provider abstraction, server-side verification, signature-checked and
  idempotent webhooks, paid course checkout, refunds, finance payment review and
  reconciliation pages.
- **Referrals (Phase 6, complete)**: partner applications, published commission
  policies, `/r/[code]` attribution, immutable commission ledger, payout
  requests, finance approval, beneficiary verification and a guarded transfer
  workflow.
- **Care-home operations (Phase 7, core modules)**: facilities, residents,
  contacts, consents and family links; staff qualifications, training and
  document expiry; rosters with overlap and qualification guards; daily care and
  supervisor review; versioned care plans with approval; medication
  administration; incidents and corrective actions; inventory with append-only
  movements; expenses; invoices, payments and refunds; operational reports.
- **Notifications**: in-app notification centre and unread counts.
- **Test runner** (Vitest): `npm test` runs unit tests for the permission
  registry, validation schemas, money and commission calculations, email
  templates, admin-service contracts, navigation and care validation.
- **Cross-tenant isolation test** (`supabase/tests/rls_isolation.sql`) - passes
  against the live database for migrations `0001`-`0020`, including care
  resident, medication, invoice and family-link isolation.

### Not yet implemented or not yet verified

- **No provider credentials are configured.** Paystack checkout, refunds and
  transfers have not been exercised end-to-end against sandbox or live. Add
  `PAYSTACK_SECRET_KEY` (and `PAYSTACK_WEBHOOK_SECRET`) to enable checkout.
- **Provider transfers are disabled by default.** Even with a key, payouts can
  only be sent when `PAYSTACK_TRANSFERS_ENABLED=true`; the business must approve
  the arrangement first.
- **No webhook is registered with Paystack** for this deployment. Until it is,
  successful payments rely on the server-side verification on callback/refresh.
- **Email delivery is not enabled.** `EMAIL_PROVIDER` defaults to `console`, so
  emails are logged, not delivered. Set `EMAIL_PROVIDER=resend` plus
  `EMAIL_PROVIDER_API_KEY` and a verified `EMAIL_FROM_ADDRESS` to deliver.
- **Candidate profiles / CVs**: applications capture a cover letter only; there
  is no structured candidate profile or document upload.
- **No file uploads / storage buckets.**
- **No end-to-end browser tests.** Unit tests (Vitest) and the SQL RLS isolation
  test exist; Playwright is not yet set up. Phase 6 and Phase 7 pages have been
  driven with seeded fixtures over authenticated HTTP requests, but not in an
  automated browser session.
- **Phase 7 remaining polish**:
  - no dedicated family/resident portal; family accounts are linked per resident
    but cannot yet sign in to view a summary;
  - purchase requests can be created/reviewed through server actions but have no
    dedicated UI page;
  - staff availability is stored as JSON but has no editor;
  - resident access history is recorded but not displayed in the UI;
  - shift reminders and incident escalation notifications are not wired to a
    delivery provider;
  - shift calendars are rendered as a 14-day grouped list rather than a monthly
    grid.
- **Charity and analytics** modules are not built. Their dashboard routes show
  an honest "planned" placeholder, never fabricated data.
- **Profile editing and notification preferences** are not implemented; the
  settings pages are read-only or marked as planned.
- **Dashboard top-bar search** is not wired to a search backend.

### Intentional behaviour

- `/dashboard` and `/onboarding` require an authenticated session; middleware
  redirects unauthenticated visitors to `/login`.
- Privileged roles (`super_admin`, `platform_support`, `finance_officer`,
  `compliance_officer`) can only be granted through direct platform
  administration - never through an organisation invite or self-service.
- A user can never assign themselves a role or escalate `is_super_admin`; both
  are blocked by RLS `WITH CHECK` clauses and a database trigger. Trusted
  server-side connections without an auth session (SQL editor, service role,
  migrations) may bootstrap the first super admin; this is enforced by
  `0010_super_admin_bootstrap.sql`.
- Job and internship applications are readable only by the applicant and by
  staff of the owning organisation; RLS enforces this. Published jobs are
  readable by any visitor, and any signed-in visitor may apply; draft postings
  are visible only to that organisation's managers.
- A payment is only successful after server-side provider verification. A
  browser redirect alone never grants access or enrolment.
- Commission rates are never invented. No commission is created unless an
  active policy covers the payment purpose.
- Commission ledger rows are immutable; status changes follow database-guarded
  transitions and are recorded as events.
- Self-referral is rejected in the database. Payouts require a verified
  beneficiary account and a finance-approved request.
- Provider transfers are off unless explicitly enabled in the environment.


### External dependencies pending

| Integration | Blocked on |
| ----------- | ---------- |
| Email provider | API key + verified sender domain |
| SMS provider | Provider account (later phase) |
| Paystack checkout | Secret key + registered webhook URL and secret |
| Paystack transfers | Business approval + `PAYSTACK_TRANSFERS_ENABLED=true` |
| Error monitoring | DSN (optional) |

## Verification status

- `npm run lint` - clean
- `npm run typecheck` - clean
- `npm test` - 70 unit tests pass (9 files)
- `npm run build` - succeeds (production build)
- Unauthenticated smoke test - `/`, `/login`, `/register`, `/forgot-password`,
  `/reset-password`, `/verify-email` return HTTP 200; `/dashboard` returns 307 to
  `/login?redirectTo=%2Fdashboard` when unauthenticated.
- Authenticated Phase 6 smoke test (production server, disposable fixtures,
  removed afterwards) - 15/15 route and permission checks passed; partner
  balances, commission ledger, payout history, payment filters and
  reconciliation rendered seeded data.
- Authenticated Phase 7 smoke test (production server, disposable fixtures,
  removed afterwards) - 23/23 route and permission checks passed across the
  workspace, residents, staff, roster, plans, daily care, medication, incidents,
  inventory, expenses, invoices and reports. Care staff were denied billing,
  staff management and reports; family accounts were denied the staff workspace.
- `npm run db:test:rls` - cross-tenant isolation assertions hold for the applied
  schema through migration `0020`, including Phase 6 payment/commission and
  Phase 7 resident, medication, invoice and family-link isolation.
- Phase 7 SQL - migrations `0016`-`0020` apply cleanly, and 34 RLS/invariant
  assertions pass against both an embedded PostgreSQL instance and the live
  project.

No feature in later phases is claimed as complete.
