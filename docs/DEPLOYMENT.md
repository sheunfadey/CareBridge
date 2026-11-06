# Deployment

CareBridge is a Next.js 16 application backed by Supabase (Postgres, Auth and
RLS). Vercel is the reference hosting target; any Node.js host that supports
Next.js works.

## 1. Prerequisites

- Node.js 20 or newer (22 recommended) and npm.
- A Supabase project (development and production should be separate).
- Supabase CLI for migrations.
- A hosting account (Vercel recommended).
- A domain with HTTPS.

## 2. Environment variables

Copy `.env.example` to `.env.local` for local development. Set the same variables
in the hosting provider for production.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL; used in auth and payment redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Trusted payment/admin operations. Never expose to the browser |
| `EMAIL_PROVIDER` | No | `console` (default) or `resend` |
| `EMAIL_PROVIDER_API_KEY` | If Resend | Resend API key |
| `EMAIL_FROM_ADDRESS` | If Resend | Verified sender address |
| `EMAIL_FROM_NAME` | No | Sender display name |
| `PAYSTACK_SECRET_KEY` | Payments | Enables checkout and verification |
| `PAYSTACK_WEBHOOK_SECRET` | Payments | Webhook HMAC verification |
| `PAYSTACK_MODE` | Payments | `sandbox` until live approval |
| `PAYSTACK_TRANSFERS_ENABLED` | Payouts | Keep `false` until business approval |

Secrets belong only in server environment configuration. Only `NEXT_PUBLIC_*`
values reach the browser.

### Current production deployment

- Vercel project: `ayb21/carebridge` (owner: `sheunfadey@gmail.com`)
- Production URL: `https://carebridge-indol.vercel.app`
- `NEXT_PUBLIC_APP_URL` must be set to that URL in Vercel.
- Supabase Auth Site URL and redirect allow-list must include
  `https://carebridge-indol.vercel.app/auth/callback` and
  `https://carebridge-indol.vercel.app/reset-password`.
- Paystack test keys are configured with `PAYSTACK_MODE=sandbox` and
  `PAYSTACK_TRANSFERS_ENABLED=false`. Register
  `https://carebridge-indol.vercel.app/api/payments/webhook/paystack` as the
  Paystack webhook and use the same secret for `PAYSTACK_WEBHOOK_SECRET`.

## 3. Database setup

1. Create the Supabase project.
2. Link the repository:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push --include-all
   ```

3. Confirm the migration history is current (`0001`-`0036` at the time of
   writing).
4. Run the cross-tenant isolation suite against a disposable database or branch:

   ```bash
   npm run db:test:rls
   ```

   It must print `RLS_ISOLATION_PASS`. The script creates fixtures and rolls
   back.

5. Regenerate types only when the schema changes:

   ```bash
   npx supabase gen types typescript --project-id <project-ref>
   ```

   Preserve the hand-written enum aliases at the end of `src/types/database.ts`.

### Migrations and safety

- Migrations are forward-only. Never edit an applied migration.
- Do not run destructive production migrations without explicit authorisation.
- Apply migrations to a staging project first.
- The RLS test includes subscription, care, charity and scholarship fixtures;
  run it after every schema change.

## 4. Supabase Auth configuration

- Site URL: `https://your-domain`
- Additional redirect URLs:
  - `https://your-domain/auth/callback`
  - `https://your-domain/reset-password`
  - `http://localhost:3000/auth/callback` for local development
- Email confirmation and password recovery templates should link through the
  application callback.
- Configure SMTP or keep Supabase's default mailer for development. Production
  email delivery needs a verified sender.

## 5. Hosting (Vercel)

1. Import the repository.
2. Build command: `npm run build`.
3. Install command: `npm install`.
4. Add all environment variables for the production environment.
5. Deploy.
6. Add the custom domain and enforce HTTPS.
7. Set `NEXT_PUBLIC_APP_URL` to the final domain and redeploy so redirects and
   emails use the correct URL.

Health check: `GET /api/health` returns 200 with configuration booleans. It does
not expose secrets or query the database.

Security headers are configured in `next.config.ts`: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS in
production.

## 6. Storage

File uploads and storage buckets are not enabled yet. Scholarship evidence,
staff documents and campaign supporting documents are stored as references.
When storage is added:

- use private buckets by default;
- issue short-lived signed URLs only to authorised users;
- add RLS/storage policies per organisation;
- record downloads of sensitive documents.

## 7. Payments and webhooks (deferred)

Online payments are implemented behind a provider abstraction but require
credentials and business approval. See `docs/PAYMENTS_AND_WEBHOOKS.md`.

- Checkout: set `PAYSTACK_SECRET_KEY` and `PAYSTACK_MODE=sandbox`.
- Webhook URL: `https://your-domain/api/payments/webhook/paystack`.
- Webhook secret: set `PAYSTACK_WEBHOOK_SECRET`.
- Keep `PAYSTACK_TRANSFERS_ENABLED=false` until the payout arrangement is
  approved.
- Do not enable live transactions until sandbox checkout, verification, refunds,
  reconciliation and webhook tests have passed.

## 8. Backups and monitoring

- Enable Supabase point-in-time recovery where the plan supports it.
- Take a manual logical backup before major migrations.
- Follow `docs/BACKUP_AND_RECOVERY.md`.
- Monitor:
  - hosting function errors and response times;
  - Supabase database health, connection usage and slow queries;
  - auth failures and unusual sign-in volume;
  - payment webhook failures and reconciliation mismatches;
  - `audit_logs` for privileged actions and report exports.
- Add an error-monitoring DSN when available.

## 9. Rollback

1. Application rollback: promote the previous Vercel deployment.
2. Database rollback: restore from the pre-deployment backup or PITR point. Do
   not attempt to reverse migrations by editing them.
3. If a migration caused the incident, stop writes, capture the failing state,
   restore, then fix forward with a new migration.

## 10. Production smoke checklist

- `/api/health` returns `status: ok`.
- `/`, `/charity`, `/courses`, `/internships`, `/login`, `/register` return 200.
- Unauthenticated `/dashboard` redirects to `/login`.
- A super admin can open `/dashboard/admin`, `/dashboard/admin/users`,
  `/dashboard/admin/subscriptions` and `/dashboard/reports`.
- An organisation owner can open the organisation billing page.
- Suspending a subscription makes writes fail with the read-only message while
  records remain readable and exportable.
- A permitted user can export a CSV report; an `audit_logs` row records the
  report, filters and timestamp.
- A signed-out webhook POST returns 401.
- Care, charity, scholarship and billing flows match the per-phase smoke results
  in `docs/TESTING.md`.

## 11. Go-live gates

- [ ] Staging migrations and RLS tests pass.
- [ ] Production environment variables set and secrets rotated.
- [ ] Auth redirect URLs and email sender verified.
- [ ] Backups/PITR enabled and a restore drill completed.
- [ ] Security and privacy review completed (`docs/SECURITY_AND_PRIVACY.md`).
- [ ] Paystack sandbox tests passed and webhook registered (when enabling
      payments).
- [ ] Business approval for provider transfers before enabling them.
- [ ] Incident escalation and on-call ownership defined.
