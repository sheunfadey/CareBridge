-- =============================================================================
-- CareBridge - Phase 7: medication, incidents, inventory and purchasing
-- Migration: 0019_care_incidents_inventory.sql
--
-- Medication records are administration records only. Stock balances are never
-- stored on the item row: they are derived from append-only movements, so a
-- balance cannot change without a movement.
-- =============================================================================

create type medication_status as enum (
  'scheduled',
  'administered',
  'refused',
  'held',
  'omitted'
);

create type incident_category as enum (
  'fall',
  'injury',
  'safeguarding',
  'medication',
  'missing_person',
  'property',
  'other'
);

-- `incident_severity` (low|medium|high|critical) and `incident_status`
-- (open|investigating|resolved|closed) already exist from the placement
-- incidents migration. Care incidents reuse them rather than creating a second
-- vocabulary.

create type incident_action_status as enum (
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

create type supplier_status as enum ('active', 'inactive');

create type inventory_movement_type as enum (
  'opening',
  'purchase',
  'issue',
  'adjustment',
  'wastage',
  'return'
);

create type purchase_request_status as enum (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'ordered',
  'received',
  'cancelled'
);

create type purchase_status as enum (
  'pending',
  'paid',
  'partially_paid',
  'void'
);

create type expense_payment_status as enum (
  'unpaid',
  'paid',
  'reimbursed',
  'void'
);

-- Medication -------------------------------------------------------------------

create table public.medication_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  medication_name text not null,
  dose_text text,
  route text,
  scheduled_at timestamptz not null,
  administered_at timestamptz,
  administered_by uuid references public.profiles (id) on delete set null,
  witnessed_by uuid references public.profiles (id) on delete set null,
  status medication_status not null default 'scheduled',
  reason text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medication_records_resident_idx
  on public.medication_records (resident_id, scheduled_at desc);
create index medication_records_schedule_idx
  on public.medication_records (organisation_id, status, scheduled_at);

create trigger medication_records_set_updated_at
  before update on public.medication_records
  for each row execute function public.set_updated_at();

create or replace function public.set_medication_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resident public.residents%rowtype;
begin
  select * into v_resident from public.residents where id = new.resident_id;
  if not found then
    raise exception 'Resident does not exist';
  end if;

  new.organisation_id := v_resident.organisation_id;
  new.facility_id := v_resident.facility_id;
  return new;
end;
$$;

create trigger medication_records_set_scope
  before insert or update of resident_id on public.medication_records
  for each row execute function public.set_medication_scope();

-- An administered record is a historical fact. Corrections are new event rows,
-- never edits to the original administration.
create or replace function public.guard_medication_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Medication records cannot be deleted';
  end if;

  if old.status = 'administered' and auth.uid() is not null then
    raise exception 'Administered medication records are immutable';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'scheduled' and new.status in ('administered', 'refused', 'held', 'omitted'))
      or (old.status in ('refused', 'held', 'omitted') and new.status = 'administered')
    ) then
      raise exception 'Illegal medication status transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'administered' and new.administered_at is null then
      new.administered_at := now();
    end if;
    if new.status = 'administered' and new.administered_by is null then
      new.administered_by := auth.uid();
    end if;
  end if;

  return new;
end;
$$;

create trigger medication_records_guard
  before update or delete on public.medication_records
  for each row execute function public.guard_medication_record();

create table public.medication_record_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  medication_record_id uuid not null
    references public.medication_records (id) on delete cascade,
  from_status medication_status,
  to_status medication_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index medication_record_events_record_idx
  on public.medication_record_events (medication_record_id, created_at);

create or replace function public.record_medication_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.medication_record_events (
      organisation_id, medication_record_id, from_status, to_status, actor_id, reason
    ) values (
      new.organisation_id, new.id, null, new.status, auth.uid(), new.reason
    );
  elsif new.status is distinct from old.status then
    insert into public.medication_record_events (
      organisation_id, medication_record_id, from_status, to_status, actor_id, reason
    ) values (
      new.organisation_id, new.id, old.status, new.status, auth.uid(), new.reason
    );
  end if;
  return new;
