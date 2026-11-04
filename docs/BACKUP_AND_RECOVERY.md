# Backup and recovery

## What must be protected

- Postgres data: organisations, residents, care records, financial ledgers,
  charity/scholarship records, subscriptions and audit logs.
- Auth users and sessions (managed by Supabase Auth).
- Storage objects once file uploads are enabled (not yet).
- Environment secrets and provider configuration.

## Supabase backups

- Enable the daily backup/PITR option available on the project plan.
- Record the backup window and retention period in the operations log.
- Take a manual logical backup before major migrations or data imports.
- Example logical backup (requires `pg_dump` and the database connection string):

  ```bash
  pg_dump "$DATABASE_URL" --no-owner --no-privileges -f carebridge-backup.sql
  ```

- Store backups encrypted, outside the primary project, with restricted access.

## Recovery objectives

Define these with the business and record them here when confirmed:

| Objective | Target |
| --- | --- |
| RPO (maximum data loss) | e.g. 24 hours with daily backups; lower with PITR |
| RTO (time to restore service) | e.g. 4 hours |

Do not claim an RPO/RTO that has not been tested.

## Restore drill

1. Create a disposable Supabase project or branch.
2. Restore the latest backup or PITR snapshot.
3. Run migrations to confirm the schema version.
4. Run `npm run db:test:rls` and expect `RLS_ISOLATION_PASS`.
5. Point a staging deployment at the restored project with staging secrets.
6. Sign in as a test owner, open the dashboard, care workspace, charity pages,
   reports and billing.
7. Verify a sample payment, commission, donation and invoice read correctly.
8. Destroy the restored project after the drill.

## Application rollback

1. Promote the previous hosting deployment.
2. If the database changed, restore the pre-deployment snapshot.
3. Never edit an applied migration to roll back. Fix forward with a new
   migration.
4. Re-run the RLS suite and smoke checklist after recovery.

## Secrets recovery

- Keep an encrypted offline copy of the environment checklist (not the secret
  values in the repository).
- If a key is lost, rotate it at the provider and update hosting environment
  variables.
- Service-role and Paystack keys must never be committed.

## Retention

- Financial and audit records are retained according to legal and contractual
  requirements.
- Resident/care records may be subject to care-sector retention rules.
- Do not purge financial history to satisfy a deletion request without legal
  review.

## Backup failure handling

- Alert on missed backups.
- Re-run the backup and record the incident.
- If backups have been failing for longer than the RPO, freeze destructive
  migrations and escalate.
