-- =============================================================================
-- CareBridge - Phase 7: care billing and operational reports
-- Migration: 0020_care_billing_reports.sql
--
-- Resident invoices, line items, payments and refunds. Totals are derived by
-- the database, invoice numbers are allocated server-side, and payment/refund
-- rows are append-only financial history.
--
-- Reporting views use security_invoker so the caller's RLS applies. Aggregate
-- views never select resident names.
-- =============================================================================

create type service_invoice_status as enum (
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'void'
);

create type service_payment_method as enum (
  'cash',
  'bank_transfer',
  'card',
  'cheque',
  'other'
);

-- Invoice numbering ------------------------------------------------------------

create table public.service_invoice_counters (
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  period text not null,
  last_value integer not null default 0,
  primary key (organisation_id, period)
);

alter table public.service_invoice_counters enable row level security;

-- Invoices ---------------------------------------------------------------------

create table public.service_invoices (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  resident_id uuid references public.residents (id) on delete set null,
  payer_name text not null,
  payer_contact text,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status service_invoice_status not null default 'draft',
  subtotal_minor_units bigint not null default 0 check (subtotal_minor_units >= 0),
  total_minor_units bigint not null default 0 check (total_minor_units >= 0),
  amount_paid_minor_units bigint not null default 0 check (amount_paid_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, invoice_number),
  constraint service_invoices_dates check (due_date >= issue_date),
  constraint service_invoices_paid_not_above_total check (
    amount_paid_minor_units <= total_minor_units
  )
);

create index service_invoices_org_idx
  on public.service_invoices (organisation_id, status, due_date);
create index service_invoices_facility_idx
  on public.service_invoices (facility_id, status);
create index service_invoices_resident_idx
  on public.service_invoices (resident_id, issue_date desc);

create trigger service_invoices_set_updated_at
  before update on public.service_invoices
  for each row execute function public.set_updated_at();

create or replace function public.prepare_service_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_resident record;
  v_period text;
  v_next integer;
begin
  select organisation_id into v_org
  from public.care_facilities
  where id = new.facility_id;

  if v_org is null then
    raise exception 'Invoice facility does not exist';
  end if;

  new.organisation_id := v_org;

  if new.resident_id is not null then
    select organisation_id, facility_id into v_resident
    from public.residents
    where id = new.resident_id;

    if v_resident.organisation_id is distinct from v_org then
      raise exception 'Invoice resident must belong to the same organisation';
    end if;
  end if;

  if tg_op = 'INSERT' and nullif(trim(coalesce(new.invoice_number, '')), '') is null then
    v_period := to_char(coalesce(new.issue_date, current_date), 'YYYYMM');

    insert into public.service_invoice_counters (organisation_id, period, last_value)
    values (v_org, v_period, 1)
    on conflict (organisation_id, period)
    do update set last_value = public.service_invoice_counters.last_value + 1
    returning last_value into v_next;

    new.invoice_number := 'INV-' || v_period || '-' || lpad(v_next::text, 4, '0');
  end if;

  return new;
end;
$$;

create trigger service_invoices_prepare
  before insert or update of facility_id, resident_id, organisation_id
  on public.service_invoices
  for each row execute function public.prepare_service_invoice();

create or replace function public.guard_service_invoice_status()
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
      when 'draft' then new.status in ('issued', 'void')
      when 'issued' then new.status in ('overdue', 'partially_paid', 'paid', 'void')
      when 'overdue' then new.status in ('partially_paid', 'paid', 'issued', 'void')
      when 'partially_paid' then new.status in ('paid', 'overdue', 'issued', 'void')
      when 'paid' then new.status in ('partially_paid', 'issued', 'void')
      when 'void' then false
      else false
    end;

    if not allowed then
      raise exception 'Illegal invoice status transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'void' and new.amount_paid_minor_units > 0 then
      raise exception 'An invoice with payments cannot be voided; refund it first';
    end if;
  end if;
  return new;