end;
$$;

create trigger medication_records_record_event
  after insert or update of status on public.medication_records
  for each row execute function public.record_medication_event();

-- Incidents --------------------------------------------------------------------

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  resident_id uuid references public.residents (id) on delete set null,
  category incident_category not null,
  severity incident_severity not null default 'medium',
  status incident_status not null default 'open',
  is_safeguarding boolean not null default false,
  occurred_at timestamptz not null,
  reported_by uuid references public.profiles (id) on delete set null,
  description text not null,
  immediate_action text,
  assigned_reviewer uuid references public.profiles (id) on delete set null,
  closure_notes text,
  closed_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incidents_facility_idx
  on public.incidents (facility_id, occurred_at desc);
create index incidents_org_status_idx
  on public.incidents (organisation_id, status, severity);
create index incidents_resident_idx
  on public.incidents (resident_id, occurred_at desc);

create trigger incidents_set_updated_at
  before update on public.incidents
  for each row execute function public.set_updated_at();

create or replace function public.set_incident_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_facility uuid;
  v_resident record;
begin
  select organisation_id into v_facility
  from public.care_facilities
  where id = new.facility_id;

  if v_facility is null then
    raise exception 'Incident facility does not exist';
  end if;

  new.organisation_id := v_facility;

  if new.resident_id is not null then
    select organisation_id, facility_id into v_resident
    from public.residents
    where id = new.resident_id;

    if v_resident.organisation_id is distinct from v_facility then
      raise exception 'Incident resident must belong to the same organisation';
    end if;
  end if;

  return new;
end;
$$;

create trigger incidents_set_scope
  before insert or update of facility_id, resident_id on public.incidents
  for each row execute function public.set_incident_scope();

-- Closing an incident requires an assigned reviewer and closure notes.
create or replace function public.guard_incident_closure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'closed' then
    if new.assigned_reviewer is null then
      raise exception 'A reviewer must be assigned before an incident is closed';
    end if;
    if nullif(trim(coalesce(new.closure_notes, '')), '') is null then
      raise exception 'Closure notes are required before an incident is closed';
    end if;
    if new.closed_at is null then
      new.closed_at := now();
    end if;
    if new.closed_by is null then
      new.closed_by := auth.uid();
    end if;
  end if;
  return new;
end;
$$;

create trigger incidents_guard_closure
  before insert or update of status on public.incidents
  for each row execute function public.guard_incident_closure();

create table public.incident_actions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  incident_id uuid not null
    references public.incidents (id) on delete cascade,
  action text not null,
  owner_id uuid references public.profiles (id) on delete set null,
  due_on date,
  status incident_action_status not null default 'open',
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index incident_actions_incident_idx
  on public.incident_actions (incident_id, status);

create trigger incident_actions_set_updated_at
  before update on public.incident_actions
  for each row execute function public.set_updated_at();

create or replace function public.set_incident_action_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.incidents where id = new.incident_id;
  if v_org is null then
    raise exception 'Incident does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger incident_actions_set_scope
  before insert or update of incident_id on public.incident_actions
  for each row execute function public.set_incident_action_scope();

-- Suppliers and inventory -------------------------------------------------------

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  status supplier_status not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name)
);

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  sku text not null,
  name text not null,
  category text,
  unit text not null default 'unit',
  reorder_level numeric(12, 3) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, sku)
);

create index inventory_items_facility_idx
  on public.inventory_items (facility_id, is_active);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

create or replace function public.set_inventory_item_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.care_facilities where id = new.facility_id;
  if v_org is null then
    raise exception 'Inventory facility does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger inventory_items_set_scope
  before insert or update of facility_id, organisation_id on public.inventory_items
  for each row execute function public.set_inventory_item_scope();

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  item_id uuid not null
    references public.inventory_items (id) on delete restrict,
  movement_type inventory_movement_type not null,
  quantity_delta numeric(12, 3) not null check (quantity_delta <> 0),
  reference text,
  reason text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movement_direction check (
    (movement_type in ('opening', 'purchase', 'return') and quantity_delta > 0)
    or (movement_type in ('issue', 'wastage') and quantity_delta < 0)
    or movement_type = 'adjustment'
  )
);

