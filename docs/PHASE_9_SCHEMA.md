# Phase 9 — Analytics, reporting and subscriptions

Source: `CareBridge_Plan.txt` §20 (analytics and reporting) and §26 (billing and
SaaS subscriptions).

## Subscription model

- `subscription_plans` — configurable plans: code, name, description, monthly and
  annual price (nullable until configured), currency, permitted modules, user and
  facility limits, storage allowance, usage limits JSON, trial and grace days.
- `organisation_subscriptions` — one per organisation: plan, billing cycle,
  status, trial end, current period, cancellation, grace/suspension dates.
- `subscription_events` — append-only lifecycle history (created, trial, plan
  changed, renewed, past due, grace, suspended, reactivated, cancelled, expired).
- `subscription_payments` — append-only billing ledger, separate from training,
  donations and payouts.

Default plans: Starter (academy, employment, referrals), Professional (adds care),
Enterprise (adds charity). New organisations receive a trial on the plan matching
their type; existing organisations are backfilled as active legacy subscriptions.

Statuses: `trialing`, `active`, `past_due`, `grace`, `suspended`, `cancelled`,
`expired`. Effective status also accounts for trial/period end and cancellation.

## Feature limits

`organisation_can_write`, `organisation_has_module`,
`organisation_can_add_member` and `organisation_can_add_facility` are
security-definer functions used by triggers on primary write tables.

- Member limits count active/invited memberships plus pending invitations.
- Facility limits count care facilities.
- Module guards reject writes to modules not included in the plan.
- Read-only guards reject writes when the subscription is past due, suspended or
  expired. Reads and exports remain available so a billing dispute cannot hide
  critical resident records.

Organisation owners may change plan/cycle and cancel/resume. Only platform
billing staff may change status, trial/period dates, grace or suspension fields.

## Reporting

`src/server/reports/registry.ts` defines 16 reports across academy, employment,
referrals/finance, charity and care operations. Each report has columns, a
description and a server-side query. Filters: date range and organisation.

CSV export route: `GET /api/reports/[report]/export`.

- Requires `report_export` and an authenticated session.
- Row limit 5,000; the page shows 50 rows.
- Writes a `report.exported` audit entry with report key, filters, row count and
  timestamp.
- No PII beyond what the report needs; resident names are not included in
  aggregate care reports.

## Permissions

`subscription_view`, `subscription_manage`, `billing_manage`, `report_view`,
`report_export`.

- Organisation owners/admins receive subscription management and reporting.
- Managers receive view/report access.
- Finance officers receive platform `billing_manage`, subscription view and
  reporting.
- Compliance officers receive reporting; platform support receives subscription
  view.

## Dashboards

`/dashboard` resolves live snapshots by role: care, charity, referral partner,
employer, academy learner/manager and finance. It shows read-only/trial warnings
and the user's organisations, with no fabricated metrics.

## Remaining polish

Manual subscription payment recording (no Paystack subscription checkout or
dunning), unmetered storage usage, no scheduled report delivery, assessment
performance unavailable (no assessment tables), and a few secondary tables rely
on RLS/action checks rather than subscription triggers. See
`docs/KNOWN_LIMITATIONS.md`.
