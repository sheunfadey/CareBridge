-- =============================================================================
-- CareBridge - Phase 9 follow-up: feature limits and read-only enforcement
-- Migration: 0026_subscription_guards.sql
--
-- Limits and module access are enforced in the database so they cannot be
-- bypassed by calling the API directly. Trusted service connections (no auth
-- session) are allowed for migrations and platform maintenance.
-- =============================================================================

-- Count pending invitations towards the member limit.
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

  select
    (select count(*)
     from public.organisation_memberships
     where organisation_id = p_organisation
       and status in ('active', 'invited'))
    +
    (select count(*)
     from public.organisation_invitations
     where organisation_id = p_organisation
       and status = 'pending')
  into v_count;

  return v_count < v_limit;
end;
$$;

create or replace function public.guard_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.status in ('active', 'invited')
     and not public.organisation_can_add_member(new.organisation_id) then
    raise exception 'The user limit for this plan has been reached. Upgrade the plan to add more members.';
  end if;

  return new;
end;
$$;

create trigger organisation_memberships_guard_limit
  before insert on public.organisation_memberships
  for each row execute function public.guard_member_limit();

create or replace function public.guard_invitation_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.status <> 'pending' then
    return new;
  end if;

  if not public.organisation_can_add_member(new.organisation_id) then
    raise exception 'The user limit for this plan has been reached. Upgrade the plan to invite more members.';
  end if;

  return new;
end;
$$;

create trigger organisation_invitations_guard_limit
  before insert on public.organisation_invitations
  for each row execute function public.guard_invitation_limit();

create or replace function public.guard_facility_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.organisation_can_add_facility(new.organisation_id) then
    raise exception 'The facility limit for this plan has been reached. Upgrade the plan to add more facilities.';
  end if;

  return new;
end;
$$;

create trigger care_facilities_guard_limit
  before insert on public.care_facilities
  for each row execute function public.guard_facility_limit();

-- Read-only enforcement for suspended/expired subscriptions.
create or replace function public.guard_subscription_writable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.organisation_id is null then
    return new;
  end if;

  if not public.organisation_can_write(new.organisation_id) then
    raise exception 'This workspace is read-only because the subscription is suspended or expired. Existing records remain available to read and export.';
  end if;

  return new;
end;
$$;

-- Module access enforcement. The module name is supplied as the trigger argument.
create or replace function public.guard_subscription_module()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.organisation_id is null then
    return new;
  end if;

  if not public.organisation_has_module(new.organisation_id, tg_argv[0]) then
    raise exception 'Your current plan does not include the % module. Upgrade the subscription to continue.', tg_argv[0];
  end if;

  return new;
end;
$$;

-- Care operations.
create trigger care_facilities_guard_writable
  before insert or update on public.care_facilities
  for each row execute function public.guard_subscription_writable();
create trigger care_facilities_guard_module
  before insert or update on public.care_facilities
  for each row execute function public.guard_subscription_module('care');

create trigger residents_guard_writable
  before insert or update on public.residents
  for each row execute function public.guard_subscription_writable();
create trigger residents_guard_module
  before insert or update on public.residents
  for each row execute function public.guard_subscription_module('care');

create trigger care_staff_profiles_guard_writable
  before insert or update on public.care_staff_profiles
  for each row execute function public.guard_subscription_writable();
create trigger care_staff_profiles_guard_module
  before insert or update on public.care_staff_profiles
  for each row execute function public.guard_subscription_module('care');

create trigger shift_schedules_guard_writable
  before insert or update on public.shift_schedules
  for each row execute function public.guard_subscription_writable();
create trigger shift_schedules_guard_module
  before insert or update on public.shift_schedules
  for each row execute function public.guard_subscription_module('care');

create trigger care_plans_guard_writable
  before insert or update on public.care_plans
  for each row execute function public.guard_subscription_writable();
create trigger care_plans_guard_module
  before insert or update on public.care_plans
  for each row execute function public.guard_subscription_module('care');

create trigger care_task_records_guard_writable
  before insert or update on public.care_task_records
  for each row execute function public.guard_subscription_writable();
create trigger care_task_records_guard_module
  before insert or update on public.care_task_records
  for each row execute function public.guard_subscription_module('care');