create index inventory_movements_item_idx
  on public.inventory_movements (item_id, created_at desc);
create index inventory_movements_org_idx
  on public.inventory_movements (organisation_id, created_at desc);

-- Opening balances are recorded once per item.
create unique index inventory_movements_opening_idx
  on public.inventory_movements (item_id)
  where movement_type = 'opening';

create or replace function public.set_inventory_movement_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.inventory_items where id = new.item_id;
  if v_org is null then
    raise exception 'Inventory item does not exist';
  end if;

  if new.movement_type = 'opening' and exists (
    select 1 from public.inventory_movements
    where item_id = new.item_id and movement_type = 'opening'
  ) then
    raise exception 'An opening balance has already been recorded for this item';
  end if;

  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger inventory_movements_set_scope
  before insert or update of item_id, organisation_id on public.inventory_movements
  for each row execute function public.set_inventory_movement_scope();

-- Stock history is append-only.
create or replace function public.guard_inventory_movement_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Inventory movements are append-only; record an adjustment instead';
end;
$$;

create trigger inventory_movements_guard_history
  before update or delete on public.inventory_movements
  for each row execute function public.guard_inventory_movement_history();

-- Purchasing -------------------------------------------------------------------

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  status purchase_request_status not null default 'draft',
  needed_by date,
  notes text,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_requests_org_status_idx
  on public.purchase_requests (organisation_id, status, created_at desc);
create index purchase_requests_facility_idx
  on public.purchase_requests (facility_id, status);

create trigger purchase_requests_set_updated_at
  before update on public.purchase_requests
  for each row execute function public.set_updated_at();

create or replace function public.set_purchase_request_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.care_facilities where id = new.facility_id;
  if v_org is null then
    raise exception 'Purchase request facility does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger purchase_requests_set_scope
  before insert or update of facility_id, organisation_id on public.purchase_requests
  for each row execute function public.set_purchase_request_scope();

create or replace function public.guard_purchase_request_status()
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
      when 'draft' then new.status in ('submitted', 'cancelled')
      when 'submitted' then new.status in ('approved', 'rejected', 'cancelled')
      when 'approved' then new.status in ('ordered', 'received', 'cancelled')
      when 'ordered' then new.status in ('received', 'cancelled')
      when 'rejected' then false
      when 'received' then false
      when 'cancelled' then false
      else false
    end;

    if not allowed then
      raise exception 'Illegal purchase request transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'approved' then
      if not public.has_permission('expense_approve', old.organisation_id) then
        raise exception 'Not authorised to approve purchase requests';
      end if;
      new.approved_by := auth.uid();
      new.approved_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger purchase_requests_guard_status
  before update of status on public.purchase_requests
  for each row execute function public.guard_purchase_request_status();

create table public.purchase_request_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  request_id uuid not null
    references public.purchase_requests (id) on delete cascade,
  inventory_item_id uuid references public.inventory_items (id) on delete set null,
  description text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  estimated_unit_cost_minor_units bigint not null default 0
    check (estimated_unit_cost_minor_units >= 0),
  created_at timestamptz not null default now()
);

create index purchase_request_items_request_idx
  on public.purchase_request_items (request_id);

create or replace function public.set_purchase_request_item_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.purchase_requests where id = new.request_id;
  if v_org is null then
    raise exception 'Purchase request does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger purchase_request_items_set_scope
  before insert or update of request_id, organisation_id on public.purchase_request_items
  for each row execute function public.set_purchase_request_item_scope();

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  purchase_request_id uuid references public.purchase_requests (id) on delete set null,
  invoice_number text,
  purchased_on date not null default current_date,
  total_minor_units bigint not null default 0 check (total_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  status purchase_status not null default 'pending',
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchases_org_idx
  on public.purchases (organisation_id, purchased_on desc);
create index purchases_supplier_idx
  on public.purchases (supplier_id, purchased_on desc);

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create or replace function public.set_purchase_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.care_facilities where id = new.facility_id;
  if v_org is null then
    raise exception 'Purchase facility does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger purchases_set_scope
  before insert or update of facility_id, organisation_id on public.purchases
  for each row execute function public.set_purchase_scope();

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  purchase_id uuid not null
    references public.purchases (id) on delete cascade,
  inventory_item_id uuid references public.inventory_items (id) on delete set null,
  description text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_cost_minor_units bigint not null default 0 check (unit_cost_minor_units >= 0),
  line_total_minor_units bigint generated always as (
    (round(quantity * unit_cost_minor_units))::bigint
  ) stored,
  created_at timestamptz not null default now()
);

