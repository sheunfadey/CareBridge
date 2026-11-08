# HillCrest Architecture

## Overview

HillCrest is a multi-tenant SaaS platform built on Next.js App Router with a
Supabase (PostgreSQL) backend. The architecture separates UI, business services,
data access and integration adapters so that each layer can evolve and be tested
independently.

## Layers

```
src/
  app/          Route groups, layouts, pages, server actions, API routes
  components/   Presentational + interactive components
    brand/        Logo and animated logo
    layout/       Sidebar, topbar, page header, dashboard shell
    dashboard/    Metric/stat/status/chart/action cards
    feedback/     Loading, empty, error states
    ui/           shadcn/ui primitives (design system base)
  config/       Brand tokens, navigation, feature configuration
  features/     (Phase 2+) domain feature modules (auth, academy, ...)
  lib/          (Phase 2+) supabase clients, validation, permissions, utils
  server/       (Phase 2+) services, repositories, jobs, integrations, policies
  types/        (Phase 2+) shared domain types
```

## Rendering strategy

- **Server Components by default.** Data fetching and privileged operations run
  on the server.
- **Client Components only where interaction requires it** (`"use client"`).
  Functions (including Lucide icon components) must not be passed from a Server
  Component into a Client Component — render them inside the client boundary.
- Loading is expressed with Next.js `loading.tsx` route segments and the
  `feedback/` components.

## Design system

Single source of truth for visual tokens:

- `src/app/globals.css` — CSS variables for light/dark themes, exposed as
  Tailwind `@theme` tokens (including `--color-brand-*`).
- `src/config/brand.ts` — typed brand metadata (name, tagline, palette, locale,
  currency, time zone).

Components never hard-code brand colours; they use `brand-*` tokens. This makes
a future rebrand or white-label possible without touching component code.

See [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) for the full token and component
inventory.

## Backend (Phase 2 — implemented)

- Supabase Auth is the identity source. Application tables never store
  passwords. On signup, a database trigger (`handle_new_user`) creates a matching
  `profiles` row and default notification preferences.
- Every tenant-owned table has explicit Row Level Security policies. Authorisation
  that the UI cannot be trusted for is enforced in the database, using
  `has_permission(permission, organisation_id)` and `current_organisation_ids()`.
- A central permission registry (`src/lib/permissions/registry.ts`) mirrors the
  seeded roles/permissions and drives UI gating; the server-side service
  (`src/server/auth/current-user.ts`, `src/server/auth/guards.ts`) enforces it
  again for privileged operations.
- Invitation acceptance runs in the SECURITY DEFINER function
  `accept_invitation(token)`, which validates the token, expiry and email before
  creating the membership and role assignment atomically. Direct membership
  inserts are restricted to super admins and users with `user_invite`.
- Multi-step financial operations use database transactions, unique constraints
  and idempotency keys; financial history is append-only (reversals, never
  mutations).

### Data access boundaries

```
Client Component  →  Server Action / Route Handler  →  request-scoped Supabase
                      (assertPermission + RLS)          client (anon key, user JWT)
                                                   ↘  service-role client only
                                                      after provider verification
```

The service-role key is never shipped to the browser. It is used only by the
server-side payment service to apply verified provider outcomes through
service-role-only database functions; RLS still protects every user-facing read
and write.

### Payments and referral ledger (Phase 6)

- **Provider abstraction** (`src/lib/payments/*`). Paystack is the only adapter;
  the rest of the application depends on `PaymentProvider`, not on Paystack
  types. A missing secret key makes the provider report `configured: false`
  rather than failing silently.
- **Checkout** (`src/server/payments/service.ts`). The server creates a payment
  transaction in `initiated`, calls the provider, stores the provider reference
  and returns the hosted checkout URL. The browser is never trusted to mark a
  payment successful.
- **Verification**. The callback route and the `verify` server action call the
  provider, compare amount and currency, then invoke the service-role-only
  `apply_payment_success` RPC. That RPC records the payment, grants paid-course
  enrolment and creates a pending commission only when an active policy covers
  the payment purpose.
- **Webhooks**. `POST /api/payments/webhook/paystack` reads the raw body,
  verifies the HMAC signature, stores the event with a unique provider event id
  and processes it idempotently. Transfer and refund events update ledger state
  through guarded RPCs.
- **Refunds**. A refund is recorded as `requested`, sent to the provider, then
  confirmed through `apply_payment_refund`. The transaction's refunded amount and
  commission reversal are written as new ledger entries; existing rows are never
  edited or deleted.
