-- =============================================================================
-- CareBridge - Phase 9: analytics, subscriptions and feature limits
-- Migration: 0025_subscriptions_reporting.sql
--
-- Configurable subscription plans for organisational customers, lifecycle
-- events, separate subscription payments, server-side feature limits and the
-- permissions used by the reporting and billing surfaces.
--
-- Safety: a suspended subscription makes an organisation read-only. It never
-- hides critical resident/care records, which must remain readable and
-- exportable during a billing dispute.
-- =============================================================================

-- Permissions ------------------------------------------------------------------

insert into public.permissions (key, category, description) values
  ('subscription_view', 'billing', 'Read the organisation subscription and limits'),
  ('subscription_manage', 'billing', 'Change plan, cancel or resume the subscription'),
  ('billing_manage', 'billing', 'Platform billing administration and payment recording'),
  ('report_view', 'reporting', 'View permitted operational reports'),
  ('report_export', 'reporting', 'Export permitted reports as CSV')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('super_admin', 'subscription_view'),
  ('super_admin', 'subscription_manage'),
  ('super_admin', 'billing_manage'),
  ('super_admin', 'report_view'),
  ('super_admin', 'report_export'),

  ('care_home_owner', 'subscription_view'),
  ('care_home_owner', 'subscription_manage'),
  ('care_home_owner', 'report_view'),
  ('care_home_owner', 'report_export'),

  ('care_home_manager', 'subscription_view'),
  ('care_home_manager', 'report_view'),
  ('care_home_manager', 'report_export'),

  ('charity_admin', 'subscription_view'),
  ('charity_admin', 'subscription_manage'),
  ('charity_admin', 'report_view'),
  ('charity_admin', 'report_export'),

  ('training_admin', 'subscription_view'),
  ('training_admin', 'subscription_manage'),
  ('training_admin', 'report_view'),
  ('training_admin', 'report_export'),

  ('employer', 'subscription_view'),
  ('employer', 'subscription_manage'),
  ('employer', 'report_view'),
  ('employer', 'report_export'),

  ('finance_officer', 'billing_manage'),
  ('finance_officer', 'subscription_view'),
  ('finance_officer', 'report_view'),
  ('finance_officer', 'report_export'),

  ('compliance_officer', 'report_view'),
  ('compliance_officer', 'report_export'),

  ('platform_support', 'subscription_view')
on conflict do nothing;

-- Enums ------------------------------------------------------------------------

create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'grace',
  'suspended',
  'cancelled',
  'expired'
);

create type subscription_billing_cycle as enum ('monthly', 'annual');

create type subscription_event_type as enum (
  'created',
  'trial_started',
  'plan_changed',
  'renewed',
  'payment_failed',
  'past_due',
  'grace_started',
  'suspended',
  'reactivated',
  'cancelled',
  'expired',
  'settings_updated'
);

create type subscription_payment_status as enum ('recorded', 'void');