create index purchase_items_purchase_idx
  on public.purchase_items (purchase_id);

create or replace function public.set_purchase_item_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.purchases where id = new.purchase_id;
  if v_org is null then
    raise exception 'Purchase does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger purchase_items_set_scope
  before insert or update of purchase_id, organisation_id on public.purchase_items
  for each row execute function public.set_purchase_item_scope();

-- Receiving a purchase line for a tracked item writes a stock movement. Stock
-- can therefore only enter through a movement row.
create or replace function public.record_purchase_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.inventory_item_id is not null then
    insert into public.inventory_movements (
      item_id, movement_type, quantity_delta, reference, reason, recorded_by
    ) values (
      new.inventory_item_id,
      'purchase',
      new.quantity,
      new.purchase_id::text,
      'Received purchase line',
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger purchase_items_record_stock
  after insert on public.purchase_items
  for each row execute function public.record_purchase_stock();

-- Purchase lines form part of stock and expense history. They cannot be edited
-- after receipt; a correction is a new purchase or an explicit stock adjustment.
create or replace function public.guard_purchase_item_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    raise exception 'Purchase lines cannot be changed after receipt';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger purchase_items_guard_history
  before update or delete on public.purchase_items
  for each row execute function public.guard_purchase_item_history();

-- Keep the purchase header total derived from its lines.
create or replace function public.recalculate_purchase_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase uuid := coalesce(new.purchase_id, old.purchase_id);
begin
  update public.purchases p
  set total_minor_units = coalesce((
    select sum(pi.line_total_minor_units)
    from public.purchase_items pi
    where pi.purchase_id = v_purchase
  ), 0)
  where p.id = v_purchase;

  return null;
end;
$$;

create trigger purchase_items_recalculate_total
  after insert or update or delete on public.purchase_items
  for each row execute function public.recalculate_purchase_total();

-- Expense records --------------------------------------------------------------

create table public.expense_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  category text not null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  purchase_id uuid references public.purchases (id) on delete set null,
  description text,
  amount_minor_units bigint not null check (amount_minor_units > 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  incurred_on date not null default current_date,
  payment_status expense_payment_status not null default 'unpaid',
  payment_method text,
  receipt_reference text,
  recorded_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expense_records_org_idx
  on public.expense_records (organisation_id, incurred_on desc);
create index expense_records_facility_idx
  on public.expense_records (facility_id, incurred_on desc);

create trigger expense_records_set_updated_at
  before update on public.expense_records
  for each row execute function public.set_updated_at();

create or replace function public.set_expense_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organisation_id into v_org from public.care_facilities where id = new.facility_id;
  if v_org is null then
    raise exception 'Expense facility does not exist';
  end if;
  new.organisation_id := v_org;
  return new;
end;
$$;

create trigger expense_records_set_scope
  before insert or update of facility_id, organisation_id on public.expense_records
  for each row execute function public.set_expense_scope();

-- Row Level Security -----------------------------------------------------------

alter table public.medication_records enable row level security;
alter table public.medication_record_events enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_actions enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.purchase_request_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.expense_records enable row level security;

create policy medication_records_select on public.medication_records
  for select using (
    public.has_permission('medication_manage', organisation_id)
    and public.can_access_resident(resident_id, 'medication_manage')
  );

create policy medication_records_insert on public.medication_records
  for insert with check (
    public.has_permission('medication_manage', organisation_id)
    and public.can_access_resident(resident_id, 'medication_manage')
  );

create policy medication_records_update on public.medication_records
  for update using (
    public.has_permission('medication_manage', organisation_id)
  )
  with check (
    public.has_permission('medication_manage', organisation_id)
  );

create policy medication_record_events_select on public.medication_record_events
  for select using (
    public.has_permission('medication_manage', organisation_id)
  );

create policy incidents_select on public.incidents
  for select using (
    public.has_permission('incident_view', organisation_id)
    or public.has_permission('incident_manage', organisation_id)
  );

create policy incidents_insert on public.incidents
  for insert with check (
    public.has_permission('incident_manage', organisation_id)
  );

create policy incidents_update on public.incidents
  for update using (
    public.has_permission('incident_manage', organisation_id)
  )
  with check (
    public.has_permission('incident_manage', organisation_id)
  );

create policy incident_actions_select on public.incident_actions
  for select using (
    public.has_permission('incident_view', organisation_id)
    or public.has_permission('incident_manage', organisation_id)
  );

create policy incident_actions_write on public.incident_actions
  for all using (
    public.has_permission('incident_manage', organisation_id)
  )
  with check (
    public.has_permission('incident_manage', organisation_id)
  );

create policy suppliers_select on public.suppliers
  for select using (
    public.has_permission('inventory_view', organisation_id)
    or public.has_permission('inventory_manage', organisation_id)
    or public.has_permission('expense_manage', organisation_id)
  );

create policy suppliers_write on public.suppliers
  for all using (
    public.has_permission('inventory_manage', organisation_id)
    or public.has_permission('expense_manage', organisation_id)
  )
  with check (
    public.has_permission('inventory_manage', organisation_id)
    or public.has_permission('expense_manage', organisation_id)
  );

create policy inventory_items_select on public.inventory_items
  for select using (
    public.has_permission('inventory_view', organisation_id)
    or public.has_permission('inventory_manage', organisation_id)
  );

create policy inventory_items_write on public.inventory_items
  for all using (
    public.has_permission('inventory_manage', organisation_id)
  )
  with check (
    public.has_permission('inventory_manage', organisation_id)
  );

create policy inventory_movements_select on public.inventory_movements
  for select using (
    public.has_permission('inventory_view', organisation_id)
    or public.has_permission('inventory_manage', organisation_id)
  );

create policy inventory_movements_insert on public.inventory_movements
  for insert with check (
    public.has_permission('inventory_manage', organisation_id)
  );

create policy purchase_requests_select on public.purchase_requests
  for select using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  );

create policy purchase_requests_insert on public.purchase_requests
  for insert with check (
    public.has_permission('expense_manage', organisation_id)
  );

create policy purchase_requests_update on public.purchase_requests
  for update using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  )
  with check (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  );