- **Referral attribution**. `/r/[code]` calls `attribute_referral`, which rejects
  self-referral and duplicate attribution, and applies the published attribution
  window. Attribution is stored once per customer.
- **Commission policies**. Admins publish policies (percentage or fixed amount,
  eligible purposes, attribution window, payout delay, minimum payout). Policies
  are data, not hard-coded rates; partner dashboards can read the currently
  published policy, while drafts and expired policies remain finance-only.
- **Commission ledger**. `referral_commissions` is append-only: a trigger rejects
  changes to amounts, partner, basis and timestamps. A second trigger allows only
  documented status transitions and records every change in
  `referral_commission_events`.
- **Payouts**. A partner requests a payout through `request_referral_payout`,
  which requires an approved partner, verified beneficiary details, approved
  commissions and the policy minimum. Finance approves or rejects; approval does
  not move money. `attemptPayoutTransfer` performs the provider transfer only when
  `PAYSTACK_TRANSFERS_ENABLED=true`, reuses the transfer reference and verifies an
  ambiguous outcome before retrying.

### Care-home operations (Phase 7)

- **Workspace model** (`src/server/care/access.ts`). A care workspace is an
  existing organisation of type `care_home` or `home_care_agency`. Facilities,
  residents, staff, shifts, stock and invoices all carry `organisation_id`, and
  every permission check is delegated to the database `has_permission` function
  with the organisation id. Super administrators can see every care workspace.
- **Resident privacy**. `can_access_resident()` is the single RLS helper for
  resident-scoped tables. Staff with `resident_view` see their organisation's
  residents; family accounts only see an explicit, unrevoked
  `resident_relationships` row. `family_member` no longer inherits an
  organisation-wide permission. Resident record views are written to
  `resident_access_events`.
- **Staff and rostering**. Staff profiles, qualifications, training and document
  expiry live in dedicated tables. Shift assignment is guarded in the database:
  the worker must be an active member, must not already have an overlapping
  shift, and must hold the shift's required verified qualification. Nothing is
  auto-assigned.
- **Daily care and care plans**. Daily records reference a resident, task and
  optional shift; supervisor review locks the record against further edits.
  Care plans keep immutable versions with a draft to pending-approval to active
  to archived workflow, and restricted plans are hidden from general staff.
- **Medication**. Administration records require `medication_manage`; an
  administered row is immutable and every status change is written to
  `medication_record_events`. No dose calculation or recommendation logic exists.
- **Incidents**. Categories, severity, investigation status, reviewer, corrective
  actions and closure notes are recorded. Closure requires a reviewer and notes.
  Sensitive records are restricted to incident permissions.
- **Inventory**. `inventory_items` stores no balance; the current quantity is
  derived from append-only `inventory_movements`. Movements cannot be updated or
  deleted, and receiving a purchase line writes a purchase movement.
- **Billing**. Invoice numbers are allocated by a per-organisation monthly
  counter, totals are derived from line items, payments and refunds are
  append-only, and overpayment/over-refund are rejected in the database.
- **Reports**. `care_occupancy`, `care_staffing_coverage`,
  `care_training_compliance`, `care_incident_summary`, `care_inventory_status`,
  `care_expense_summary` and `care_invoice_ageing` are `security_invoker` views,
  so the caller's RLS applies. Aggregates never expose resident names.

### Charity and scholarships (Phase 8)

- **Workspace model** (`src/server/charity/access.ts`). A charity workspace is an
  organisation of type `charity`. Campaign and scholarship management is gated by
  `charity_campaign_manage`, `charity_campaign_approve`, `donor_report_view`,
  `scholarship_manage` and `scholarship_review`. Donors and applicants do not need
  to be organisation members; their access is scoped by ownership in RLS.
- **Campaign approval**. Campaigns are created as drafts, submitted for approval,
  then approved by a reviewer with `charity_campaign_approve`. The database guard
  rejects illegal transitions and blocks self-approval by managers. Approved
  public campaigns are readable without an account.
- **Donations**. `createDonationCheckout` validates the campaign, currency and
  amount bounds, creates a `donation` payment transaction and sends the donor to
  the provider. A donation row is created only by
  `sync_donation_from_payment`, which reacts to a verified payment transaction.
  Refunds and partial refunds update the donation through the same trigger.
- **Donor privacy**. Donation financial fields are immutable to donors; they may
  only change their public acknowledgement preference, display name and message.
  Public views expose aggregates and opted-in display names, never donor contact
  details.
