-- =============================================================================
-- CareBridge - Phase 6: payments and referral management
-- Migration: 0014_payments_referrals.sql
--
-- Provider-abstracted payment records, an append-only commission ledger and the
-- referral payout workflow. Nothing in this migration trusts a browser redirect:
-- a payment only becomes successful through a server-side provider verification
-- or a signature-verified, idempotent webhook, and every commission is derived
-- from a verified payment row.
--
-- Financial rules encoded here:
--   * money is stored as integer minor units (kobo for NGN);
--   * payment and commission histories are append-only;
--   * a paid commission is never overwritten to hide a reversal - a linked
--     reversal entry is recorded instead;
--   * referrals cannot be self-attributed or re-attributed to another partner;
--   * payouts require an approved partner, verified beneficiary details, a
--     minimum balance and explicit finance approval;
--   * provider transfers are recorded, never simulated.
-- =============================================================================

-- Enums -----------------------------------------------------------------------

create type payment_status as enum (
  'initiated',
  'pending',
  'successful',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);

create type payment_purpose as enum (
  'course_purchase',
  'training_fee',
  'subscription',
  'care_home_subscription',
  'donation',
  'other'
);

create type payment_provider as enum ('paystack');

create type payment_reconciliation_status as enum (
  'pending',
  'matched',
  'mismatch',
  'review_required',
  'not_applicable'
);

create type referral_partner_status as enum (
  'pending',
  'approved',
  'suspended',
  'rejected'
);

create type referral_commission_type as enum ('percentage', 'fixed');

create type referral_commission_status as enum (
  'pending',
  'eligible',
  'approved',
  'processing',
  'paid',
  'rejected',
  'reversed',
  'failed',
  'on_hold'
);

create type referral_commission_entry as enum (
  'commission',
  'reversal',
  'adjustment'
);

create type referral_payout_status as enum (
  'pending',
  'approved',
  'processing',
  'paid',
  'rejected',
  'failed',
  'cancelled'
);

-- Referral configuration ------------------------------------------------------

create table public.referral_commission_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  commission_type referral_commission_type not null,
  percentage_bps integer
    check (percentage_bps is null or (percentage_bps >= 0 and percentage_bps <= 10000)),
  fixed_amount_minor_units bigint
    check (fixed_amount_minor_units is null or fixed_amount_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  eligible_purposes payment_purpose[] not null
    default '{course_purchase,training_fee}'::payment_purpose[],
  attribution_window_days integer not null default 30
    check (attribution_window_days > 0),
  payout_delay_days integer not null default 14
    check (payout_delay_days >= 0),
  minimum_payout_minor_units bigint not null default 0
    check (minimum_payout_minor_units >= 0),
  refund_policy text,
  is_active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_policy_basis check (
    (commission_type = 'percentage' and percentage_bps is not null)
    or (commission_type = 'fixed' and fixed_amount_minor_units is not null)
  ),
  constraint referral_policy_dates check (
    effective_to is null or effective_to >= effective_from
  )
);

create trigger referral_commission_policies_set_updated_at
  before update on public.referral_commission_policies
  for each row execute function public.set_updated_at();

create index referral_commission_policies_active_idx
  on public.referral_commission_policies (is_active, effective_from, effective_to);

-- Referral partners ------------------------------------------------------------

create table public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  code text not null unique,
  status referral_partner_status not null default 'pending',
  display_name text,
  phone text,
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  rejected_at timestamptz,
  rejection_reason text,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_partners_code_format check (code ~ '^[A-Z0-9]{6,12}$')
);

create trigger referral_partners_set_updated_at
  before update on public.referral_partners
  for each row execute function public.set_updated_at();

create index referral_partners_status_idx
  on public.referral_partners (status, applied_at);

-- Beneficiary details are deliberately separate from the partner profile: they
-- are only readable by the partner and by finance reviewers.
create table public.referral_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique
    references public.referral_partners (id) on delete cascade,
  bank_code text not null,
  bank_name text,
  account_name text not null,
  account_number text not null,
  provider_recipient_code text,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_payout_accounts_number_format
    check (account_number ~ '^[0-9]{6,20}$')
);

create trigger referral_payout_accounts_set_updated_at
  before update on public.referral_payout_accounts
  for each row execute function public.set_updated_at();

-- Any change to the beneficiary details invalidates a previous verification.
create or replace function public.reset_payout_account_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bank_code is distinct from old.bank_code
     or new.account_name is distinct from old.account_name
     or new.account_number is distinct from old.account_number then
    new.verified_at = null;
    new.verified_by = null;
    new.provider_recipient_code = null;
  end if;
  return new;
end;
$$;

create trigger referral_payout_accounts_reset_verification
  before update on public.referral_payout_accounts
  for each row execute function public.reset_payout_account_verification();

-- Attributions -----------------------------------------------------------------

create table public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null
    references public.referral_partners (id) on delete restrict,
  referral_code text not null,
  customer_user_id uuid not null references public.profiles (id) on delete cascade,
  source text,
  status text not null default 'active'
    check (status in ('active', 'expired', 'reversed')),
  attributed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- A customer can only ever be attributed to one partner. This blocks
  -- duplicate attribution and unauthorised changes to referral ownership.
  unique (customer_user_id)
);

create index referral_attributions_partner_idx
  on public.referral_attributions (partner_id, status);