end;
$$;

create trigger service_invoices_guard_status
  before update of status on public.service_invoices
  for each row execute function public.guard_service_invoice_status();

create table public.service_invoice_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  invoice_id uuid not null
    references public.service_invoices (id) on delete cascade,
  description text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price_minor_units bigint not null default 0 check (unit_price_minor_units >= 0),
  line_total_minor_units bigint generated always as (
    (round(quantity * unit_price_minor_units))::bigint
  ) stored,
  created_at timestamptz not null default now()
);

create index service_invoice_items_invoice_idx
  on public.service_invoice_items (invoice_id);

create or replace function public.set_service_invoice_item_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.service_invoices
  where id = new.invoice_id;

  if v_org is null then
    raise exception 'Invoice does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger service_invoice_items_set_scope
  before insert or update of invoice_id, organisation_id on public.service_invoice_items
  for each row execute function public.set_service_invoice_item_scope();

create or replace function public.guard_service_invoice_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status service_invoice_status;
  v_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  select status into v_status from public.service_invoices where id = v_invoice;

  if v_status is distinct from 'draft' then
    raise exception 'Invoice lines can only be changed while the invoice is a draft';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger service_invoice_items_guard
  before insert or update or delete on public.service_invoice_items
  for each row execute function public.guard_service_invoice_item();

create or replace function public.recalculate_service_invoice()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice uuid := coalesce(new.invoice_id, old.invoice_id);
  v_total bigint;
begin
  select coalesce(sum(line_total_minor_units), 0)
    into v_total
  from public.service_invoice_items
  where invoice_id = v_invoice;

  update public.service_invoices
  set subtotal_minor_units = v_total,
      total_minor_units = v_total
  where id = v_invoice
    and status = 'draft';

  return null;
end;
$$;

create trigger service_invoice_items_recalculate
  after insert or update or delete on public.service_invoice_items
  for each row execute function public.recalculate_service_invoice();

-- Payments and refunds ---------------------------------------------------------

create table public.service_payments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  invoice_id uuid not null
    references public.service_invoices (id) on delete restrict,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  paid_at timestamptz not null default now(),
  method service_payment_method not null default 'bank_transfer',
  reference text,
  receipt_reference text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index service_payments_invoice_idx
  on public.service_payments (invoice_id, paid_at desc);

create or replace function public.set_service_payment_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org
  from public.service_invoices
  where id = new.invoice_id;

  if v_org is null then
    raise exception 'Invoice does not exist';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger service_payments_set_scope
  before insert or update of invoice_id, organisation_id on public.service_payments
  for each row execute function public.set_service_payment_scope();

-- Applies a payment to its invoice and rejects overpayment.
create or replace function public.apply_service_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.service_invoices%rowtype;
begin
  select * into v_invoice
  from public.service_invoices
  where id = new.invoice_id
  for update;

  if not found then
    raise exception 'Invoice does not exist';
  end if;

  if v_invoice.status not in ('issued', 'partially_paid', 'overdue') then
    raise exception 'Payments can only be recorded against an issued invoice';
  end if;

  if new.amount_minor_units > (v_invoice.total_minor_units - v_invoice.amount_paid_minor_units) then
    raise exception 'Payment exceeds the outstanding invoice balance';
  end if;

  update public.service_invoices
  set amount_paid_minor_units = v_invoice.amount_paid_minor_units + new.amount_minor_units,
      status = case
        when v_invoice.amount_paid_minor_units + new.amount_minor_units >= v_invoice.total_minor_units
          then 'paid'::service_invoice_status
        else 'partially_paid'::service_invoice_status
      end
  where id = v_invoice.id;

  new.organisation_id := v_invoice.organisation_id;
  return new;
end;
$$;

create trigger service_payments_apply
  before insert on public.service_payments
  for each row execute function public.apply_service_payment();