- **Financial separation**. `charity_campaign_finance` reports received, committed
  and disbursed amounts separately from commercial revenue. Allocations and
  campaign expenses are append-only, and donations are never treated as
  unrestricted company income.
- **Scholarships**. Programmes define eligibility, coverage and a maximum award.
  Applicants apply while a programme is open; reviewers record decisions under a
  guarded status workflow. Awards are created by scholarship managers. The
  applicant accepts or declines an awarded scholarship; accepting an award with a
  course creates a `course_enrolments` row with `source = 'scholarship'`.
- **Impact reporting**. Impact reports are drafts until published and then appear
  on the public campaign page. Outcome reporting records training completion,
  internship and employment outcomes only where they can be shared.

### Analytics, reporting and subscriptions (Phase 9)

- **Role-aware dashboard** (`src/app/dashboard/page.tsx`). The dashboard resolves
  live snapshots for care operations, charity, referral partners, employers,
  academy learners/managers and finance staff. It also surfaces subscription
  read-only/ending-trial warnings and the user's organisations.
- **Reporting** (`src/server/reports/registry.ts`). Reports are declarative
  definitions with columns, permissions and date/organisation filters. The
  catalogue covers enrolments, course completions, internships, employment
  outcomes, employer activity, referrals, commission liabilities, payment
  reconciliation, refunds, charity campaign finance, scholarship allocation, care
  occupancy, incidents, inventory, invoices and expenses.
- **CSV exports** (`/api/reports/[report]/export`). Exports require
  `report_export`, are capped at 5,000 rows and write a `report.exported` audit
  record with the report key, filters, row count and timestamp.
- **Subscription plans** (`subscription_plans`). Plans are configuration: modules,
  user/facility limits, storage allowance, trial and grace days. Prices are null
  until the business configures them; the application never invents a price.
- **Organisation subscriptions** (`organisation_subscriptions`). New
  organisations start a trial on a plan suited to their type (professional for
  care providers, enterprise for charities, starter otherwise). Existing
  organisations are backfilled as legacy/active.
- **Billing lifecycle**. `subscription_events` records creation, plan changes,
  renewals, cancellation and status changes. `subscription_payments` is a separate
  append-only ledger from training purchases, donations and referral payouts.
  Platform billing staff record payments and set statuses; organisation owners can
  change plan/cycle and cancel/resume but cannot alter status or periods.
- **Feature limits**. Database functions and triggers enforce member limits,
  facility limits, module access and read-only states on the primary write tables.
  Suspended or expired subscriptions block writes but never hide resident/care
  records; reads and CSV exports remain available.

### Direct messaging

- **Scope**. Conversations belong to one organisation and may include up to 20
  active members of that organisation. There are no cross-organisation threads.
- **Access**. `is_conversation_participant()` backs RLS on conversations,
  participants and messages, so non-participants see no rows even inside the
  same organisation.
- **Writes**. `start_conversation()` and `send_message()` are security-definer
  RPCs: they validate recipients, insert the message and create in-app
  notifications for recipients. `mark_conversation_read()` updates the caller's
  read receipt.
- **History**. Messages are append-only; corrections are new messages. No direct
  insert, update or delete policies exist on messages.

### Platform operations console

The platform super administrator is a monitoring and support role, not a tenant
operator. The superadmin navigation and dashboard expose organisations, users,
subscriptions and plans, payments, payment gateway, reconciliation, system/API
health, support, audit and settings. Operational care, academy learning and
management, course taxonomy, charity and referral workspaces stay with
organisation owners and their teams. `/dashboard` redirects superadmins to
`/dashboard/admin`.

## Cross-tenant isolation

`supabase/tests/rls_isolation.sql` seeds two tenants and asserts — as an
authenticated user of tenant A — that tenant A cannot read or write tenant B's
organisations, memberships, profiles, employment records, payments, commissions
or partner profile, cannot fabricate financial rows, cannot self-assign a
privileged role, cannot escalate `is_super_admin` and cannot self-refer. Run with
`npm run db:test:rls`.

## Integrations

- **Payments** — implemented behind a provider abstraction (Paystack); webhooks
  are signature-verified and processed idempotently; browser redirects are never
  trusted as proof of payment. Checkout and transfers still require provider
  credentials and, for transfers, explicit enablement.
- **Email / SMS** — email has a Resend adapter with a console fallback; SMS is a
  later phase.
- **Storage** — private buckets by default; signed URLs for authorised access.
  Not yet implemented.

## Environments

Development, testing and production are separated. Secrets live only in server
environments. `NEXT_PUBLIC_*` values are the only ones exposed to browsers.