create index referral_attributions_expiry_idx
  on public.referral_attributions (status, expires_at);

-- Payments ---------------------------------------------------------------------

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('cb_' || replace(gen_random_uuid()::text, '-', '')),
  organisation_id uuid references public.organisations (id) on delete set null,
  payer_id uuid not null references public.profiles (id) on delete restrict,
  payer_email text not null,
  purpose payment_purpose not null,
  product_type text,
  product_id uuid,
  description text,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  provider payment_provider not null default 'paystack',
  provider_mode text not null default 'sandbox'
    check (provider_mode in ('sandbox', 'live')),
  provider_reference text unique,
  access_code text,
  checkout_url text,
  status payment_status not null default 'initiated',
  reconciliation_status payment_reconciliation_status not null default 'pending',
  referral_attribution_id uuid
    references public.referral_attributions (id) on delete set null,
  idempotency_key text unique,
  provider_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  refunded_amount_minor_units bigint not null default 0
    check (refunded_amount_minor_units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  last_verified_at timestamptz,
  constraint payment_refund_not_above_amount
    check (refunded_amount_minor_units <= amount_minor_units)
);

create trigger payment_transactions_set_updated_at
  before update on public.payment_transactions
  for each row execute function public.set_updated_at();

create index payment_transactions_payer_idx
  on public.payment_transactions (payer_id, created_at desc);
create index payment_transactions_status_idx
  on public.payment_transactions (status, created_at desc);
create index payment_transactions_reconciliation_idx
  on public.payment_transactions (reconciliation_status, created_at desc);
create index payment_transactions_organisation_idx
  on public.payment_transactions (organisation_id, created_at desc);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider payment_provider not null default 'paystack',
  event_type text not null,
  provider_event_id text not null,
  payload jsonb not null,
  signature_valid boolean not null default false,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  attempts integer not null default 1 check (attempts > 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index payment_webhook_events_status_idx
  on public.payment_webhook_events (processing_status, received_at desc);

create table public.payment_refunds (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null
    references public.payment_transactions (id) on delete restrict,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  reason text not null,
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'succeeded', 'failed')),
  provider_reference text,
  provider_payload jsonb not null default '{}'::jsonb,
  initiated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index payment_refunds_transaction_idx
  on public.payment_refunds (transaction_id, created_at desc);

-- Commission ledger ------------------------------------------------------------

create table public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null
    references public.referral_partners (id) on delete restrict,
  attribution_id uuid references public.referral_attributions (id) on delete set null,
  transaction_id uuid references public.payment_transactions (id) on delete restrict,
  policy_id uuid references public.referral_commission_policies (id) on delete set null,
  entry_type referral_commission_entry not null default 'commission',
  reversal_of_commission_id uuid
    references public.referral_commissions (id) on delete restrict,
  basis text not null,
  gross_amount_minor_units bigint not null,
  commission_amount_minor_units bigint not null,
  currency text not null default 'NGN' check (char_length(currency) = 3),
  status referral_commission_status not null default 'pending',
  status_reason text,
  eligible_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_reversal_link check (
    (entry_type = 'reversal' and reversal_of_commission_id is not null)
    or (entry_type <> 'reversal')
  )
);

create trigger referral_commissions_set_updated_at
  before update on public.referral_commissions
  for each row execute function public.set_updated_at();

-- One earning commission per payment; reversal entries are linked separately.
create unique index referral_commissions_transaction_commission_idx
  on public.referral_commissions (transaction_id)
  where entry_type = 'commission';

create index referral_commissions_partner_idx
  on public.referral_commissions (partner_id, status, created_at desc);
create index referral_commissions_transaction_idx
  on public.referral_commissions (transaction_id);

