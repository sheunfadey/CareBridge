# CareBridge Architecture

## Overview

CareBridge is a multi-tenant SaaS platform built on Next.js App Router with a
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

### Cross-tenant isolation

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
