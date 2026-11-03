-- =============================================================================
-- CareBridge - Phase 8: charity, donations and scholarships
-- Migration: 0021_charity_scholarships.sql
--
-- Charity campaigns, donations, fund allocation, campaign expenses, scholarship
-- programmes/applications/awards and impact reports.
--
-- Financial separation is explicit: donations are recorded in their own table
-- and are never treated as unrestricted revenue. Allocations and expenses are
-- append-only, and campaign funds are not transferred to beneficiaries without an
-- approved award record.
-- =============================================================================

-- Permissions ------------------------------------------------------------------

insert into public.permissions (key, category, description) values
  ('scholarship_manage', 'scholarships', 'Create programmes and award scholarships'),
  ('scholarship_review', 'scholarships', 'Review scholarship applications')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('super_admin', 'scholarship_manage'),
  ('super_admin', 'scholarship_review'),
  ('charity_admin', 'scholarship_manage'),
  ('charity_admin', 'scholarship_review'),
  ('compliance_officer', 'charity_campaign_approve'),
  ('compliance_officer', 'scholarship_review')
on conflict do nothing;

-- Enums ------------------------------------------------------------------------

create type charity_campaign_status as enum (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'completed',
  'archived'
);

create type campaign_review_decision as enum (
  'approved',
  'rejected',
  'changes_requested'
);

create type donation_status as enum (
  'pending',
  'successful',
  'partially_refunded',
  'refunded',
  'failed'
);

create type campaign_allocation_type as enum ('allocation', 'release');

create type campaign_expense_status as enum (
  'pending',
  'approved',
  'paid',
  'void'
);

create type scholarship_coverage as enum ('full', 'partial');

create type scholarship_programme_status as enum (
  'draft',
  'open',
  'closed',
  'archived'
);

create type scholarship_application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'approved',
  'rejected',
  'withdrawn'
);

create type scholarship_award_status as enum (
  'awarded',
  'accepted',
  'active',
  'completed',
  'withdrawn',
  'revoked'
);

-- Campaigns --------------------------------------------------------------------

