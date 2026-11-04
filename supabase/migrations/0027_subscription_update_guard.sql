-- =============================================================================
-- CareBridge - Phase 9 follow-up: subscription write hardening
-- Migration: 0027_subscription_update_guard.sql
--
-- Organisation owners may change plan/cycle and cancel or resume, but only
-- platform billing staff may change status, trial/period dates, grace windows or
-- suspension metadata. New subscription rows are platform-created.
-- =============================================================================

create or replace function public.guard_subscription_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.has_permission('billing_manage', null) then
    return new;
  end if;

  if not public.has_permission('subscription_manage', old.organisation_id) then
    raise exception 'Not authorised to change this subscription';
  end if;

  if new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_start is distinct from old.current_period_start
     or new.current_period_end is distinct from old.current_period_end
     or new.grace_ends_at is distinct from old.grace_ends_at
     or new.suspended_at is distinct from old.suspended_at
     or new.ended_at is distinct from old.ended_at then
    raise exception 'Only platform billing can change subscription periods or escalation dates';
  end if;

  if new.status is distinct from old.status
     and new.status not in ('active', 'trialing', 'cancelled') then
    raise exception 'Only platform billing can set this subscription status';
  end if;

  return new;
end;
$$;

create trigger organisation_subscriptions_guard_update
  before update on public.organisation_subscriptions
  for each row execute function public.guard_subscription_update();

drop policy if exists organisation_subscriptions_insert on public.organisation_subscriptions;

create policy organisation_subscriptions_insert on public.organisation_subscriptions
  for insert with check (public.has_permission('billing_manage', null));
