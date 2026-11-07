-- =============================================================================
-- CareBridge - Organisation integrations
-- Migration: 0040_organisation_integrations.sql
--
-- Per-organisation Paystack, SMS, email and custom API configuration managed by
-- a platform super administrator. Credentials are server-side only; RLS is
-- enabled with no client policies.
-- =============================================================================

create type organisation_integration_kind as enum (
  'paystack',
  'sms',
  'email',
  'custom_api'
);

create table public.organisation_integrations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  kind organisation_integration_kind not null,
  provider text not null default 'paystack',
  mode text check (mode is null or mode in ('sandbox', 'live')),
  public_key text,
  secret_key text,
  webhook_secret text,
  sender_id text,
  sender_name text,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, kind)
);

create index organisation_integrations_org_idx
  on public.organisation_integrations (organisation_id, kind);

create trigger organisation_integrations_set_updated_at
  before update on public.organisation_integrations
  for each row execute function public.set_updated_at();

alter table public.organisation_integrations enable row level security;
