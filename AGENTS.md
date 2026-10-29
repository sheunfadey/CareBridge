# AGENTS.md

Guidance for coding agents working in the CareBridge repository.

## Project

CareBridge — caregiver training (LMS), internships, employment marketplace,
care-home/home-care operations, referral commissions and charity/scholarships.
Multi-tenant SaaS targeting Nigeria. The authoritative product spec lives in
`CareBridge_Plan.txt` at the repository root. Read it before starting work.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 with CSS-variable design tokens in `src/app/globals.css`
- shadcn/ui primitives (`src/components/ui`), Lucide icons, `motion` for animation
- Supabase (Postgres / Auth / Storage / RLS) — Phase 2+
- Paystack behind a provider abstraction — Phase 6+
- Zod + React Hook Form for validation, Recharts for analytics,
  TanStack Table for complex tables

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (must pass before a phase is "done")
- `npm run start` — run the production build
- `npm run lint` — ESLint (must be clean)
- `npm run typecheck` — `tsc --noEmit` (must be clean)
- `npm run db:push` — apply pending migrations to the linked Supabase project
- `npm run db:test:rls` — run the cross-tenant isolation checks (needs the linked project)
- `node scripts/generate-brand-assets.mjs` — regenerate PWA/social PNGs from SVG

Run lint, typecheck and build after every phase. Fix errors; do not suppress
them or use `any` to silence TypeScript.

## Supabase

- Project is linked (`supabase link`); migrations live in `supabase/migrations`
  and are applied with `npm run db:push`. Keep migrations forward-only — never
  edit an applied migration, add a new one.
- The database client is request-scoped with the anon key and the user's JWT
  (`src/lib/supabase/{client,server,middleware}.ts`). Do not add the service-role
  key to any client the browser can reach.
- The permission registry (`src/lib/permissions/registry.ts`) and the seeded
  roles/permissions in `supabase/migrations/0003_*` must stay in sync. If you add
  a permission, update both.
- Authorisation must be enforced in the database (RLS) first; server-side
  `assertPermission` and UI gating are secondary. Never trust a client-supplied
  role or organisation id without an RLS or RPC check.
- Schema changes that enable cross-tenant access must be covered by
  `supabase/tests/rls_isolation.sql`.

## Conventions

- Brand tokens live in `src/config/brand.ts` and as CSS variables. Never
  hard-code brand colours in components — use the `brand-*` Tailwind tokens.
- Domain components live in `src/components/<area>`; shadcn primitives in
  `src/components/ui`. Export new dashboard components from
  `src/components/dashboard/index.ts`.
- Prefer Server Components; add `"use client"` only where browser interaction
  requires it. Do not pass functions (e.g. icon components) from Server
  Components to Client Components — render them inside a client boundary.
- UI text is `cn` from the `cn` package (`import { cn } from "cn"`), matching
  the shadcn-generated primitives.
- Money (later phases): integer minor units, NGN, `Africa/Lagos` display.
  Never use floating point for money.

## Hard rules (from the spec)

- Never expose secrets to the browser; keep service-role keys server-side.
- Enforce authorisation server-side and via Postgres RLS — not only in the UI.
- Never fabricate metrics, partnerships, testimonials or transactions.
- Never mark a feature complete unless its core workflow works and is verified.
- Record reversals rather than mutating financial history; inventory only
  changes via movement records.

## Progress

Built phase by phase (see `CareBridge_Plan.txt` §35). Phase 1 (brand + design
system) is complete. Phase 2 (authentication and multi-tenancy) is in progress:
schema, RLS, roles/permissions, auth flows, organisations/invitations and the
dashboard data wiring are implemented and verified. Remaining: branded email
delivery (Phase 3), storage, and an automated test runner.
