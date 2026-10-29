-- =============================================================================
-- CareBridge - Phase 7: care facilities and resident records
-- Migration: 0017_care_residents.sql
--
-- A care facility belongs to an organisation of type care_home or
-- home_care_agency. Residents, contacts, relationships, consents and access
-- events are organisation-scoped and protected by RLS.
--
-- Family access is never organisation-wide: a family member can only read a
-- resident through an explicit, unrevoked row in resident_relationships.
-- =============================================================================

create type care_facility_status as enum ('active', 'inactive');

create type resident_status as enum (
  'active',
  'on_leave',
  'discharged',
  'deceased'
);

create type resident_access_level as enum ('summary', 'full');

create type resident_consent_type as enum (
  'care',
  'medical',
  'data_sharing',
  'photography',
  'research',
  'other'
);

-- Facilities -------------------------------------------------------------------

create table public.care_facilities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  phone text,
  email text,
  capacity integer check (capacity is null or capacity > 0),
  status care_facility_status not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name)
);

create index care_facilities_organisation_idx
  on public.care_facilities (organisation_id, status);

create trigger care_facilities_set_updated_at
  before update on public.care_facilities
  for each row execute function public.set_updated_at();

create or replace function public.guard_care_facility_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.organisations o
    where o.id = new.organisation_id
      and o.type in ('care_home', 'home_care_agency')
  ) then
    raise exception 'Care facilities belong to a care home or home-care agency';
  end if;
  return new;
end;
$$;

create trigger care_facilities_guard_organisation
  before insert or update of organisation_id on public.care_facilities
  for each row execute function public.guard_care_facility_organisation();

-- Residents --------------------------------------------------------------------

create table public.residents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete restrict,
  facility_id uuid not null
    references public.care_facilities (id) on delete restrict,
  reference text not null,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  date_of_birth date,
  gender text,
  room_number text,
  admission_date date not null default current_date,
  discharge_date date,
  status resident_status not null default 'active',
  care_level text,
  mobility_notes text,
  dietary_notes text,
  communication_notes text,
  accessibility_needs text,
  care_requirements text,
  medical_notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, reference),
  constraint residents_discharge_date check (
    status <> 'discharged' or discharge_date is not null
  ),
  constraint residents_dates check (
    discharge_date is null or discharge_date >= admission_date
  )
);

create index residents_organisation_idx
  on public.residents (organisation_id, status);
create index residents_facility_idx
  on public.residents (facility_id, status);
create index residents_name_idx
  on public.residents (organisation_id, last_name, first_name);

create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function public.set_updated_at();

-- The organisation is always derived from the facility. A resident can never
-- be moved to another organisation, and therefore never leaks across tenants.
create or replace function public.set_resident_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation uuid;
begin
  select organisation_id into v_organisation
  from public.care_facilities
  where id = new.facility_id;

  if v_organisation is null then
    raise exception 'Resident facility does not exist';
  end if;

  if tg_op = 'UPDATE'
     and new.facility_id is distinct from old.facility_id
     and v_organisation is distinct from old.organisation_id then
    raise exception 'A resident cannot be moved to another organisation';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create trigger residents_set_organisation
  before insert or update of facility_id, organisation_id on public.residents
  for each row execute function public.set_resident_organisation();

-- Contacts ---------------------------------------------------------------------

create table public.resident_contacts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  name text not null,
  relationship text,
  phone text,
  email text,
  is_emergency boolean not null default false,
  is_authorised_representative boolean not null default false,
  priority integer not null default 1 check (priority > 0),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resident_contacts_resident_idx
  on public.resident_contacts (resident_id, priority);

create trigger resident_contacts_set_updated_at
  before update on public.resident_contacts
  for each row execute function public.set_updated_at();

create or replace function public.set_resident_child_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation uuid;
begin
  select organisation_id into v_organisation
  from public.residents
  where id = new.resident_id;

  if v_organisation is null then
    raise exception 'Resident does not exist';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create trigger resident_contacts_set_organisation
  before insert or update of resident_id, organisation_id on public.resident_contacts
  for each row execute function public.set_resident_child_organisation();

-- Family / representative portal links -----------------------------------------

create table public.resident_relationships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  access_level resident_access_level not null default 'summary',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (resident_id, user_id)
);

create index resident_relationships_user_idx
  on public.resident_relationships (user_id, revoked_at);
create index resident_relationships_resident_idx
  on public.resident_relationships (resident_id, revoked_at);

create trigger resident_relationships_set_organisation
  before insert or update of resident_id, organisation_id on public.resident_relationships
  for each row execute function public.set_resident_child_organisation();

-- A single helper used by every resident-scoped RLS policy.
-- Family access is only possible through an explicit relationship row.
create or replace function public.can_access_resident(
  p_resident uuid,
  p_permission text default 'resident_view'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.residents r
    where r.id = p_resident
      and (
        public.is_super_admin()
        or public.has_permission(p_permission, r.organisation_id)
        or (
          p_permission = 'resident_view'
          and exists (
            select 1
            from public.resident_relationships rr
            where rr.resident_id = r.id
              and rr.user_id = auth.uid()
              and rr.revoked_at is null
          )
        )
      )
  );