create or replace function public.guard_service_payment_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Payments are append-only; record a refund instead';
end;
$$;

create trigger service_payments_guard_history
  before update or delete on public.service_payments
  for each row execute function public.guard_service_payment_history();

create table public.service_refunds (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  payment_id uuid not null
    references public.service_payments (id) on delete restrict,
  invoice_id uuid not null
    references public.service_invoices (id) on delete restrict,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  reason text not null,
  refunded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index service_refunds_payment_idx
  on public.service_refunds (payment_id, refunded_at desc);

create or replace function public.apply_service_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.service_payments%rowtype;
  v_invoice public.service_invoices%rowtype;
  v_refunded bigint;
begin
  select * into v_payment
  from public.service_payments
  where id = new.payment_id
  for update;

  if not found then
    raise exception 'Payment does not exist';
  end if;

  select coalesce(sum(amount_minor_units), 0)
    into v_refunded
  from public.service_refunds
  where payment_id = new.payment_id;

  if v_refunded + new.amount_minor_units > v_payment.amount_minor_units then
    raise exception 'Refund exceeds the recorded payment';
  end if;

  select * into v_invoice
  from public.service_invoices
  where id = v_payment.invoice_id
  for update;

  new.invoice_id := v_payment.invoice_id;
  new.organisation_id := v_payment.organisation_id;

  update public.service_invoices
  set amount_paid_minor_units = greatest(v_invoice.amount_paid_minor_units - new.amount_minor_units, 0),
      status = case
        when greatest(v_invoice.amount_paid_minor_units - new.amount_minor_units, 0) = 0
          then 'issued'::service_invoice_status
        else 'partially_paid'::service_invoice_status
      end
  where id = v_invoice.id;

  return new;
end;
$$;

create trigger service_refunds_apply
  before insert on public.service_refunds
  for each row execute function public.apply_service_refund();

create or replace function public.guard_service_refund_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Refunds are append-only';
end;
$$;

create trigger service_refunds_guard_history
  before update or delete on public.service_refunds
  for each row execute function public.guard_service_refund_history();

-- Row Level Security -----------------------------------------------------------

alter table public.service_invoices enable row level security;
alter table public.service_invoice_items enable row level security;
alter table public.service_payments enable row level security;
alter table public.service_refunds enable row level security;

create policy service_invoices_select on public.service_invoices
  for select using (
    public.has_permission('invoice_view', organisation_id)
    or public.has_permission('invoice_manage', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy service_invoices_insert on public.service_invoices
  for insert with check (
    public.has_permission('invoice_manage', organisation_id)
  );

create policy service_invoices_update on public.service_invoices
  for update using (
    public.has_permission('invoice_manage', organisation_id)
  )
  with check (
    public.has_permission('invoice_manage', organisation_id)
  );

create policy service_invoice_items_select on public.service_invoice_items
  for select using (
    public.has_permission('invoice_view', organisation_id)
    or public.has_permission('invoice_manage', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy service_invoice_items_write on public.service_invoice_items
  for all using (
    public.has_permission('invoice_manage', organisation_id)
  )
  with check (
    public.has_permission('invoice_manage', organisation_id)
  );

create policy service_payments_select on public.service_payments
  for select using (
    public.has_permission('invoice_view', organisation_id)
    or public.has_permission('invoice_manage', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy service_payments_insert on public.service_payments
  for insert with check (
    public.has_permission('invoice_manage', organisation_id)
  );

create policy service_refunds_select on public.service_refunds
  for select using (
    public.has_permission('invoice_view', organisation_id)
    or public.has_permission('invoice_manage', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy service_refunds_insert on public.service_refunds
  for insert with check (
    public.has_permission('invoice_manage', organisation_id)
  );

-- Reporting views --------------------------------------------------------------

create or replace view public.care_occupancy
with (security_invoker = true)
as
select
  f.id as facility_id,
  f.organisation_id,
  f.name as facility_name,
  f.capacity,
  count(r.id) filter (where r.status = 'active')::integer as active_residents,
  case
    when f.capacity is not null and f.capacity > 0 then
      round(
        (count(r.id) filter (where r.status = 'active'))::numeric
        * 100 / f.capacity,
        1
      )
    else null
  end as occupancy_percent
from public.care_facilities f
left join public.residents r on r.facility_id = f.id
group by f.id;

create or replace view public.care_staffing_coverage
with (security_invoker = true)
as
select
  s.id as shift_id,
  s.organisation_id,
  s.facility_id,
  s.starts_at,
  s.ends_at,
  s.status,
  s.required_staff,
  count(a.id) filter (
    where a.status in ('assigned', 'confirmed', 'completed')
  )::integer as assigned_staff,
  greatest(
    s.required_staff - count(a.id) filter (
      where a.status in ('assigned', 'confirmed', 'completed')
    )::integer,
    0
  ) as coverage_gap
from public.shift_schedules s
left join public.shift_assignments a on a.shift_id = s.id
group by s.id;

create or replace view public.care_training_compliance
with (security_invoker = true)
as
select
  sp.id as staff_id,
  sp.organisation_id,
  sp.user_id,
  sp.employment_status,
  count(distinct t.id) filter (
    where t.expires_on is not null and t.expires_on < current_date
  )::integer as expired_training,
  count(distinct q.id) filter (
    where q.expires_on is not null and q.expires_on < current_date
  )::integer as expired_qualifications,
  count(distinct q.id) filter (
    where q.verification_status <> 'verified'
  )::integer as unverified_qualifications,
  count(distinct d.id) filter (
    where d.expires_on is not null and d.expires_on < current_date
  )::integer as expired_documents
from public.care_staff_profiles sp
left join public.staff_training_records t on t.staff_id = sp.id
left join public.staff_qualifications q on q.staff_id = sp.id
left join public.staff_documents d on d.staff_id = sp.id
group by sp.id;

create or replace view public.care_incident_summary
with (security_invoker = true)
as
select
  i.organisation_id,
  i.facility_id,
  i.category,
  i.severity,
  i.status,
  count(*)::integer as incident_count,
  count(*) filter (where i.is_safeguarding)::integer as safeguarding_count
from public.incidents i
group by i.organisation_id, i.facility_id, i.category, i.severity, i.status;

create or replace view public.care_inventory_status
with (security_invoker = true)
as
select
  i.id as item_id,
  i.organisation_id,
  i.facility_id,
  i.sku,
  i.name,
  i.category,
  i.unit,
  i.reorder_level,
  coalesce(sum(m.quantity_delta), 0)::numeric(12, 3) as current_quantity,
  (coalesce(sum(m.quantity_delta), 0) <= i.reorder_level) as below_reorder
from public.inventory_items i
left join public.inventory_movements m on m.item_id = i.id
group by i.id;

create or replace view public.care_expense_summary
with (security_invoker = true)
as
select
  e.organisation_id,
  e.facility_id,
  date_trunc('month', e.incurred_on)::date as month,
  e.category,
  count(*)::integer as expense_count,
  sum(e.amount_minor_units)::bigint as total_minor_units
from public.expense_records e
group by e.organisation_id, e.facility_id, date_trunc('month', e.incurred_on), e.category;

create or replace view public.care_invoice_ageing
with (security_invoker = true)
as
select
  i.id as invoice_id,
  i.organisation_id,
  i.facility_id,
  i.invoice_number,
  i.payer_name,
  i.issue_date,
  i.due_date,
  i.status,
  i.total_minor_units,
  i.amount_paid_minor_units,
  greatest(i.total_minor_units - i.amount_paid_minor_units, 0) as outstanding_minor_units,
  greatest(current_date - i.due_date, 0) as days_overdue
from public.service_invoices i
where i.status <> 'void';
