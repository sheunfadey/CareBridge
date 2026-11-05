# Testing

## Commands

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript, strict
npm test              # Vitest unit tests
npm run build         # Production build
npm run db:test:rls   # SQL isolation/invariant checks against the linked DB
```

## Automated unit tests

Vitest lives in `tests/` and runs with `vitest.config.mts`.

| File | Covers |
| --- | --- |
| `permissions.test.ts` | Permission registry, role mappings, course-management roles and privileged roles |
| `validation.test.ts` | Core validation schemas |
| `employment-validation.test.ts` | Jobs, internships and placements |
| `payments.test.ts` | Money parsing, referral commission maths and payment schemas |
| `academy.test.ts` | Course assessments, categories, learning resource types and answer normalisation |
| `messaging.test.ts` | Conversation recipients, subjects and message length limits |
| `care.test.ts` | Care dates, residents, staff availability, shifts, incidents, inventory and invoices |
| `charity.test.ts` | Campaigns, donations, scholarships and impact reports |
| `billing.test.ts` | Subscription labels, plan changes and payment schemas |
| `email-templates.test.ts` | Email rendering |
| `admin-service.test.ts` | Admin service contracts |
| `organisation-validation.test.ts` | Organisation validation |
| `site-navigation.test.ts` | Public navigation |

Current result: **111 tests passing across 13 files**.

Unit tests do not touch the database and never fabricate financial outcomes.

## RLS and database invariants

`supabase/tests/rls_isolation.sql` seeds two tenants plus donor/family/staff
users, asserts isolation and rolls back. It covers:

- organisations, memberships, profiles, invitations and role escalation;
- Phase 6 payments, commissions, attributions and partner isolation;
- Phase 7 residents, family links, staff/medication/invoice restrictions, and
  family summary/full portal access;
- Academy assessment answer-key secrecy, attempt isolation and server grading;
- Academy course creation for organisation owners and instructors;
- Course category scope and private learning-resource access;
- Course resource upload/signing through the private storage bucket (live check);
- Direct messaging participant isolation, same-tenant recipients and
  append-only message history;
- Phase 8 campaigns, donations, scholarships and award acceptance;
- Phase 9 subscriptions, read-only states, module limits and billing guards.

Run against a disposable project or branch:

```bash
npm run db:test:rls
```

Expected output: `RLS_ISOLATION_PASS`.

## Phase smoke tests

Authenticated HTTP smoke tests were run against a production server with
disposable fixtures that were removed afterwards.

| Phase | Checks | Result |
| --- | --- | --- |
| Phase 6 | 15 | Partner dashboard, payments, reconciliation and permissions |
| Phase 7 | 23 | Care workspace, residents, staff, roster, care, incidents, stock, invoices |
| Phase 8 | 16 | Charity campaigns, donations, scholarships, receipts, public pages |
| Phase 9 | 8 | Role dashboard, billing, reports, CSV export, platform subscriptions |
| Phase 10 | 61 | All public pages and authenticated admin/learner routes |

Phase 9 also verified that a suspended subscription shows the read-only banner
while care data remains readable, and that CSV export writes a
`report.exported` audit record.

## Manual smoke checklist

1. Register, confirm email (or use a confirmed test account), sign in.
2. Complete onboarding and open the dashboard.
3. As an organisation owner, invite a member; the invitation respects the plan
   user limit.
4. Open the organisation billing page; confirm plan, trial status and usage.
5. Export a report as a user with `report_export`; verify the CSV and audit row.
6. Create a care facility and resident; add a contact and consent; record care.
7. Create a shift and assign a qualified staff member; verify overlap and
   qualification rejection.
8. Report an incident and add a corrective action.
9. Create a charity campaign, submit for approval, approve as a reviewer.
10. Donate through the public campaign page (requires Paystack credentials).
11. Apply for a scholarship, review it, award it, accept it as the learner and
    verify scholarship course access.
12. Suspend a test subscription and confirm writes are blocked but reads and
    exports still work.
13. POST to the Paystack webhook without a signature; expect 401.
14. Check `/api/health` returns `status: ok`.
15. Confirm no test users or fixture rows remain.

## Test data hygiene

- Use a disposable project, branch or local Supabase instance.
- Never run the RLS test against production.
- Fixtures must be tagged and removed after the run.
- The RLS script wraps fixtures in a transaction and rolls back.
- Disabling append-only triggers for cleanup is not permitted; re-enable any
  trigger immediately if a maintenance script must disable it.

## Not covered automatically

- Browser-based end-to-end tests (Playwright is not configured).
- Visual regression and accessibility automation.
- Live Paystack checkout, webhooks, refunds and transfers (credentials pending).
- Email delivery through Resend.
- File uploads (not implemented).

`docs/KNOWN_LIMITATIONS.md` tracks the current gaps.
