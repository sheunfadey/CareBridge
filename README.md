# CareBridge

**Learn to Care. Grow Your Career. Make a Difference.**

CareBridge is a multi-tenant SaaS platform for caregiver training, verified
practical experience, employment, care-home operations, referral commissions and
charity programmes. It is designed for Nigeria first (NGN, `Africa/Lagos`,
mobile-first).

> This repository is under active phased construction. The full product and build
> specification is in [`CareBridge_Plan.txt`](./CareBridge_Plan.txt).

## Status

| Phase | Scope | State |
| ----- | ----- | ----- |
| 0 | Repository inspection & planning | Complete |
| 1 | Brand & design system | Complete |
| 2 | Authentication & multi-tenancy | Complete |
| 3 | Public website & admin foundation | Complete |
| 4 | Academy (LMS) | Complete |
| 5 | Internships & employment | Complete |
| 6 | Payments & referral management | Complete |
| 7 | Care-home operations | Complete (core modules) |
| 8 | Charity & scholarships | Complete (core modules) |
| 9 | Analytics & subscriptions | Complete (core modules) |
| 10 | QA & production readiness | Not started |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · Lucide · motion · Supabase (Postgres/Auth/Storage/RLS, Phase 2+) ·
Paystack (provider-abstracted, Phase 6+) · Zod · React Hook Form · Recharts ·
TanStack Table

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in values as phases require them
npm run dev                  # http://localhost:3000
```

### Commands

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests
npm run db:push     # apply pending migrations to the linked Supabase project
npm run db:test:rls # cross-tenant RLS isolation checks
node scripts/generate-brand-assets.mjs   # regenerate brand PNGs from SVG
```

### Super admin bootstrap

Promote the first platform super admin from a trusted server-side SQL session
(SQL editor, service role or a migration):

```sql
update public.profiles set is_super_admin = true where id = '<user-id>';
```

Migration `0010_super_admin_bootstrap.sql` permits this when there is no
authenticated session (`auth.uid() is null`) and continues to block logged-in
non-super-admins from escalating themselves.

## What is implemented (Phase 1)

- **Design tokens** — official CareBridge palette as CSS variables and Tailwind
  theme tokens (`src/app/globals.css`, `src/config/brand.ts`). Light and dark
  themes; no hard-coded brand colours in components.
- **Brand assets** — original SVG logo (bridge arch + two figures), horizontal /
  dark / monochrome variants, `LogoMark`, `CareBridgeLogo`,
  `AnimatedCareBridgeLogo` (5-stage reveal respecting `prefers-reduced-motion`),
  favicon, PWA icon set and social sharing image (`public/brand`).
- **Loading experience** — `AppLoadingScreen`, `PageLoadingSkeleton`,
  `InlineLoadingIndicator`, `RouteLoadingFallback`.
- **Layout shell** — responsive `Sidebar` (dark navy), `Topbar` with search,
  notifications and user menu, mobile navigation via `Sheet`, `PageHeader`,
  `DashboardShell`.
- **UI primitives** — shadcn/ui components (buttons, forms, tables, dialogs,
  menus, tabs, toasts, etc.) themed to CareBridge tokens, plus a `StatusBadge`
  with a central status→tone map.
- **Dashboard cards** — `StatCard`, `MetricCard`, `ProgressCard`,
  `ChartCard`, `ActionCard`, `StatusCard`, `AlertCard`, `RecentActivityCard`,
  `EmptyStateCard` with loading/empty/error states.
- **Showcase** — `/design-system` renders every token and component for
  verification. `/dashboard` demonstrates the shell (metrics are intentionally
  empty until data is connected — no fabricated values).

## What is implemented (Phases 2-6)

- **Authentication & multi-tenancy** - Supabase Auth flows, organisations,
  memberships, invitations, role-based permissions, RLS on every tenant table and
  audit logging.
- **Public website & admin** - marketing pages, Academy catalogue, verified
  certificate lookup and a super-admin platform console.
- **Academy (Phase 4)** - programmes, courses, modules, lessons, enrolments,
  progress, certificates, course creation and management for organisation owners,
  training admins and instructors, shared/organisation course categories,
  editable category metadata, typed learning resources with file uploads or
  external links (PDF, document, audio, video, image, link), and auto-graded
  assessments with attempt limits, pass marks and completion gating.
- **Messaging** - organisation-scoped conversations between active members,
  append-only messages, read receipts and in-app notifications.
- **Internships (Phase 5, complete)** - placement provider profiles, open
  placement listings, applications with status tracking, provider review,
  placements, supervision, weekly logbooks, attendance, evaluations, incidents,
  completion records and agreement acceptance.
- **Employment (Phase 5, complete)** - employer job postings with drafts and
  publishing, published job browsing, applications with status tracking,
  employer applicant review, interviews and formal offers with candidate
  responses.
- **Payments (Phase 6, complete; test checkout configured)** - Paystack
  behind a provider abstraction, server-side verification, signed and idempotent
  webhooks, course checkout, refunds with an append-only ledger, and finance
  reconciliation pages.