-- Plans ------------------------------------------------------------------------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  monthly_price_minor_units bigint
    check (monthly_price_minor_units is null or monthly_price_minor_units >= 0),
  annual_price_minor_units bigint
    check (annual_price_minor_units is null or annual_price_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  permitted_modules text[] not null default '{}',
  max_users integer check (max_users is null or max_users > 0),
  max_facilities integer check (max_facilities is null or max_facilities > 0),
  storage_allowance_mb integer
    check (storage_allowance_mb is null or storage_allowance_mb > 0),
  usage_limits jsonb not null default '{}'::jsonb,
  trial_days integer not null default 14 check (trial_days >= 0),
  grace_days integer not null default 7 check (grace_days >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

-- Default configuration. Prices are intentionally NULL until the business
-- configures them; the application never invents a price.
insert into public.subscription_plans
  (code, name, description, permitted_modules, max_users, max_facilities,
   storage_allowance_mb, trial_days, grace_days, sort_order)
values
  ('starter', 'Starter', 'Small teams getting started with CareBridge.',
   '{academy,employment,referrals}', 5, 1, 1024, 14, 7, 10),
  ('professional', 'Professional', 'Growing care providers and training teams.',
   '{academy,employment,referrals,care}', 50, 5, 10240, 14, 7, 20),
  ('enterprise', 'Enterprise', 'Multi-site providers and charity operations.',
   '{academy,employment,referrals,care,charity}', null, null, 102400, 30, 14, 30)
on conflict (code) do nothing;

-- Subscriptions ----------------------------------------------------------------

create table public.organisation_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique
    references public.organisations (id) on delete cascade,
  plan_id uuid not null
    references public.subscription_plans (id) on delete restrict,
  billing_cycle subscription_billing_cycle not null default 'monthly',
  status subscription_status not null default 'trialing',
  started_at timestamptz not null default now(),
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '14 days',
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  grace_ends_at timestamptz,
  suspended_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organisation_subscriptions_set_updated_at
  before update on public.organisation_subscriptions
  for each row execute function public.set_updated_at();

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null
    references public.organisation_subscriptions (id) on delete cascade,
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  event_type subscription_event_type not null,
  from_status subscription_status,
  to_status subscription_status,
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index subscription_events_subscription_idx
  on public.subscription_events (subscription_id, created_at desc);
create index subscription_events_org_idx
  on public.subscription_events (organisation_id, created_at desc);

create or replace function public.record_subscription_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscription_events (
    subscription_id, organisation_id, event_type, from_status, to_status,
    actor_id, metadata
  ) values (
    new.id, new.organisation_id, 'created', null, new.status, auth.uid(),
    jsonb_build_object('plan_id', new.plan_id, 'billing_cycle', new.billing_cycle)
  );
  return new;
end;
$$;

create trigger organisation_subscriptions_record_created
  after insert on public.organisation_subscriptions
  for each row execute function public.record_subscription_event();

-- Subscription payments (separate from training, donations and payouts) --------

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null
    references public.organisation_subscriptions (id) on delete restrict,
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  period_start date not null,
  period_end date not null,
  status subscription_payment_status not null default 'recorded',
  provider_reference text,
  receipt_reference text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint subscription_payment_dates check (period_end >= period_start)
);

create index subscription_payments_subscription_idx
  on public.subscription_payments (subscription_id, created_at desc);

-- Append-only billing history.
create or replace function public.guard_subscription_payment_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Subscription payments are append-only';
end;
$$;

create trigger subscription_payments_guard_history
  before update or delete on public.subscription_payments
  for each row execute function public.guard_subscription_payment_history();

-- Feature limit helpers --------------------------------------------------------

-- Effective status accounts for trial expiry, grace windows and cancellation at
-- period end. Missing subscriptions are treated as legacy full access so this
-- migration never locks an existing workspace out.
create or replace function public.subscription_effective_status(p_organisation uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub public.organisation_subscriptions%rowtype;
  v_plan public.subscription_plans%rowtype;
begin
  select * into v_sub
  from public.organisation_subscriptions
  where organisation_id = p_organisation;

  if not found then
    return 'legacy';
  end if;

  select * into v_plan from public.subscription_plans where id = v_sub.plan_id;

  if v_sub.status = 'trialing' then
    if v_sub.trial_ends_at is not null and v_sub.trial_ends_at < now() then
      return 'expired';
    end if;
    return 'trialing';
  end if;

  if v_sub.status = 'active' then
    if v_sub.current_period_end < now() then
      return 'past_due';
    end if;
    return 'active';
  end if;

  if v_sub.status in ('past_due', 'grace') then
    if v_sub.grace_ends_at is not null and v_sub.grace_ends_at >= now() then
      return 'grace';
    end if;
    return 'suspended';
  end if;

  if v_sub.status = 'cancelled' then
    if v_sub.current_period_end >= now() then
      return 'cancelled_active';
    end if;
    return 'expired';
  end if;

  return v_sub.status::text;
end;
$$;

create or replace function public.organisation_can_write(p_organisation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.subscription_effective_status(p_organisation)
    in ('legacy', 'trialing', 'active', 'grace', 'cancelled_active');
$$;

create or replace function public.organisation_has_module(
  p_organisation uuid,
  p_module text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_modules text[];
begin
  select p.permitted_modules into v_modules
  from public.organisation_subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.organisation_id = p_organisation;

  if not found or v_modules is null or array_length(v_modules, 1) is null then
    return true;
  end if;

  return p_module = any (v_modules);
end;
$$;

create or replace function public.organisation_can_add_member(p_organisation uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if not public.organisation_can_write(p_organisation) then
    return false;
  end if;

  select p.max_users into v_limit
  from public.organisation_subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.organisation_id = p_organisation;

  if v_limit is null then
    return true;
  end if;

  select count(*) into v_count
  from public.organisation_memberships
  where organisation_id = p_organisation
    and status in ('active', 'invited');

  return v_count < v_limit;
end;
$$;

create or replace function public.organisation_can_add_facility(p_organisation uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if not public.organisation_can_write(p_organisation) then
    return false;
  end if;

  select p.max_facilities into v_limit
  from public.organisation_subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.organisation_id = p_organisation;

  if v_limit is null then
    return true;
  end if;

  select count(*) into v_count
  from public.care_facilities
  where organisation_id = p_organisation;

  return v_count < v_limit;
end;
$$;

-- New organisations start a trial automatically.
create or replace function public.start_default_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.subscription_plans%rowtype;
  v_code text;
begin
  v_code := case new.type
    when 'care_home' then 'professional'
    when 'home_care_agency' then 'professional'
    when 'charity' then 'enterprise'
    else 'starter'
  end;

  select * into v_plan
  from public.subscription_plans
  where code = v_code and is_active
  limit 1;

  if not found then
    select * into v_plan
    from public.subscription_plans
    where code = 'starter' and is_active
    limit 1;
  end if;

  if not found then
    return new;
  end if;

  insert into public.organisation_subscriptions (
    organisation_id, plan_id, status, started_at, trial_ends_at,
    current_period_start, current_period_end, created_by
  ) values (
    new.id, v_plan.id, 'trialing', now(),
    now() + make_interval(days => v_plan.trial_days),
    now(), now() + make_interval(days => v_plan.trial_days), new.created_by
  )
  on conflict (organisation_id) do nothing;

  return new;
end;
$$;

create trigger organisations_start_default_subscription
  after insert on public.organisations
  for each row execute function public.start_default_subscription();

-- Backfill existing organisations with legacy active subscriptions so the new
-- limits do not suddenly lock current workspaces.
insert into public.organisation_subscriptions (
  organisation_id, plan_id, status, started_at,
  current_period_start, current_period_end
)
select o.id, p.id, 'active', now(), now(), now() + interval '1 year'
from public.organisations o
join public.subscription_plans p
  on p.code = case o.type
    when 'care_home' then 'professional'
    when 'home_care_agency' then 'professional'
    when 'charity' then 'enterprise'
    else 'starter'
  end
where not exists (
  select 1 from public.organisation_subscriptions s
  where s.organisation_id = o.id
);

-- Row Level Security -----------------------------------------------------------

alter table public.subscription_plans enable row level security;
alter table public.organisation_subscriptions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.subscription_payments enable row level security;

create policy subscription_plans_select on public.subscription_plans
  for select using (
    is_active
    or public.is_super_admin()
    or public.has_permission('billing_manage', null)
  );

create policy subscription_plans_write on public.subscription_plans
  for all using (public.has_permission('billing_manage', null))
  with check (public.has_permission('billing_manage', null));

create policy organisation_subscriptions_select on public.organisation_subscriptions
  for select using (
    public.is_super_admin()
    or public.has_permission('subscription_view', organisation_id)
    or public.has_permission('subscription_manage', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy organisation_subscriptions_insert on public.organisation_subscriptions
  for insert with check (
    public.has_permission('subscription_manage', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy organisation_subscriptions_update on public.organisation_subscriptions
  for update using (
    public.has_permission('subscription_manage', organisation_id)
    or public.has_permission('billing_manage', null)
  )
  with check (
    public.has_permission('subscription_manage', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy subscription_events_select on public.subscription_events
  for select using (
    public.is_super_admin()
    or public.has_permission('subscription_view', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy subscription_events_insert on public.subscription_events
  for insert with check (
    public.has_permission('subscription_manage', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy subscription_payments_select on public.subscription_payments
  for select using (
    public.is_super_admin()
    or public.has_permission('subscription_view', organisation_id)
    or public.has_permission('billing_manage', null)
  );

create policy subscription_payments_insert on public.subscription_payments
  for insert with check (
    public.has_permission('billing_manage', null)
  );

-- Privileges -------------------------------------------------------------------
grant select on public.subscription_plans to anon, authenticated;
grant select, insert, update on public.organisation_subscriptions to authenticated;
grant select, insert on public.subscription_events to authenticated;
grant select, insert on public.subscription_payments to authenticated;
