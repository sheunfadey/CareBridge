-- =============================================================================
-- CareBridge - Phase 8 follow-up: trusted donation payment sync
-- Migration: 0022_donation_sync_guard.sql
--
-- The donation financial guard must not block the payment trigger when the
-- trigger runs inside a transaction that still carries a user JWT claim (for
-- example an RLS test or a server action). The sync function marks its write
-- with a transaction-local flag, and the guard permits only that flagged write.
-- =============================================================================

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