create trigger incidents_guard_writable
  before insert or update on public.incidents
  for each row execute function public.guard_subscription_writable();
create trigger incidents_guard_module
  before insert or update on public.incidents
  for each row execute function public.guard_subscription_module('care');

create trigger medication_records_guard_writable
  before insert or update on public.medication_records
  for each row execute function public.guard_subscription_writable();
create trigger medication_records_guard_module
  before insert or update on public.medication_records
  for each row execute function public.guard_subscription_module('care');

create trigger inventory_items_guard_writable
  before insert or update on public.inventory_items
  for each row execute function public.guard_subscription_writable();
create trigger inventory_items_guard_module
  before insert or update on public.inventory_items
  for each row execute function public.guard_subscription_module('care');

create trigger inventory_movements_guard_writable
  before insert or update on public.inventory_movements
  for each row execute function public.guard_subscription_writable();
create trigger inventory_movements_guard_module
  before insert or update on public.inventory_movements
  for each row execute function public.guard_subscription_module('care');

create trigger expense_records_guard_writable
  before insert or update on public.expense_records
  for each row execute function public.guard_subscription_writable();
create trigger expense_records_guard_module
  before insert or update on public.expense_records
  for each row execute function public.guard_subscription_module('care');

create trigger service_invoices_guard_writable
  before insert or update on public.service_invoices
  for each row execute function public.guard_subscription_writable();
create trigger service_invoices_guard_module
  before insert or update on public.service_invoices
  for each row execute function public.guard_subscription_module('care');

-- Charity operations.
create trigger charity_campaigns_guard_writable
  before insert or update on public.charity_campaigns
  for each row execute function public.guard_subscription_writable();
create trigger charity_campaigns_guard_module
  before insert or update on public.charity_campaigns
  for each row execute function public.guard_subscription_module('charity');

create trigger campaign_allocations_guard_writable
  before insert or update on public.campaign_allocations
  for each row execute function public.guard_subscription_writable();
create trigger campaign_allocations_guard_module
  before insert or update on public.campaign_allocations
  for each row execute function public.guard_subscription_module('charity');

create trigger campaign_expenses_guard_writable
  before insert or update on public.campaign_expenses
  for each row execute function public.guard_subscription_writable();
create trigger campaign_expenses_guard_module
  before insert or update on public.campaign_expenses
  for each row execute function public.guard_subscription_module('charity');

create trigger scholarship_programmes_guard_writable
  before insert or update on public.scholarship_programmes
  for each row execute function public.guard_subscription_writable();
create trigger scholarship_programmes_guard_module
  before insert or update on public.scholarship_programmes
  for each row execute function public.guard_subscription_module('charity');

create trigger scholarship_applications_guard_writable
  before insert or update on public.scholarship_applications
  for each row execute function public.guard_subscription_writable();
create trigger scholarship_applications_guard_module
  before insert or update on public.scholarship_applications
  for each row execute function public.guard_subscription_module('charity');

create trigger scholarship_awards_guard_writable
  before insert or update on public.scholarship_awards
  for each row execute function public.guard_subscription_writable();
create trigger scholarship_awards_guard_module
  before insert or update on public.scholarship_awards
  for each row execute function public.guard_subscription_module('charity');

create trigger impact_reports_guard_writable
  before insert or update on public.impact_reports
  for each row execute function public.guard_subscription_writable();
create trigger impact_reports_guard_module
  before insert or update on public.impact_reports
  for each row execute function public.guard_subscription_module('charity');

-- Academy and employment.
create trigger courses_guard_writable
  before insert or update on public.courses
  for each row execute function public.guard_subscription_writable();
create trigger courses_guard_module
  before insert or update on public.courses
  for each row execute function public.guard_subscription_module('academy');

create trigger job_postings_guard_writable
  before insert or update on public.job_postings
  for each row execute function public.guard_subscription_writable();
create trigger job_postings_guard_module
  before insert or update on public.job_postings
  for each row execute function public.guard_subscription_module('employment');

create trigger internship_listings_guard_writable
  before insert or update on public.internship_listings
  for each row execute function public.guard_subscription_writable();
create trigger internship_listings_guard_module
  before insert or update on public.internship_listings
  for each row execute function public.guard_subscription_module('employment');