create table public.charity_campaigns (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  slug text not null unique,
  title text not null,
  purpose text not null,
  description text,
  beneficiary_criteria text,
  funding_target_minor_units bigint not null
    check (funding_target_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  starts_on date not null default current_date,
  ends_on date,
  status charity_campaign_status not null default 'draft',
  is_public boolean not null default true,
  sponsorship_options jsonb not null default '[]'::jsonb,
  supporting_documents jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint charity_campaign_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint charity_campaign_dates check (
    ends_on is null or ends_on >= starts_on
  )
);

create index charity_campaigns_org_idx
  on public.charity_campaigns (organisation_id, status);
create index charity_campaigns_public_idx
  on public.charity_campaigns (status, is_public, starts_on, ends_on);

create trigger charity_campaigns_set_updated_at
  before update on public.charity_campaigns
  for each row execute function public.set_updated_at();

create or replace function public.guard_charity_campaign_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if new.status is distinct from old.status then
    allowed := case old.status
      when 'draft' then new.status in ('pending_approval', 'archived')
      when 'pending_approval' then new.status in ('approved', 'rejected', 'draft')
      when 'rejected' then new.status in ('draft', 'archived')
      when 'approved' then new.status in ('completed', 'archived')
      when 'completed' then new.status in ('archived')
      when 'archived' then false
      else false
    end;

    if not allowed then
      raise exception 'Illegal campaign status transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'approved' then
      if not public.has_permission('charity_campaign_approve', old.organisation_id) then
        raise exception 'Not authorised to approve charity campaigns';
      end if;
      new.approved_by := auth.uid();
      new.approved_at := now();
      if new.is_public and new.published_at is null then
        new.published_at := now();
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger charity_campaigns_guard_status
  before update of status on public.charity_campaigns
  for each row execute function public.guard_charity_campaign_status();

create table public.campaign_reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  campaign_id uuid not null
    references public.charity_campaigns (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision campaign_review_decision not null,
  notes text,
  created_at timestamptz not null default now()
);

create index campaign_reviews_campaign_idx
  on public.campaign_reviews (campaign_id, created_at desc);

create or replace function public.set_campaign_review_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.charity_campaigns
  where id = new.campaign_id;

  if v_org is null then
    raise exception 'Campaign does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger campaign_reviews_set_scope
  before insert or update of campaign_id, organisation_id on public.campaign_reviews
  for each row execute function public.set_campaign_review_scope();

-- Donations --------------------------------------------------------------------

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  campaign_id uuid not null
    references public.charity_campaigns (id) on delete restrict,
  donor_id uuid references public.profiles (id) on delete set null,
  payment_transaction_id uuid unique
    references public.payment_transactions (id) on delete set null,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  refunded_amount_minor_units bigint not null default 0
    check (refunded_amount_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  status donation_status not null default 'pending',
  is_public boolean not null default false,
  donor_display_name text,
  message text,
  receipt_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donations_refund_not_above_amount check (
    refunded_amount_minor_units <= amount_minor_units
  )
);

create index donations_campaign_idx
  on public.donations (campaign_id, status, created_at desc);
create index donations_donor_idx
  on public.donations (donor_id, created_at desc);
create index donations_org_idx
  on public.donations (organisation_id, created_at desc);

create trigger donations_set_updated_at
  before update on public.donations
  for each row execute function public.set_updated_at();

-- Donation rows are created from verified payment transactions. A browser
-- redirect alone never creates a donation.
create or replace function public.sync_donation_from_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign_org uuid;
  v_status donation_status;
begin
  if new.purpose <> 'donation'
     or new.product_type is distinct from 'charity_campaign'
     or new.product_id is null then
    return new;
  end if;

  select organisation_id into v_campaign_org
  from public.charity_campaigns
  where id = new.product_id;

  if v_campaign_org is null then
    return new;
  end if;

  v_status := case new.status
    when 'successful' then 'successful'
    when 'partially_refunded' then 'partially_refunded'
    when 'refunded' then 'refunded'
    when 'failed' then 'failed'
    when 'cancelled' then 'failed'
    else 'pending'
  end;

  -- The guard below protects financial fields from donor edits. Mark this
  -- transaction as a trusted payment sync so the trigger can write them.
  perform set_config('carebridge.donation_sync', 'on', true);

  insert into public.donations (
    organisation_id,
    campaign_id,
    donor_id,
    payment_transaction_id,
    amount_minor_units,
    refunded_amount_minor_units,
    currency,
    status,
    is_public,
    donor_display_name,
    message,
    receipt_reference,
    paid_at
  ) values (
    v_campaign_org,
    new.product_id,
    new.payer_id,
    new.id,
    new.amount_minor_units,
    new.refunded_amount_minor_units,
    new.currency,
    v_status,
    coalesce((new.metadata ->> 'public_acknowledgement')::boolean, false),
    nullif(new.metadata ->> 'donor_display_name', ''),
    nullif(new.metadata ->> 'donor_message', ''),
    'RCPT-' || upper(new.reference),
    new.paid_at
  )
  on conflict (payment_transaction_id) do update
  set status = excluded.status,
      amount_minor_units = excluded.amount_minor_units,
      refunded_amount_minor_units = excluded.refunded_amount_minor_units,
      paid_at = coalesce(public.donations.paid_at, excluded.paid_at);

  perform set_config('carebridge.donation_sync', 'off', true);
  return new;
end;
$$;

create trigger payment_transactions_sync_donation
  after insert or update of status, refunded_amount_minor_units
  on public.payment_transactions
  for each row execute function public.sync_donation_from_payment();

-- Donors may change only their acknowledgement preference and message after a
-- donation exists; financial fields are controlled by the payment trigger.
create or replace function public.guard_donation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and coalesce(current_setting('carebridge.donation_sync', true), '') <> 'on' then
    if new.amount_minor_units is distinct from old.amount_minor_units
       or new.refunded_amount_minor_units is distinct from old.refunded_amount_minor_units
       or new.status is distinct from old.status
       or new.campaign_id is distinct from old.campaign_id
       or new.donor_id is distinct from old.donor_id
       or new.payment_transaction_id is distinct from old.payment_transaction_id
       or new.receipt_reference is distinct from old.receipt_reference then
      raise exception 'Donation financial fields are immutable';
    end if;
  end if;
  return new;
end;
$$;

create trigger donations_guard_financial_fields
  before update on public.donations
  for each row execute function public.guard_donation_fields();

-- Fund allocation and campaign expenses ----------------------------------------

create table public.campaign_allocations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  campaign_id uuid not null
    references public.charity_campaigns (id) on delete restrict,
  allocation_type campaign_allocation_type not null default 'allocation',
  category text not null,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  notes text,
  allocated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index campaign_allocations_campaign_idx
  on public.campaign_allocations (campaign_id, created_at desc);

create or replace function public.set_campaign_allocation_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.charity_campaigns
  where id = new.campaign_id;

  if v_org is null then
    raise exception 'Campaign does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger campaign_allocations_set_scope
  before insert or update of campaign_id, organisation_id on public.campaign_allocations
  for each row execute function public.set_campaign_allocation_scope();

create or replace function public.guard_campaign_allocation_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Campaign allocations are append-only; record a release instead';
end;
$$;

create trigger campaign_allocations_guard_history
  before update or delete on public.campaign_allocations
  for each row execute function public.guard_campaign_allocation_history();

create table public.campaign_expenses (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  campaign_id uuid not null
    references public.charity_campaigns (id) on delete restrict,
  category text not null,
  description text,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  incurred_on date not null default current_date,
  payee text,
  receipt_reference text,
  status campaign_expense_status not null default 'pending',
  recorded_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index campaign_expenses_campaign_idx
  on public.campaign_expenses (campaign_id, status, incurred_on desc);

create or replace function public.set_campaign_expense_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.charity_campaigns
  where id = new.campaign_id;

  if v_org is null then
    raise exception 'Campaign does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger campaign_expenses_set_scope
  before insert or update of campaign_id, organisation_id on public.campaign_expenses
  for each row execute function public.set_campaign_expense_scope();

create or replace function public.guard_campaign_expense_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Campaign expenses are append-only; record a correcting entry instead';
end;
$$;

create trigger campaign_expenses_guard_history
  before update or delete on public.campaign_expenses
  for each row execute function public.guard_campaign_expense_history();

-- Scholarship programmes -------------------------------------------------------

create table public.scholarship_programmes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  eligibility text,
  coverage scholarship_coverage not null default 'partial',
  max_award_minor_units bigint not null check (max_award_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  course_id uuid references public.courses (id) on delete set null,
  opens_on date not null default current_date,
  closes_on date,
  status scholarship_programme_status not null default 'draft',
  is_public boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scholarship_programme_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint scholarship_programme_dates check (
    closes_on is null or closes_on >= opens_on
  )
);

create index scholarship_programmes_org_idx
  on public.scholarship_programmes (organisation_id, status);

create trigger scholarship_programmes_set_updated_at
  before update on public.scholarship_programmes
  for each row execute function public.set_updated_at();

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  programme_id uuid not null
    references public.scholarship_programmes (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  statement text not null,
  evidence_references jsonb not null default '[]'::jsonb,
  status scholarship_application_status not null default 'submitted',
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, applicant_id)
);

create index scholarship_applications_programme_idx
  on public.scholarship_applications (programme_id, status);
create index scholarship_applications_applicant_idx
  on public.scholarship_applications (applicant_id, created_at desc);

create trigger scholarship_applications_set_updated_at
  before update on public.scholarship_applications
  for each row execute function public.set_updated_at();

create or replace function public.set_scholarship_application_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.scholarship_programmes
  where id = new.programme_id;

  if v_org is null then
    raise exception 'Scholarship programme does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger scholarship_applications_set_scope
  before insert or update of programme_id, organisation_id on public.scholarship_applications
  for each row execute function public.set_scholarship_application_scope();

-- Applicants may edit their own submission and withdraw. Decisions belong to
-- authorised reviewers.
create or replace function public.guard_scholarship_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_reviewer boolean := public.has_permission(
    'scholarship_review', old.organisation_id
  );
begin
  -- Trusted server-side operations (awarding, data repair) run without a user
  -- session and may set the approved status directly.
  if auth.uid() is null then
    return new;
  end if;

  if old.applicant_id = auth.uid() and not is_reviewer then
    if old.status not in ('submitted', 'under_review') then
      raise exception 'This application can no longer be changed';
    end if;

    if new.status is distinct from old.status and new.status <> 'withdrawn' then
      raise exception 'Applicants may only withdraw their application';
    end if;

    new.applicant_id := old.applicant_id;
    new.programme_id := old.programme_id;
    new.reviewer_id := old.reviewer_id;
    new.reviewed_at := old.reviewed_at;
    new.decision_notes := old.decision_notes;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'submitted' and new.status in ('under_review', 'shortlisted', 'approved', 'rejected', 'withdrawn'))
      or (old.status = 'under_review' and new.status in ('shortlisted', 'approved', 'rejected', 'withdrawn'))
      or (old.status = 'shortlisted' and new.status in ('approved', 'rejected', 'withdrawn'))
    ) then
      raise exception 'Illegal scholarship application transition: % -> %', old.status, new.status;
    end if;

    if new.status in ('under_review', 'shortlisted', 'approved', 'rejected') then
      new.reviewer_id := coalesce(auth.uid(), new.reviewer_id);
      new.reviewed_at := now();
    end if;
  end if;

  return new;