$$;

revoke all on function public.can_access_resident(uuid, text) from public, anon;
grant execute on function public.can_access_resident(uuid, text) to authenticated;

-- Consents ---------------------------------------------------------------------

create table public.resident_consents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  consent_type resident_consent_type not null,
  granted boolean not null,
  granted_by_name text,
  effective_from date not null default current_date,
  expires_on date,
  withdrawn_at timestamptz,
  evidence_reference text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint resident_consents_dates check (
    expires_on is null or expires_on >= effective_from
  )
);

create index resident_consents_resident_idx
  on public.resident_consents (resident_id, consent_type, created_at desc);

create trigger resident_consents_set_organisation
  before insert or update of resident_id, organisation_id on public.resident_consents
  for each row execute function public.set_resident_child_organisation();

-- Consent history must not be rewritten. A change of consent is recorded as a
-- new row (for example granted = false after a withdrawal).
create or replace function public.guard_resident_consent_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    raise exception 'Consent records are append-only; record a new consent instead';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger resident_consents_guard_history
  before update or delete on public.resident_consents
  for each row execute function public.guard_resident_consent_history();

-- Access history ---------------------------------------------------------------

create table public.resident_access_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null default 'view',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index resident_access_events_resident_idx
  on public.resident_access_events (resident_id, created_at desc);
create index resident_access_events_user_idx
  on public.resident_access_events (user_id, created_at desc);

create trigger resident_access_events_set_organisation
  before insert on public.resident_access_events
  for each row execute function public.set_resident_child_organisation();

-- Records a view/read event for the current user. Only callable for a resident
-- the caller may already access, so it cannot be used to probe records.
create or replace function public.record_resident_access(
  p_resident uuid,
  p_action text default 'view',
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_access_resident(p_resident) then
    raise exception 'Not authorised to access this resident';
  end if;

  insert into public.resident_access_events (
    resident_id, user_id, action, metadata
  ) values (
    p_resident, auth.uid(), coalesce(p_action, 'view'), coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.record_resident_access(uuid, text, jsonb)
  from public, anon;
grant execute on function public.record_resident_access(uuid, text, jsonb)
  to authenticated;

-- Row Level Security -----------------------------------------------------------

alter table public.care_facilities enable row level security;
alter table public.residents enable row level security;
alter table public.resident_contacts enable row level security;
alter table public.resident_relationships enable row level security;
alter table public.resident_consents enable row level security;
alter table public.resident_access_events enable row level security;

-- Facilities: any active member can see the facility they work at; only staff
-- who may manage residents can change facility details.
create policy care_facilities_select on public.care_facilities
  for select using (
    public.is_org_member(organisation_id)
    or public.has_permission('resident_view', organisation_id)
    or public.has_permission('resident_manage', organisation_id)
  );

create policy care_facilities_insert on public.care_facilities
  for insert with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy care_facilities_update on public.care_facilities
  for update using (
    public.has_permission('resident_manage', organisation_id)
  )
  with check (
    public.has_permission('resident_manage', organisation_id)
  );

-- Residents: staff with resident_view or resident_manage, plus linked family.
create policy residents_select on public.residents
  for select using (
    public.can_access_resident(id)
  );

create policy residents_insert on public.residents
  for insert with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy residents_update on public.residents
  for update using (
    public.has_permission('resident_manage', organisation_id)
  )
  with check (
    public.has_permission('resident_manage', organisation_id)
  );

-- Contacts: readers of the resident; writes require resident_manage.
create policy resident_contacts_select on public.resident_contacts
  for select using (
    public.can_access_resident(resident_id)
  );

create policy resident_contacts_write on public.resident_contacts
  for insert with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy resident_contacts_update on public.resident_contacts
  for update using (
    public.has_permission('resident_manage', organisation_id)
  )
  with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy resident_contacts_delete on public.resident_contacts
  for delete using (
    public.has_permission('resident_manage', organisation_id)
  );

-- Relationships: the linked user sees their own link; managers manage links.
create policy resident_relationships_select on public.resident_relationships
  for select using (
    user_id = auth.uid()
    or public.has_permission('resident_manage', organisation_id)
  );

create policy resident_relationships_insert on public.resident_relationships
  for insert with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy resident_relationships_update on public.resident_relationships
  for update using (
    public.has_permission('resident_manage', organisation_id)
  )
  with check (
    public.has_permission('resident_manage', organisation_id)
  );

create policy resident_relationships_delete on public.resident_relationships
  for delete using (
    public.has_permission('resident_manage', organisation_id)
  );

-- Consents: readable by anyone who may read the resident; appended by managers.
create policy resident_consents_select on public.resident_consents
  for select using (
    public.can_access_resident(resident_id)
  );

create policy resident_consents_insert on public.resident_consents
  for insert with check (
    public.has_permission('resident_manage', organisation_id)
  );

-- Access events: only managers and auditors read them. Writes go through the
-- security-definer RPC above.
create policy resident_access_events_select on public.resident_access_events
  for select using (
    public.has_permission('resident_manage', organisation_id)
    or public.has_permission('audit_log_view', organisation_id)
  );