create table public.referral_commission_events (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null
    references public.referral_commissions (id) on delete cascade,
  from_status referral_commission_status,
  to_status referral_commission_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index referral_commission_events_commission_idx
  on public.referral_commission_events (commission_id, created_at);

-- Payouts ----------------------------------------------------------------------

create table public.referral_payout_requests (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null
    references public.referral_partners (id) on delete restrict,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  status referral_payout_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  decision_reason text,
  provider payment_provider not null default 'paystack',
  provider_transfer_reference text unique,
  provider_recipient_reference text,
  processing_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger referral_payout_requests_set_updated_at
  before update on public.referral_payout_requests
  for each row execute function public.set_updated_at();

create index referral_payout_requests_partner_idx
  on public.referral_payout_requests (partner_id, created_at desc);
create index referral_payout_requests_status_idx
  on public.referral_payout_requests (status, requested_at);

create table public.referral_payout_items (
  payout_request_id uuid not null
    references public.referral_payout_requests (id) on delete cascade,
  commission_id uuid not null
    references public.referral_commissions (id) on delete restrict,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  created_at timestamptz not null default now(),
  primary key (payout_request_id, commission_id)
);

create index referral_payout_items_commission_idx
  on public.referral_payout_items (commission_id);

-- Guards and triggers ----------------------------------------------------------

-- A partner may edit their own display details, but never their code, status or
-- approval metadata. Admin updates go through RLS policies using the
-- referral_rules_manage permission (and therefore still pass this trigger).
create or replace function public.guard_referral_partner_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and old.user_id = auth.uid()
     and not public.has_permission('referral_rules_manage', null) then
    new.user_id = old.user_id;
    new.code = old.code;
    new.status = old.status;
    new.applied_at = old.applied_at;
    new.approved_at = old.approved_at;
    new.approved_by = old.approved_by;
    new.rejected_at = old.rejected_at;
    new.rejection_reason = old.rejection_reason;
    new.suspended_at = old.suspended_at;
    new.suspension_reason = old.suspension_reason;
    new.created_at = old.created_at;
  end if;
  return new;
end;
$$;

create trigger referral_partners_guard_self_update
  before update on public.referral_partners
  for each row execute function public.guard_referral_partner_self_update();

-- Referral codes are generated once and cannot be chosen by the applicant.
create or replace function public.set_referral_partner_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt integer := 0;
begin
  if new.code is null or char_length(trim(new.code)) = 0 then
    loop
      v_code := 'CB' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      exit when not exists (
        select 1 from public.referral_partners where code = v_code
      );
      v_attempt := v_attempt + 1;
      if v_attempt >= 20 then
        raise exception 'Could not allocate a unique referral code';
      end if;
    end loop;
    new.code := v_code;
  else
    new.code := upper(trim(new.code));
  end if;
  return new;
end;
$$;

create trigger referral_partners_set_code
  before insert on public.referral_partners
  for each row execute function public.set_referral_partner_code();

-- Commission financial fields are immutable. Only workflow status fields may
-- change after insert, and only through the functions below.
create or replace function public.guard_commission_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.partner_id is distinct from old.partner_id
     or new.attribution_id is distinct from old.attribution_id
     or new.transaction_id is distinct from old.transaction_id
     or new.policy_id is distinct from old.policy_id
     or new.entry_type is distinct from old.entry_type
     or new.reversal_of_commission_id is distinct from old.reversal_of_commission_id
     or new.basis is distinct from old.basis
     or new.gross_amount_minor_units is distinct from old.gross_amount_minor_units
     or new.commission_amount_minor_units is distinct from old.commission_amount_minor_units
     or new.currency is distinct from old.currency
     or new.created_at is distinct from old.created_at then
    raise exception 'Commission ledger entries are immutable';
  end if;
  return new;
end;
$$;

create trigger referral_commissions_guard_ledger
  before update on public.referral_commissions
  for each row execute function public.guard_commission_ledger();

-- Allowed commission transitions. Anything else is rejected by the database.
create or replace function public.guard_commission_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'pending' then new.status in ('eligible', 'rejected', 'reversed', 'failed')
    when 'eligible' then new.status in ('approved', 'rejected', 'reversed', 'failed')
    when 'approved' then new.status in ('on_hold', 'processing', 'paid', 'reversed', 'failed')
    when 'on_hold' then new.status in ('approved', 'processing', 'paid', 'reversed', 'failed')
    when 'processing' then new.status in ('approved', 'paid', 'failed', 'reversed')
    when 'paid' then new.status in ('reversed')
    when 'failed' then new.status in ('approved', 'reversed')
    when 'rejected' then false
    when 'reversed' then false
    else false
  end;

  if not allowed then
    raise exception 'Illegal commission status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger referral_commissions_guard_status
  before update of status on public.referral_commissions
  for each row execute function public.guard_commission_status();

create or replace function public.record_commission_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.referral_commission_events (
      commission_id, from_status, to_status, actor_id, reason
    ) values (
      new.id, null, new.status, auth.uid(), new.status_reason
    );
  elsif new.status is distinct from old.status then
    insert into public.referral_commission_events (
      commission_id, from_status, to_status, actor_id, reason
    ) values (
      new.id, old.status, new.status, auth.uid(), new.status_reason
    );
  end if;
  return new;
end;
$$;

create trigger referral_commissions_record_event
  after insert or update of status on public.referral_commissions
  for each row execute function public.record_commission_event();

-- Functions --------------------------------------------------------------------

-- Enrol a payer in a paid course after a verified payment. Idempotent, respects
-- the course publication state and enrolment limit, and is only called from
-- trusted server-side payment processing.
create or replace function public.grant_paid_course_enrolment(
  p_course uuid,
  p_user uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course public.courses%rowtype;
  v_enrolment uuid;
  v_count integer;
begin
  select * into v_course from public.courses where id = p_course;
  if not found or v_course.status <> 'published' then
    raise exception 'Course is not available for enrolment';
  end if;

  select id into v_enrolment
  from public.course_enrolments
  where course_id = p_course
    and user_id = p_user
    and status <> 'withdrawn'
  limit 1;

  if v_enrolment is not null then
    return v_enrolment;
  end if;

  if v_course.enrolment_limit is not null then
    select count(*) into v_count
    from public.course_enrolments
    where course_id = p_course
      and status <> 'withdrawn';
    if v_count >= v_course.enrolment_limit then
      raise exception 'Course enrolment limit reached';
    end if;
  end if;

  insert into public.course_enrolments (
    course_id, user_id, status, source, enrolled_at
  ) values (
    p_course, p_user, 'active', 'paid', now()
  )
  returning id into v_enrolment;

  return v_enrolment;
end;
$$;

revoke all on function public.grant_paid_course_enrolment(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.grant_paid_course_enrolment(uuid, uuid)
  to service_role;

-- Attribute a signed-in customer to an approved referral partner. Returns the
-- existing attribution when one exists, so replayed calls are harmless.
create or replace function public.attribute_referral(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_partner public.referral_partners%rowtype;
  v_existing uuid;
  v_window integer;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_partner
  from public.referral_partners
  where upper(code) = upper(trim(p_code))
    and status = 'approved';

  if not found then
    raise exception 'Invalid or inactive referral code';
  end if;

  if v_partner.user_id = v_user then
    raise exception 'Self-referral is not permitted';
  end if;

  select id into v_existing
  from public.referral_attributions
  where customer_user_id = v_user;

  if v_existing is not null then
    return v_existing;
  end if;

  select coalesce(max(attribution_window_days), 30) into v_window
  from public.referral_commission_policies
  where is_active
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date);

  insert into public.referral_attributions (
    partner_id, referral_code, customer_user_id, source, expires_at
  ) values (
    v_partner.id, v_partner.code, v_user, 'link',
    now() + make_interval(days => v_window)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.attribute_referral(text) from public, anon;
grant execute on function public.attribute_referral(text) to authenticated;

-- Apply for the referral partner programme.
create or replace function public.apply_referral_partner(
  p_display_name text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select id into v_id from public.referral_partners where user_id = v_user;
  if v_id is not null then
    return v_id;
  end if;

  select coalesce(nullif(trim(p_display_name), ''), full_name)
    into v_name
    from public.profiles
    where id = v_user;

  insert into public.referral_partners (user_id, display_name, phone)
  values (v_user, v_name, nullif(trim(p_phone), ''))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.apply_referral_partner(text, text) from public, anon;
grant execute on function public.apply_referral_partner(text, text) to authenticated;

-- Finance review of a partner application: approve, reject or suspend.
create or replace function public.review_referral_partner(
  p_partner uuid,
  p_decision text,
  p_reason text default null
)
returns referral_partner_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner public.referral_partners%rowtype;
  v_status referral_partner_status;
begin
  if not public.has_permission('referral_rules_manage', null) then
    raise exception 'Not authorised to review referral partners';
  end if;

  select * into v_partner from public.referral_partners where id = p_partner for update;
  if not found then
    raise exception 'Referral partner not found';
  end if;

  if p_decision = 'approve' then
    if v_partner.status not in ('pending', 'rejected', 'suspended') then
      raise exception 'Partner cannot be approved from status %', v_partner.status;
    end if;
    v_status := 'approved';
    update public.referral_partners
    set status = v_status,
        approved_at = now(),
        approved_by = auth.uid(),
        rejected_at = null,
        rejection_reason = null,
        suspended_at = null,
        suspension_reason = null
    where id = p_partner;
  elsif p_decision = 'reject' then
    if v_partner.status not in ('pending', 'approved') then
      raise exception 'Partner cannot be rejected from status %', v_partner.status;
    end if;
    v_status := 'rejected';
    update public.referral_partners
    set status = v_status,
        rejected_at = now(),
        rejection_reason = nullif(trim(p_reason), '')
    where id = p_partner;
  elsif p_decision = 'suspend' then
    if v_partner.status <> 'approved' then
      raise exception 'Only approved partners can be suspended';
    end if;
    v_status := 'suspended';
    update public.referral_partners
    set status = v_status,
        suspended_at = now(),
        suspension_reason = nullif(trim(p_reason), '')
    where id = p_partner;
  else
    raise exception 'Unknown decision %', p_decision;
  end if;

  return v_status;
end;
$$;

revoke all on function public.review_referral_partner(uuid, text, text) from public, anon;
grant execute on function public.review_referral_partner(uuid, text, text) to authenticated;

-- Verify or reject a partner's beneficiary details before payouts are allowed.
create or replace function public.verify_referral_payout_account(
  p_partner uuid,
  p_verified boolean,
  p_provider_recipient_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_permission('payout_approve', null) then
    raise exception 'Not authorised to verify payout accounts';
  end if;

  update public.referral_payout_accounts
  set verified_at = case when p_verified then now() else null end,
      verified_by = case when p_verified then auth.uid() else null end,
      provider_recipient_code = case
        when p_verified then nullif(trim(p_provider_recipient_code), '')
        else null
      end
  where partner_id = p_partner;

  if not found then
    raise exception 'Payout account not found';
  end if;
end;
$$;

revoke all on function public.verify_referral_payout_account(uuid, boolean, text)
  from public, anon;
grant execute on function public.verify_referral_payout_account(uuid, boolean, text)
  to authenticated;

-- Move pending commissions whose eligibility date has passed to eligible.
-- Safe for any authenticated caller: it cannot release a commission early.
create or replace function public.release_due_commissions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.referral_commissions
  set status = 'eligible',
      status_reason = 'Eligibility date reached'
  where status = 'pending'
    and eligible_at is not null
    and eligible_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.release_due_commissions() from public, anon;
grant execute on function public.release_due_commissions() to authenticated;

-- Finance approves or rejects an eligible commission.
create or replace function public.review_referral_commission(
  p_commission uuid,
  p_decision text,
  p_reason text default null
)
returns referral_commission_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_commission public.referral_commissions%rowtype;
begin
  if not public.has_permission('commission_approve', null) then
    raise exception 'Not authorised to review commissions';
  end if;

  select * into v_commission
  from public.referral_commissions
  where id = p_commission
  for update;

  if not found then
    raise exception 'Commission not found';
  end if;

  if p_decision = 'approve' then
    if v_commission.status <> 'eligible' then
      raise exception 'Only eligible commissions can be approved';
    end if;
    update public.referral_commissions
    set status = 'approved',
        approved_at = now(),
        approved_by = auth.uid(),
        status_reason = coalesce(nullif(trim(p_reason), ''), 'Approved by finance')
    where id = p_commission;
    return 'approved';
  elsif p_decision = 'reject' then
    if v_commission.status not in ('pending', 'eligible') then
      raise exception 'Commission cannot be rejected from status %', v_commission.status;
    end if;
    update public.referral_commissions
    set status = 'rejected',
        status_reason = coalesce(nullif(trim(p_reason), ''), 'Rejected by finance')
    where id = p_commission;
    return 'rejected';
  else
    raise exception 'Unknown decision %', p_decision;
  end if;
end;
$$;

revoke all on function public.review_referral_commission(uuid, text, text)
  from public, anon;
grant execute on function public.review_referral_commission(uuid, text, text)
  to authenticated;

-- Partner requests a payout of every approved commission. Requires verified
-- beneficiary details and the minimum balance configured by policy.
create or replace function public.request_referral_payout()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_partner public.referral_partners%rowtype;
  v_account public.referral_payout_accounts%rowtype;
  v_total bigint := 0;
  v_minimum bigint := 0;
  v_payout uuid;
  v_commission record;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_partner
  from public.referral_partners
  where user_id = v_user
  for update;

  if not found or v_partner.status <> 'approved' then
    raise exception 'An approved referral partner is required';
  end if;

  select * into v_account
  from public.referral_payout_accounts
  where partner_id = v_partner.id;

  if not found or v_account.verified_at is null then
    raise exception 'Verified payout details are required before requesting a payout';
  end if;

  select coalesce(max(minimum_payout_minor_units), 0) into v_minimum
  from public.referral_commission_policies
  where is_active;

  for v_commission in
    select id, commission_amount_minor_units
    from public.referral_commissions
    where partner_id = v_partner.id
      and status = 'approved'
      and entry_type = 'commission'
    order by created_at
    for update
  loop
    v_total := v_total + v_commission.commission_amount_minor_units;
  end loop;

  if v_total <= 0 then
    raise exception 'There are no approved commissions to pay out';
  end if;

  if v_total < v_minimum then
    raise exception 'The payout minimum is % minor units', v_minimum;
  end if;

  insert into public.referral_payout_requests (
    partner_id, amount_minor_units, currency, status, idempotency_key
  ) values (
    v_partner.id, v_total, 'NGN', 'pending',
    'payout_' || replace(gen_random_uuid()::text, '-', '')
  )
  returning id into v_payout;

  insert into public.referral_payout_items (
    payout_request_id, commission_id, amount_minor_units
  )
  select v_payout, id, commission_amount_minor_units
  from public.referral_commissions
  where partner_id = v_partner.id
    and status = 'approved'
    and entry_type = 'commission';

  update public.referral_commissions
  set status = 'on_hold',
      status_reason = 'Payout requested'
  where partner_id = v_partner.id
    and status = 'approved'
    and entry_type = 'commission';

  return v_payout;
end;
$$;

revoke all on function public.request_referral_payout() from public, anon;
grant execute on function public.request_referral_payout() to authenticated;

-- Finance approves or rejects a payout request. Approval does not create a
-- transfer by itself; that is a separate, explicitly authorised step.
create or replace function public.review_referral_payout(
  p_payout uuid,
  p_decision text,
  p_reason text default null
)
returns referral_payout_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.referral_payout_requests%rowtype;
begin
  if not public.has_permission('payout_approve', null) then
    raise exception 'Not authorised to review payouts';
  end if;

  select * into v_payout
  from public.referral_payout_requests
  where id = p_payout
  for update;

  if not found then
    raise exception 'Payout request not found';
  end if;

  if v_payout.status <> 'pending' then
    raise exception 'Payout request is not awaiting review';
  end if;

  if p_decision = 'approve' then
    update public.referral_payout_requests
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        decision_reason = coalesce(nullif(trim(p_reason), ''), 'Approved by finance')
    where id = p_payout;

    update public.referral_commissions c
    set status_reason = 'Payout approved and awaiting transfer'
    from public.referral_payout_items i
    where i.payout_request_id = p_payout
      and c.id = i.commission_id;

    return 'approved';
  elsif p_decision = 'reject' then
    update public.referral_payout_requests
    set status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        decision_reason = coalesce(nullif(trim(p_reason), ''), 'Rejected by finance')
    where id = p_payout;

    update public.referral_commissions c
    set status = 'approved',
        status_reason = 'Payout rejected; commission returned to approved balance'
    from public.referral_payout_items i
    where i.payout_request_id = p_payout
      and c.id = i.commission_id
      and c.status = 'on_hold';

    return 'rejected';
  else
    raise exception 'Unknown decision %', p_decision;
  end if;
end;
$$;

revoke all on function public.review_referral_payout(uuid, text, text)
  from public, anon;
grant execute on function public.review_referral_payout(uuid, text, text)
  to authenticated;

-- Record the outcome of an actual provider transfer. Called only from the
-- server-side payout service.
create or replace function public.record_referral_payout_transfer(
  p_payout uuid,
  p_status text,
  p_provider_reference text default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.referral_payout_requests%rowtype;
begin
  select * into v_payout
  from public.referral_payout_requests
  where id = p_payout
  for update;

  if not found then
    raise exception 'Payout request not found';
  end if;

  if p_status = 'processing' then
    if v_payout.status <> 'approved' then
      raise exception 'Only approved payouts can start processing';
    end if;
    update public.referral_payout_requests
    set status = 'processing',
        processing_at = now(),
        provider_transfer_reference = coalesce(nullif(trim(p_provider_reference), ''), provider_transfer_reference)
    where id = p_payout;

    update public.referral_commissions c
    set status = 'processing',
        status_reason = 'Payout transfer in progress'
    from public.referral_payout_items i
    where i.payout_request_id = p_payout
      and c.id = i.commission_id
      and c.status = 'on_hold';
  elsif p_status = 'paid' then
    if v_payout.status not in ('approved', 'processing') then
      raise exception 'Payout cannot be marked paid from status %', v_payout.status;
    end if;
    update public.referral_payout_requests
    set status = 'paid',
        paid_at = now(),
        provider_transfer_reference = coalesce(nullif(trim(p_provider_reference), ''), provider_transfer_reference)
    where id = p_payout;

    update public.referral_commissions c
    set status = 'paid',
        paid_at = now(),
        status_reason = 'Payout completed'
    from public.referral_payout_items i
    where i.payout_request_id = p_payout
      and c.id = i.commission_id
      and c.status in ('on_hold', 'processing');
  elsif p_status = 'failed' then
    if v_payout.status not in ('approved', 'processing') then
      raise exception 'Payout cannot fail from status %', v_payout.status;
    end if;
    update public.referral_payout_requests
    set status = 'failed',
        failed_at = now(),
        failure_reason = nullif(trim(p_reason), '')
    where id = p_payout;

    update public.referral_commissions c
    set status = 'approved',
        status_reason = 'Payout failed; commission returned to approved balance'
    from public.referral_payout_items i
    where i.payout_request_id = p_payout
      and c.id = i.commission_id
      and c.status in ('on_hold', 'processing');
  else
    raise exception 'Unknown payout status %', p_status;
  end if;
end;
$$;

revoke all on function public.record_referral_payout_transfer(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_referral_payout_transfer(uuid, text, text, text)
  to service_role;

-- Apply a fully verified successful payment. Called only from the server-side
-- payment service, after the provider has confirmed the transaction.
create or replace function public.apply_payment_success(
  p_reference text,
  p_provider_reference text,
  p_amount_minor_units bigint,
  p_currency text,
  p_provider_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.payment_transactions%rowtype;
  v_enrolment uuid;
  v_attr public.referral_attributions%rowtype;
  v_partner public.referral_partners%rowtype;
  v_policy public.referral_commission_policies%rowtype;
  v_commission bigint;
  v_commission_id uuid;
  v_basis text;
begin
  select * into v_tx
  from public.payment_transactions
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Unknown payment reference';
  end if;

  if v_tx.status in ('successful', 'refunded', 'partially_refunded') then
    return jsonb_build_object(
      'status', v_tx.status,
      'transactionId', v_tx.id,
      'alreadyProcessed', true
    );
  end if;

  if v_tx.amount_minor_units <> p_amount_minor_units
     or upper(v_tx.currency) <> upper(p_currency) then
    update public.payment_transactions
    set reconciliation_status = 'mismatch',
        last_verified_at = now(),
        provider_payload = coalesce(p_provider_payload, '{}'::jsonb)
    where id = v_tx.id;

    return jsonb_build_object(
      'status', 'mismatch',
      'transactionId', v_tx.id,
      'expectedAmount', v_tx.amount_minor_units,
      'confirmedAmount', p_amount_minor_units,
      'expectedCurrency', v_tx.currency,
      'confirmedCurrency', p_currency
    );
  end if;

  update public.payment_transactions
  set status = 'successful',
      paid_at = coalesce(paid_at, now()),
      verified_at = now(),
      last_verified_at = now(),
      provider_reference = coalesce(provider_reference, nullif(trim(p_provider_reference), '')),
      reconciliation_status = 'matched',
      provider_payload = coalesce(p_provider_payload, '{}'::jsonb)
  where id = v_tx.id;

  if v_tx.purpose = 'course_purchase' and v_tx.product_id is not null then
    begin
      v_enrolment := public.grant_paid_course_enrolment(
        v_tx.product_id, v_tx.payer_id
      );
    exception when others then
      -- The payment remains successful; enrolment is reconciled by support.
      v_enrolment := null;
    end;
  end if;

  if v_tx.referral_attribution_id is not null then
    select * into v_attr
    from public.referral_attributions
    where id = v_tx.referral_attribution_id;

    if found and v_attr.status = 'active' and v_attr.expires_at > now() then
      select * into v_partner
      from public.referral_partners
      where id = v_attr.partner_id
        and status = 'approved';

      if found and v_partner.user_id <> v_tx.payer_id then
        select * into v_policy
        from public.referral_commission_policies
        where is_active
          and effective_from <= current_date
          and (effective_to is null or effective_to >= current_date)
          and v_tx.purpose = any(eligible_purposes)
        order by effective_from desc, created_at desc
        limit 1;

        if found then
          if v_policy.commission_type = 'percentage' then
            v_commission := floor(
              p_amount_minor_units::numeric * v_policy.percentage_bps / 10000
            )::bigint;
            v_basis := 'percentage:' || v_policy.percentage_bps || 'bps';
          else
            v_commission := least(
              v_policy.fixed_amount_minor_units,
              p_amount_minor_units
            );
            v_basis := 'fixed:' || v_policy.fixed_amount_minor_units || 'minor_units';
          end if;

          if v_commission > 0 then
            insert into public.referral_commissions (
              partner_id,
              attribution_id,
              transaction_id,
              policy_id,
              entry_type,
              basis,
              gross_amount_minor_units,
              commission_amount_minor_units,
              currency,
              status,
              status_reason,
              eligible_at
            ) values (
              v_partner.id,
              v_attr.id,
              v_tx.id,
              v_policy.id,
              'commission',
              v_basis,
              p_amount_minor_units,
              v_commission,
              v_tx.currency,
              'pending',
              'Created from verified payment',
              now() + make_interval(days => v_policy.payout_delay_days)
            )
            on conflict do nothing
            returning id into v_commission_id;
          end if;
        end if;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'status', 'successful',
    'transactionId', v_tx.id,
    'enrolmentId', v_enrolment,
    'commissionId', v_commission_id,
    'alreadyProcessed', false
  );
end;
$$;

revoke all on function public.apply_payment_success(text, text, bigint, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_payment_success(text, text, bigint, text, jsonb)
  to service_role;

-- Mark a payment as failed or cancelled after provider verification.
create or replace function public.apply_payment_failure(
  p_reference text,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('failed', 'cancelled') then
    raise exception 'Unsupported payment failure status';
  end if;

  update public.payment_transactions
  set status = p_status::payment_status,
      failed_at = now(),
      last_verified_at = now(),
      reconciliation_status = 'not_applicable',
      metadata = metadata || jsonb_build_object('failure_reason', coalesce(p_reason, ''))
  where reference = p_reference
    and status in ('initiated', 'pending');
end;
$$;

revoke all on function public.apply_payment_failure(text, text, text)
  from public, anon, authenticated;
grant execute on function public.apply_payment_failure(text, text, text)
  to service_role;

-- Apply a refund (or partial refund) and keep the commission ledger honest.
create or replace function public.apply_payment_refund(
  p_reference text,
  p_amount_minor_units bigint,
  p_provider_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.payment_transactions%rowtype;
  v_refunded bigint;
  v_status payment_status;
  v_commission public.referral_commissions%rowtype;
  v_reversal uuid;
begin
  select * into v_tx
  from public.payment_transactions
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Unknown payment reference';
  end if;

  if v_tx.status not in ('successful', 'partially_refunded') then
    raise exception 'Only successful payments can be refunded';
  end if;

  v_refunded := v_tx.refunded_amount_minor_units + p_amount_minor_units;
  if p_amount_minor_units <= 0 or v_refunded > v_tx.amount_minor_units then
    raise exception 'Refund amount is invalid';
  end if;

  v_status := case
    when v_refunded = v_tx.amount_minor_units then 'refunded'::payment_status
    else 'partially_refunded'::payment_status
  end;

  update public.payment_transactions
  set refunded_amount_minor_units = v_refunded,
      status = v_status,
      reconciliation_status = 'matched',
      last_verified_at = now()
  where id = v_tx.id;

  if v_status = 'refunded' then
    for v_commission in
      select * from public.referral_commissions
      where transaction_id = v_tx.id
        and entry_type = 'commission'
      for update
    loop
      if v_commission.status in ('pending', 'eligible', 'approved',
                                 'on_hold', 'processing') then
        update public.referral_commissions
        set status = 'reversed',
            reversed_at = now(),
            status_reason = 'Payment refunded before payout'
        where id = v_commission.id;
      elsif v_commission.status = 'paid' then
        insert into public.referral_commissions (
          partner_id,
          attribution_id,
          transaction_id,
          policy_id,
          entry_type,
          reversal_of_commission_id,
          basis,
          gross_amount_minor_units,
          commission_amount_minor_units,
          currency,
          status,
          status_reason,
          reversed_at
        ) values (
          v_commission.partner_id,
          v_commission.attribution_id,
          v_commission.transaction_id,
          v_commission.policy_id,
          'reversal',
          v_commission.id,
          'reversal',
          -v_commission.gross_amount_minor_units,
          -v_commission.commission_amount_minor_units,
          v_commission.currency,
          'reversed',
          'Payment refunded after payout; reversal recorded against original commission',
          now()
        )
        returning id into v_reversal;
      end if;
    end loop;

    -- A payout that has not been sent yet must not proceed with reversed items.
    update public.referral_payout_requests p
    set status = 'cancelled',
        decision_reason = 'Cancelled automatically because a linked payment was refunded',
        reviewed_at = now()
    where p.status in ('pending', 'approved')
      and exists (
        select 1
        from public.referral_payout_items i
        join public.referral_commissions c on c.id = i.commission_id
        where i.payout_request_id = p.id
          and c.status = 'reversed'
      );

    update public.referral_commissions c
    set status = 'approved',
        status_reason = 'Payout cancelled after a linked payment was refunded'
    from public.referral_payout_items i
    join public.referral_payout_requests p on p.id = i.payout_request_id
    where i.commission_id = c.id
      and p.status = 'cancelled'
      and c.status = 'on_hold';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'transactionId', v_tx.id,
    'refundedAmount', v_refunded,
    'reversalId', v_reversal
  );
end;
$$;

revoke all on function public.apply_payment_refund(text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.apply_payment_refund(text, bigint, text)
  to service_role;

-- Row Level Security -----------------------------------------------------------

alter table public.referral_commission_policies enable row level security;
alter table public.referral_partners enable row level security;
alter table public.referral_payout_accounts enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.referral_commissions enable row level security;
alter table public.referral_commission_events enable row level security;
alter table public.referral_payout_requests enable row level security;
alter table public.referral_payout_items enable row level security;

-- Policies: active policies are readable; only referral rules managers write.
create policy referral_policies_select on public.referral_commission_policies
  for select using (
    public.is_super_admin()
    or public.has_permission('referral_rules_manage', null)
    or (is_active and auth.uid() is not null)
  );

create policy referral_policies_write on public.referral_commission_policies
  for all using (public.has_permission('referral_rules_manage', null))
  with check (public.has_permission('referral_rules_manage', null));

-- Partners: own record, finance reviewers and platform admins.
create policy referral_partners_select on public.referral_partners
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('referral_rules_manage', null)
    or public.has_permission('commission_approve', null)
    or public.has_permission('payout_approve', null)
  );

create policy referral_partners_update_own on public.referral_partners
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy referral_partners_manage on public.referral_partners
  for all using (public.has_permission('referral_rules_manage', null))
  with check (public.has_permission('referral_rules_manage', null));

-- Beneficiary accounts: own details; finance can read, but cannot be edited by
-- other users.
create policy referral_payout_accounts_select on public.referral_payout_accounts
  for select using (
    exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
    or public.is_super_admin()
    or public.has_permission('payout_approve', null)
  );

create policy referral_payout_accounts_insert on public.referral_payout_accounts
  for insert with check (
    exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

create policy referral_payout_accounts_update on public.referral_payout_accounts
  for update using (
    exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

-- Attributions: the partner sees their own referrals; the customer sees their
-- own attribution; finance sees everything. Writes only through the RPC.
create policy referral_attributions_select on public.referral_attributions
  for select using (
    customer_user_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('commission_approve', null)
    or public.has_permission('referral_rules_manage', null)
    or exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

-- Payments: payer, owning organisation finance staff, and finance reviewers.
create policy payment_transactions_select on public.payment_transactions
  for select using (
    payer_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('payment_review', null)
    or public.has_permission('payout_approve', null)
    or (
      organisation_id is not null
      and public.has_permission('financial_report_view', organisation_id)
    )
  );

-- No authenticated writes: transaction state is only changed by the server-side
-- payment service (service role) after provider verification.

create policy payment_webhook_events_select on public.payment_webhook_events
  for select using (
    public.is_super_admin()
    or public.has_permission('payment_review', null)
  );

create policy payment_refunds_select on public.payment_refunds
  for select using (
    exists (
      select 1 from public.payment_transactions t
      where t.id = transaction_id
        and t.payer_id = auth.uid()
    )
    or public.is_super_admin()
    or public.has_permission('refund_process', null)
  );

-- Commissions: partner sees their ledger; finance sees everything. No writes.
create policy referral_commissions_select on public.referral_commissions
  for select using (
    public.is_super_admin()
    or public.has_permission('commission_approve', null)
    or public.has_permission('payout_approve', null)
    or exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

create policy referral_commission_events_select on public.referral_commission_events
  for select using (
    public.is_super_admin()
    or public.has_permission('commission_approve', null)
    or exists (
      select 1
      from public.referral_commissions c
      join public.referral_partners p on p.id = c.partner_id
      where c.id = commission_id and p.user_id = auth.uid()
    )
  );

create policy referral_payout_requests_select on public.referral_payout_requests
  for select using (
    public.is_super_admin()
    or public.has_permission('payout_approve', null)
    or exists (
      select 1 from public.referral_partners p
      where p.id = partner_id and p.user_id = auth.uid()
    )
  );

create policy referral_payout_items_select on public.referral_payout_items
  for select using (
    public.is_super_admin()
    or public.has_permission('payout_approve', null)
    or exists (
      select 1
      from public.referral_payout_requests r
      join public.referral_partners p on p.id = r.partner_id
      where r.id = payout_request_id and p.user_id = auth.uid()
    )
  );

-- Finance officers administer referral rules as well as commissions/payouts.
insert into public.role_permissions (role_key, permission_key)
values ('finance_officer', 'referral_rules_manage')
on conflict do nothing;

-- A partner's commission balance view, used by the dashboard and payout form.
create or replace view public.referral_partner_balances
with (security_invoker = true)
as
select
  p.id as partner_id,
  p.user_id,
  coalesce(sum(c.commission_amount_minor_units) filter (
    where c.status = 'approved' and c.entry_type = 'commission'
  ), 0)::bigint as approved_minor_units,
  coalesce(sum(c.commission_amount_minor_units) filter (
    where c.status in ('pending', 'eligible') and c.entry_type = 'commission'
  ), 0)::bigint as pending_minor_units,
  coalesce(sum(c.commission_amount_minor_units) filter (
    where c.status in ('on_hold', 'processing') and c.entry_type = 'commission'
  ), 0)::bigint as in_payout_minor_units,
  coalesce(sum(c.commission_amount_minor_units) filter (
    where c.status = 'paid' and c.entry_type = 'commission'
  ), 0)::bigint as paid_minor_units
from public.referral_partners p
left join public.referral_commissions c on c.partner_id = p.id
group by p.id, p.user_id;
