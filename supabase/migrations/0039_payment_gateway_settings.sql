-- =============================================================================
-- CareBridge - Payment gateway settings
-- Migration: 0039_payment_gateway_settings.sql
--
-- Server-only Paystack configuration for test/live keys entered by a platform
-- super administrator. The table has RLS enabled with no client policies; only
-- the service-role server client may read or write it.
-- =============================================================================

create table public.payment_gateway_settings (
  id boolean primary key default true check (id),
  provider text not null default 'paystack' check (provider = 'paystack'),
  mode text not null default 'sandbox' check (mode in ('sandbox', 'live')),
  public_key text,
  secret_key text,
  webhook_secret text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.payment_gateway_settings enable row level security;

insert into public.payment_gateway_settings (id, provider, mode)
values (true, 'paystack', 'sandbox')
on conflict (id) do nothing;
