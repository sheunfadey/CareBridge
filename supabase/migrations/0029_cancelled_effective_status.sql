-- =============================================================================
-- CareBridge - Phase 10 fix: immediate cancellation is effective immediately
-- Migration: 0029_cancelled_effective_status.sql
--
-- `cancelled` with an ended_at timestamp must be treated as expired, not as
-- cancelled-at-period-end. This keeps the read-only policy correct after an
-- immediate cancellation.
-- =============================================================================

create or replace function public.subscription_effective_status(p_organisation uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub public.organisation_subscriptions%rowtype;
begin
  select * into v_sub
  from public.organisation_subscriptions
  where organisation_id = p_organisation;

  if not found then
    return 'legacy';
  end if;

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
    if v_sub.ended_at is not null then
      return 'expired';
    end if;
    if v_sub.current_period_end >= now() then
      return 'cancelled_active';
    end if;
    return 'expired';
  end if;

  return v_sub.status::text;
end;
$$;