create policy purchase_request_items_select on public.purchase_request_items
  for select using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  );

create policy purchase_request_items_write on public.purchase_request_items
  for all using (
    public.has_permission('expense_manage', organisation_id)
  )
  with check (
    public.has_permission('expense_manage', organisation_id)
  );

create policy purchases_select on public.purchases
  for select using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
    or public.has_permission('inventory_view', organisation_id)
  );

create policy purchases_write on public.purchases
  for all using (
    public.has_permission('expense_manage', organisation_id)
  )
  with check (
    public.has_permission('expense_manage', organisation_id)
  );

create policy purchase_items_select on public.purchase_items
  for select using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
    or public.has_permission('inventory_view', organisation_id)
  );

create policy purchase_items_write on public.purchase_items
  for all using (
    public.has_permission('expense_manage', organisation_id)
  )
  with check (
    public.has_permission('expense_manage', organisation_id)
  );

create policy expense_records_select on public.expense_records
  for select using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
    or public.has_permission('financial_report_view', organisation_id)
  );

create policy expense_records_insert on public.expense_records
  for insert with check (
    public.has_permission('expense_manage', organisation_id)
  );

create policy expense_records_update on public.expense_records
  for update using (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  )
  with check (
    public.has_permission('expense_manage', organisation_id)
    or public.has_permission('expense_approve', organisation_id)
  );