- **Referral management (Phase 6, complete)** - partner applications, published
  commission policies, referral attribution, an immutable commission ledger,
  payout requests, finance approval and a guarded transfer workflow. Provider
  transfers are disabled unless `PAYSTACK_TRANSFERS_ENABLED=true`.
- **Care-home operations (Phase 7, core modules complete)** - facility and
  resident records, contacts and consents, a consent-aware family portal, staff
  qualifications, availability and compliance, shift rosters with
  overlap/qualification guards, daily care records and supervisor review,
  versioned care plans with approval, medication administration records,
  incidents and corrective actions, inventory with append-only movements,
  purchase requests, expenses, invoices/payments/refunds, resident access history
  and operational reports.
- **Charity and scholarships (Phase 8, core modules complete)** - reviewed
  campaigns with funding targets, verified donations through the payment
  abstraction, donor receipts and privacy preferences, append-only fund
  allocations and campaign expenses, scholarship programmes, applications,
  reviewer decisions, full/partial awards with course allocation, outcome
  tracking and published impact reports. Donations are reported separately from
  commercial revenue.
- **Analytics, subscriptions and feature limits (Phase 9, core modules complete)** -
  role-aware dashboards, a 16-report catalogue with date/organisation filters,
  audited CSV exports, configurable subscription plans, organisation
  subscriptions with lifecycle events, separate subscription payments, and
  database-enforced user, facility and module limits. Suspended or expired
  subscriptions make a workspace read-only while keeping records readable and
  exportable.
- **Theme & responsiveness** - light/dark theme toggle, mobile navigation and
  responsive dashboard layouts.

## Routes

| Route | Description |
| ----- | ----------- |
| `/` | Marketing home |
| `/courses`, `/courses/[slug]` | Public Academy catalogue and course pages |
| `/internships`, `/for-employers` | Public programme pages |
| `/verify-certificate` | Public certificate verification |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentication |
| `/dashboard` | Authenticated overview |
| `/dashboard/academy/*` | Learning, assessments, management and certificates |
| `/dashboard/messages` | Organisation-scoped conversations, read receipts and replies |
| `/dashboard/internships/*` | Placement browse, apply and management |
| `/dashboard/jobs/*` | Job browse, apply, applications and employer management |
| `/dashboard/referrals` | Referral partner dashboard and payouts |
| `/dashboard/care-homes/*` | Residents, staff, roster, daily care, plans, medication, incidents, inventory, expenses, invoices and reports |
| `/dashboard/family` | Family portal for linked residents (summary/full access) |
| `/charity`, `/charity/[slug]` | Public charity campaigns and donation pages |
| `/dashboard/charity/*` | Campaigns, donations, scholarships, impact reports and charity reporting |
| `/dashboard/reports` | Role-appropriate report catalogue and filters |
| `/api/reports/[report]/export` | Audited CSV report export |
| `/dashboard/organisation/[organisationId]/billing` | Organisation plan, limits and billing history |
| `/dashboard/admin/subscriptions` | Platform plans, subscriptions and payment recording |
| `/dashboard/admin/payments/*` | Finance payment review and refunds |
| `/dashboard/admin/reconciliation` | Provider reconciliation |
| `/dashboard/admin/referrals` | Partner, commission and payout administration |
| `/dashboard/organisation/*` | Organisation and membership management |
| `/dashboard/notifications` | Notification centre |
| `/dashboard/admin` | Super-admin platform administration |
| `/design-system` | Internal design-system showcase |

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md)
- [`docs/ROLE_PERMISSION_MATRIX.md`](./docs/ROLE_PERMISSION_MATRIX.md)
- [`docs/RLS_POLICIES.md`](./docs/RLS_POLICIES.md)
- [`docs/PAYMENTS_AND_WEBHOOKS.md`](./docs/PAYMENTS_AND_WEBHOOKS.md)
- [`docs/REFERRAL_COMMISSION_RULES.md`](./docs/REFERRAL_COMMISSION_RULES.md)
- [`docs/CARE_HOME_WORKFLOWS.md`](./docs/CARE_HOME_WORKFLOWS.md)
- [`docs/INTERNSHIP_WORKFLOWS.md`](./docs/INTERNSHIP_WORKFLOWS.md)
- [`docs/SECURITY_AND_PRIVACY.md`](./docs/SECURITY_AND_PRIVACY.md)
- [`docs/BACKUP_AND_RECOVERY.md`](./docs/BACKUP_AND_RECOVERY.md)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- [`docs/TESTING.md`](./docs/TESTING.md)
- [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)
- [`AGENTS.md`](./AGENTS.md) — conventions and commands for coding agents

## Security notes

- Secrets stay server-side; only `NEXT_PUBLIC_*` values reach the browser.
- Payment state is never trusted from a browser redirect. Checkout returns are
  verified server-side and webhooks are signature-checked and idempotent.
- Financial history is append-only: amounts are integer minor units, ledger
  entries are immutable, and corrections are recorded as new entries.
- Referral provider transfers are disabled by default and require both approval
  and `PAYSTACK_TRANSFERS_ENABLED=true`.
- All tenant data isolation is enforced with Postgres RLS.

## Environment variables

See [`.env.example`](./.env.example). Variables are grouped by phase; only the
ones needed by implemented features are required to run the app today.