end;
$$;

create trigger scholarship_applications_guard
  before update on public.scholarship_applications
  for each row execute function public.guard_scholarship_application();

create table public.scholarship_awards (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  application_id uuid not null unique
    references public.scholarship_applications (id) on delete restrict,
  programme_id uuid not null
    references public.scholarship_programmes (id) on delete restrict,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  coverage scholarship_coverage not null default 'partial',
  course_id uuid references public.courses (id) on delete set null,
  status scholarship_award_status not null default 'awarded',
  awarded_by uuid references public.profiles (id) on delete set null,
  awarded_at timestamptz not null default now(),
  accepted_at timestamptz,
  completion_outcome text,
  internship_outcome text,
  employment_outcome text,
  outcome_shareable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scholarship_awards_programme_idx
  on public.scholarship_awards (programme_id, status);
create index scholarship_awards_applicant_idx
  on public.scholarship_awards (applicant_id, created_at desc);

create trigger scholarship_awards_set_updated_at
  before update on public.scholarship_awards
  for each row execute function public.set_updated_at();

create or replace function public.set_scholarship_award_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.scholarship_applications%rowtype;
begin
  select * into v_application
  from public.scholarship_applications
  where id = new.application_id;

  if not found then
    raise exception 'Scholarship application does not exist';
  end if;

  new.organisation_id := v_application.organisation_id;
  new.programme_id := v_application.programme_id;
  new.applicant_id := v_application.applicant_id;
  return new;
end;
$$;

create trigger scholarship_awards_set_scope
  before insert or update of application_id on public.scholarship_awards
  for each row execute function public.set_scholarship_award_scope();

create or replace function public.guard_scholarship_award_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean := false;
begin
  if new.status is distinct from old.status then
    allowed := case old.status
      when 'awarded' then new.status in ('accepted', 'withdrawn', 'revoked')
      when 'accepted' then new.status in ('active', 'withdrawn', 'revoked')
      when 'active' then new.status in ('completed', 'withdrawn', 'revoked')
      when 'completed' then false
      when 'withdrawn' then false
      when 'revoked' then false
      else false
    end;

    if not allowed then
      raise exception 'Illegal scholarship award transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'accepted' and new.accepted_at is null then
      new.accepted_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger scholarship_awards_guard_status
  before update of status on public.scholarship_awards
  for each row execute function public.guard_scholarship_award_status();

-- Awarding an application marks it approved and, when the award is accepted or
-- active and a course is named, creates a scholarship enrolment.
create or replace function public.apply_scholarship_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scholarship_applications
  set status = 'approved',
      reviewer_id = coalesce(new.awarded_by, reviewer_id),
      reviewed_at = coalesce(reviewed_at, now())
  where id = new.application_id
    and status <> 'approved';

  if new.course_id is not null
     and new.status in ('accepted', 'active', 'completed') then
    insert into public.course_enrolments (
      course_id, user_id, status, source, enrolled_at
    )
    select new.course_id, new.applicant_id, 'active', 'scholarship', now()
    where not exists (
      select 1 from public.course_enrolments
      where course_id = new.course_id
        and user_id = new.applicant_id
        and status <> 'withdrawn'
    );
  end if;

  return new;
end;
$$;

create trigger scholarship_awards_apply
  after insert or update of status, course_id on public.scholarship_awards
  for each row execute function public.apply_scholarship_award();

-- Impact reports ---------------------------------------------------------------

create table public.impact_reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  campaign_id uuid not null
    references public.charity_campaigns (id) on delete cascade,
  title text not null,
  summary text,
  metrics jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index impact_reports_campaign_idx
  on public.impact_reports (campaign_id, is_published, created_at desc);

create trigger impact_reports_set_updated_at
  before update on public.impact_reports
  for each row execute function public.set_updated_at();

create or replace function public.set_impact_report_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.charity_campaigns
  where id = new.campaign_id;

  if v_org is null then
    raise exception 'Campaign does not exist';
  end if;

  new.organisation_id := v_org;

  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger impact_reports_set_scope
  before insert or update of campaign_id, organisation_id, is_published on public.impact_reports
  for each row execute function public.set_impact_report_scope();

-- Row Level Security -----------------------------------------------------------

alter table public.charity_campaigns enable row level security;
alter table public.campaign_reviews enable row level security;
alter table public.donations enable row level security;
alter table public.campaign_allocations enable row level security;
alter table public.campaign_expenses enable row level security;
alter table public.scholarship_programmes enable row level security;
alter table public.scholarship_applications enable row level security;
alter table public.scholarship_awards enable row level security;
alter table public.impact_reports enable row level security;

create policy charity_campaigns_select on public.charity_campaigns
  for select using (
    (is_public and status = 'approved')
    or public.is_super_admin()
    or public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('charity_campaign_approve', organisation_id)
    or public.has_permission('donor_report_view', organisation_id)
  );

create policy charity_campaigns_insert on public.charity_campaigns
  for insert with check (
    public.has_permission('charity_campaign_manage', organisation_id)
  );

create policy charity_campaigns_update on public.charity_campaigns
  for update using (
    public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('charity_campaign_approve', organisation_id)
  )
  with check (
    public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('charity_campaign_approve', organisation_id)
  );

create policy campaign_reviews_select on public.campaign_reviews
  for select using (
    public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('charity_campaign_approve', organisation_id)
    or public.has_permission('donor_report_view', organisation_id)
  );

create policy campaign_reviews_insert on public.campaign_reviews
  for insert with check (
    public.has_permission('charity_campaign_approve', organisation_id)
  );

-- Donations: donors see their own; charity staff with reporting permission see
-- their organisation's. Financial rows are written by the payment trigger only.
create policy donations_select on public.donations
  for select using (
    donor_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('donor_report_view', organisation_id)
    or public.has_permission('charity_campaign_manage', organisation_id)
  );

create policy donations_update_own on public.donations
  for update using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

create policy campaign_allocations_select on public.campaign_allocations
  for select using (
    public.has_permission('donor_report_view', organisation_id)
    or public.has_permission('charity_campaign_manage', organisation_id)
  );

create policy campaign_allocations_insert on public.campaign_allocations
  for insert with check (
    public.has_permission('charity_campaign_manage', organisation_id)
  );

create policy campaign_expenses_select on public.campaign_expenses
  for select using (
    public.has_permission('donor_report_view', organisation_id)
    or public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy campaign_expenses_insert on public.campaign_expenses
  for insert with check (
    public.has_permission('charity_campaign_manage', organisation_id)
  );

create policy scholarship_programmes_select on public.scholarship_programmes
  for select using (
    (is_public and status = 'open')
    or public.is_super_admin()
    or public.has_permission('scholarship_manage', organisation_id)
    or public.has_permission('scholarship_review', organisation_id)
  );

create policy scholarship_programmes_write on public.scholarship_programmes
  for all using (
    public.has_permission('scholarship_manage', organisation_id)
  )
  with check (
    public.has_permission('scholarship_manage', organisation_id)
  );

create policy scholarship_applications_select on public.scholarship_applications
  for select using (
    applicant_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('scholarship_review', organisation_id)
    or public.has_permission('scholarship_manage', organisation_id)
  );

create policy scholarship_applications_insert on public.scholarship_applications
  for insert with check (
    applicant_id = auth.uid()
    and exists (
      select 1 from public.scholarship_programmes p
      where p.id = programme_id
        and p.status = 'open'
        and p.opens_on <= current_date
        and (p.closes_on is null or p.closes_on >= current_date)
    )
  );

create policy scholarship_applications_update on public.scholarship_applications
  for update using (
    applicant_id = auth.uid()
    or public.has_permission('scholarship_review', organisation_id)
    or public.has_permission('scholarship_manage', organisation_id)
  )
  with check (
    applicant_id = auth.uid()
    or public.has_permission('scholarship_review', organisation_id)
    or public.has_permission('scholarship_manage', organisation_id)
  );

create policy scholarship_awards_select on public.scholarship_awards
  for select using (
    applicant_id = auth.uid()
    or public.is_super_admin()
    or public.has_permission('scholarship_review', organisation_id)
    or public.has_permission('scholarship_manage', organisation_id)
  );

create policy scholarship_awards_write on public.scholarship_awards
  for all using (
    public.has_permission('scholarship_manage', organisation_id)
  )
  with check (
    public.has_permission('scholarship_manage', organisation_id)
  );

create policy impact_reports_select on public.impact_reports
  for select using (
    (is_published)
    or public.is_super_admin()
    or public.has_permission('charity_campaign_manage', organisation_id)
    or public.has_permission('charity_campaign_approve', organisation_id)
    or public.has_permission('donor_report_view', organisation_id)
  );

create policy impact_reports_write on public.impact_reports
  for all using (
    public.has_permission('charity_campaign_manage', organisation_id)
  )
  with check (
    public.has_permission('charity_campaign_manage', organisation_id)
  );

-- Privileges -------------------------------------------------------------------
-- RLS remains authoritative; these grants only make the policies reachable.

grant select on public.charity_campaigns to anon;
grant select on public.scholarship_programmes to anon;
grant select on public.impact_reports to anon;

grant select, insert, update on public.charity_campaigns to authenticated;
grant select, insert on public.campaign_reviews to authenticated;
grant select, update on public.donations to authenticated;
grant select, insert on public.campaign_allocations to authenticated;
grant select, insert on public.campaign_expenses to authenticated;
grant select, insert, update on public.scholarship_programmes to authenticated;
grant select, insert, update on public.scholarship_applications to authenticated;
grant select, insert, update on public.scholarship_awards to authenticated;
grant select, insert, update on public.impact_reports to authenticated;


-- Public reporting views -------------------------------------------------------

-- Aggregate progress for approved public campaigns. This view is intentionally
-- security-definer (the default): it exposes only aggregate amounts and never
-- donor identities, while the underlying donation rows remain protected.
create or replace view public.charity_public_campaign_progress as
select
  c.id as campaign_id,
  c.slug,
  c.title,
  c.purpose,
  c.description,
  c.funding_target_minor_units,
  c.currency,
  c.starts_on,
  c.ends_on,
  coalesce(sum(d.amount_minor_units - d.refunded_amount_minor_units), 0)::bigint
    as received_minor_units,
  count(d.id)::integer as donation_count,
  case
    when c.funding_target_minor_units > 0 then
      round(
        coalesce(sum(d.amount_minor_units - d.refunded_amount_minor_units), 0)::numeric
        * 100 / c.funding_target_minor_units,
        1
      )
    else 0
  end as progress_percent
from public.charity_campaigns c
left join public.donations d
  on d.campaign_id = c.id
  and d.status in ('successful', 'partially_refunded')
where c.is_public
  and c.status in ('approved', 'completed')
group by c.id;

-- Public acknowledgement list. Only donations explicitly marked public are
-- included, and no donor id or contact detail is exposed.
create or replace view public.charity_public_donors as
select
  d.campaign_id,
  coalesce(nullif(d.donor_display_name, ''), 'Supporter') as display_name,
  d.amount_minor_units,
  d.created_at
from public.donations d
join public.charity_campaigns c on c.id = d.campaign_id
where d.is_public
  and d.status in ('successful', 'partially_refunded')
  and c.is_public
  and c.status in ('approved', 'completed');

-- Organisation-scoped financial separation. RLS on the underlying tables applies.
create or replace view public.charity_campaign_finance
with (security_invoker = true)
as
select
  c.id as campaign_id,
  c.organisation_id,
  c.title,
  c.currency,
  c.funding_target_minor_units,
  coalesce((
    select sum(d.amount_minor_units - d.refunded_amount_minor_units)
    from public.donations d
    where d.campaign_id = c.id
      and d.status in ('successful', 'partially_refunded')
  ), 0)::bigint as received_minor_units,
  coalesce((
    select sum(case when a.allocation_type = 'allocation'
                    then a.amount_minor_units
                    else -a.amount_minor_units end)
    from public.campaign_allocations a
    where a.campaign_id = c.id
  ), 0)::bigint as committed_minor_units,
  coalesce((
    select sum(e.amount_minor_units)
    from public.campaign_expenses e
    where e.campaign_id = c.id
      and e.status in ('approved', 'paid')
  ), 0)::bigint as disbursed_minor_units
from public.charity_campaigns c;

-- Scholarship outcomes for charity reporting. RLS applies.
create or replace view public.charity_scholarship_outcomes
with (security_invoker = true)
as
select
  a.organisation_id,
  a.programme_id,
  a.status,
  count(*)::integer as award_count,
  sum(a.amount_minor_units)::bigint as awarded_minor_units,
  count(*) filter (where a.completion_outcome is not null)::integer as completions_recorded,
  count(*) filter (where a.internship_outcome is not null)::integer as internship_outcomes,
  count(*) filter (where a.employment_outcome is not null)::integer as employment_outcomes
from public.scholarship_awards a
group by a.organisation_id, a.programme_id, a.status;

grant select on public.charity_public_campaign_progress to anon, authenticated;
grant select on public.charity_public_donors to anon, authenticated;
grant select on public.charity_campaign_finance to authenticated;
grant select on public.charity_scholarship_outcomes to authenticated;
