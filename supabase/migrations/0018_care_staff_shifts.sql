-- =============================================================================
-- CareBridge - Phase 7: staff, shifts, daily care and care plans
-- Migration: 0018_care_staff_shifts.sql
--
-- Operational records for a care workspace. Every row is organisation-scoped.
-- Nothing is auto-assigned: a shift assignment is rejected when the worker is
-- not an active member, is already booked, or lacks the required qualification.
-- =============================================================================

create type care_employment_status as enum (
  'active',
  'on_leave',
  'suspended',
  'ended'
);

create type shift_status as enum (
  'draft',
  'published',
  'completed',
  'cancelled'
);

create type shift_assignment_status as enum (
  'assigned',
  'confirmed',
  'declined',
  'absent',
  'completed',
  'cancelled'
);

create type care_task_category as enum (
  'personal_care',
  'meals_hydration',
  'mobility',
  'activities',
  'observation',
  'clinical',
  'other'
);

create type care_task_record_status as enum (
  'completed',
  'refused',
  'not_done',
  'deferred'
);

create type care_review_outcome as enum (
  'accepted',
  'follow_up_required',
  'escalated'
);

create type care_plan_status as enum (
  'draft',
  'pending_approval',
  'active',
  'rejected',
  'archived'
);

create type care_plan_access as enum ('standard', 'restricted');

-- Staff ------------------------------------------------------------------------

create table public.care_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_title text,
  employment_status care_employment_status not null default 'active',
  start_date date,
  end_date date,
  availability jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id),
  constraint care_staff_dates check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create index care_staff_profiles_organisation_idx
  on public.care_staff_profiles (organisation_id, employment_status);
create index care_staff_profiles_user_idx
  on public.care_staff_profiles (user_id);

create trigger care_staff_profiles_set_updated_at
  before update on public.care_staff_profiles
  for each row execute function public.set_updated_at();

-- Staff must be active members of the organisation they belong to.
create or replace function public.guard_care_staff_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.organisation_memberships m
    where m.organisation_id = new.organisation_id
      and m.user_id = new.user_id
      and m.status = 'active'
  ) then
    raise exception 'Care staff must be an active member of the organisation';
  end if;
  return new;
end;
$$;

create trigger care_staff_profiles_guard_membership
  before insert or update of organisation_id, user_id on public.care_staff_profiles
  for each row execute function public.guard_care_staff_membership();

create table public.staff_qualifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  staff_id uuid not null
    references public.care_staff_profiles (id) on delete cascade,
  code text not null,
  name text not null,
  awarded_on date,
  expires_on date,
  verification_status verification_status not null default 'pending',
  evidence_reference text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, code),
  constraint staff_qualifications_dates check (
    expires_on is null or awarded_on is null or expires_on >= awarded_on
  )
);

create index staff_qualifications_staff_idx
  on public.staff_qualifications (staff_id, expires_on);

create trigger staff_qualifications_set_updated_at
  before update on public.staff_qualifications
  for each row execute function public.set_updated_at();

create or replace function public.set_care_staff_child_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation uuid;
begin
  select organisation_id into v_organisation
  from public.care_staff_profiles
  where id = new.staff_id;

  if v_organisation is null then
    raise exception 'Care staff profile does not exist';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create trigger staff_qualifications_set_organisation
  before insert or update of staff_id, organisation_id on public.staff_qualifications
  for each row execute function public.set_care_staff_child_organisation();

create table public.staff_training_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  staff_id uuid not null
    references public.care_staff_profiles (id) on delete cascade,
  title text not null,
  completed_on date not null default current_date,
  expires_on date,
  evidence_reference text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_training_dates check (
    expires_on is null or expires_on >= completed_on
  )
);

create index staff_training_records_staff_idx
  on public.staff_training_records (staff_id, expires_on);

create trigger staff_training_records_set_updated_at
  before update on public.staff_training_records
  for each row execute function public.set_updated_at();

create trigger staff_training_records_set_organisation
  before insert or update of staff_id, organisation_id on public.staff_training_records
  for each row execute function public.set_care_staff_child_organisation();

create table public.staff_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  staff_id uuid not null
    references public.care_staff_profiles (id) on delete cascade,
  document_type text not null,
  expires_on date,
  file_reference text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_documents_staff_idx
  on public.staff_documents (staff_id, expires_on);

create trigger staff_documents_set_updated_at
  before update on public.staff_documents
  for each row execute function public.set_updated_at();

create trigger staff_documents_set_organisation
  before insert or update of staff_id, organisation_id on public.staff_documents
  for each row execute function public.set_care_staff_child_organisation();

-- Shifts -----------------------------------------------------------------------

create table public.shift_schedules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  required_staff integer not null default 1 check (required_staff > 0),
  required_qualification text,
  notes text,
  status shift_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_schedules_window check (ends_at > starts_at)
);

create index shift_schedules_facility_idx
  on public.shift_schedules (facility_id, starts_at);
create index shift_schedules_organisation_idx
  on public.shift_schedules (organisation_id, status, starts_at);

create trigger shift_schedules_set_updated_at
  before update on public.shift_schedules
  for each row execute function public.set_updated_at();

create or replace function public.set_shift_organisation()
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
    raise exception 'Shift facility does not exist';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create trigger shift_schedules_set_organisation
  before insert or update of facility_id, organisation_id on public.shift_schedules
  for each row execute function public.set_shift_organisation();

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  shift_id uuid not null
    references public.shift_schedules (id) on delete cascade,
  staff_user_id uuid not null references public.profiles (id) on delete cascade,
  status shift_assignment_status not null default 'assigned',
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, staff_user_id)
);

create index shift_assignments_shift_idx
  on public.shift_assignments (shift_id, status);
create index shift_assignments_user_idx
  on public.shift_assignments (staff_user_id, created_at desc);

create trigger shift_assignments_set_updated_at
  before update on public.shift_assignments
  for each row execute function public.set_updated_at();

-- Assignment guard: membership, overlap and qualification are all checked in
-- the database so a client cannot bypass the scheduling rules.
create or replace function public.guard_shift_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.shift_schedules%rowtype;
  v_qualification record;
begin
  select * into v_shift from public.shift_schedules where id = new.shift_id;
  if not found then
    raise exception 'Shift does not exist';
  end if;

  new.organisation_id := v_shift.organisation_id;

  if not exists (
    select 1
    from public.organisation_memberships m
    where m.organisation_id = v_shift.organisation_id
      and m.user_id = new.staff_user_id
      and m.status = 'active'
  ) then
    raise exception 'Assigned staff must be an active member of the organisation';
  end if;

  if new.status not in ('declined', 'cancelled') then
    if exists (
      select 1
      from public.shift_assignments sa
      join public.shift_schedules s on s.id = sa.shift_id
      where sa.staff_user_id = new.staff_user_id
        and sa.id is distinct from new.id
        and sa.status not in ('declined', 'cancelled')
        and s.status <> 'cancelled'
        and tstzrange(s.starts_at, s.ends_at, '[)')
            && tstzrange(v_shift.starts_at, v_shift.ends_at, '[)')
    ) then
      raise exception 'This worker is already assigned to an overlapping shift';
    end if;
  end if;

  if v_shift.required_qualification is not null
     and new.status not in ('declined', 'cancelled') then
    select sq.id
      into v_qualification
    from public.care_staff_profiles sp
    join public.staff_qualifications sq on sq.staff_id = sp.id
    where sp.organisation_id = v_shift.organisation_id
      and sp.user_id = new.staff_user_id
      and sq.code = v_shift.required_qualification
      and sq.verification_status = 'verified'
      and (sq.expires_on is null or sq.expires_on >= v_shift.starts_at::date)
    limit 1;

    if v_qualification.id is null then
      raise exception 'The worker does not hold the required verified qualification';
    end if;
  end if;

  return new;
end;
$$;

create trigger shift_assignments_guard
  before insert or update of shift_id, staff_user_id, status on public.shift_assignments
  for each row execute function public.guard_shift_assignment();

create table public.shift_attendance (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  assignment_id uuid not null unique
    references public.shift_assignments (id) on delete cascade,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  source text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_attendance_window check (
    clock_out_at is null or clock_in_at is null or clock_out_at > clock_in_at
  )
);

create trigger shift_attendance_set_updated_at
  before update on public.shift_attendance
  for each row execute function public.set_updated_at();

create or replace function public.set_shift_child_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation uuid;
begin
  select organisation_id into v_organisation
  from public.shift_schedules
  where id = new.shift_id;

  if v_organisation is null then
    raise exception 'Shift does not exist';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create or replace function public.set_shift_attendance_organisation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation uuid;
begin
  select organisation_id into v_organisation
  from public.shift_assignments
  where id = new.assignment_id;

  if v_organisation is null then
    raise exception 'Shift assignment does not exist';
  end if;

  new.organisation_id := v_organisation;
  return new;
end;
$$;

create trigger shift_attendance_set_organisation
  before insert or update of assignment_id, organisation_id on public.shift_attendance
  for each row execute function public.set_shift_attendance_organisation();

create table public.shift_handovers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  shift_id uuid not null
    references public.shift_schedules (id) on delete cascade,
  facility_id uuid not null
    references public.care_facilities (id) on delete cascade,
  summary text not null,
  outstanding_tasks text,
  submitted_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index shift_handovers_shift_idx
  on public.shift_handovers (shift_id, created_at desc);

create or replace function public.set_shift_handover_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift public.shift_schedules%rowtype;
begin
  select * into v_shift from public.shift_schedules where id = new.shift_id;
  if not found then
    raise exception 'Shift does not exist';
  end if;
  new.organisation_id := v_shift.organisation_id;
  new.facility_id := v_shift.facility_id;
  return new;
end;
$$;

create trigger shift_handovers_set_scope
  before insert or update of shift_id on public.shift_handovers
  for each row execute function public.set_shift_handover_scope();

-- Resident-owned records (care plans, daily care) ------------------------------

create or replace function public.set_resident_owned_organisation()
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

-- Care plans -------------------------------------------------------------------

create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  title text not null,
  summary text,
  access_level care_plan_access not null default 'standard',
  status care_plan_status not null default 'draft',
  current_version_id uuid,
  review_due_on date,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_plans_resident_idx
  on public.care_plans (resident_id, status);

create trigger care_plans_set_updated_at
  before update on public.care_plans
  for each row execute function public.set_updated_at();

create trigger care_plans_set_organisation
  before insert or update of resident_id, organisation_id on public.care_plans
  for each row execute function public.set_resident_owned_organisation();

create or replace function public.guard_care_plan_status()
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
      when 'pending_approval' then new.status in ('active', 'rejected', 'draft')
      when 'rejected' then new.status in ('draft', 'archived')
      when 'active' then new.status in ('archived')
      when 'archived' then false
      else false
    end;

    if not allowed then
      raise exception 'Illegal care plan status transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'active' and new.approved_at is null then
      new.approved_at := now();
    end if;
    if new.status = 'archived' and new.archived_at is null then
      new.archived_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger care_plans_guard_status
  before update of status on public.care_plans
  for each row execute function public.guard_care_plan_status();

create table public.care_plan_versions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  plan_id uuid not null
    references public.care_plans (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  content jsonb not null default '{}'::jsonb,
  change_summary text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  unique (plan_id, version_number)
);

create index care_plan_versions_plan_idx
  on public.care_plan_versions (plan_id, version_number desc);

create or replace function public.set_care_plan_version_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.care_plans%rowtype;
begin
  select * into v_plan from public.care_plans where id = new.plan_id;
  if not found then
    raise exception 'Care plan does not exist';
  end if;

  new.organisation_id := v_plan.organisation_id;
  new.resident_id := v_plan.resident_id;

  if new.version_number is null then
    select coalesce(max(version_number), 0) + 1
      into new.version_number
    from public.care_plan_versions
    where plan_id = new.plan_id;
  end if;

  return new;
end;
$$;

create trigger care_plan_versions_set_scope
  before insert or update of plan_id on public.care_plan_versions
  for each row execute function public.set_care_plan_version_scope();

-- Versions are immutable apart from the approval stamp.
create or replace function public.guard_care_plan_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan_id is distinct from old.plan_id
     or new.resident_id is distinct from old.resident_id
     or new.version_number is distinct from old.version_number
     or new.content is distinct from old.content
     or new.change_summary is distinct from old.change_summary
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Care plan versions are immutable; create a new version instead';
  end if;
  return new;
end;
$$;

create trigger care_plan_versions_guard
  before update on public.care_plan_versions
  for each row execute function public.guard_care_plan_version();

alter table public.care_plans
  add constraint care_plans_current_version_fk
  foreign key (current_version_id)
  references public.care_plan_versions (id)
  on delete set null
  deferrable initially deferred;

create table public.care_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  plan_id uuid not null
    references public.care_plans (id) on delete cascade,
  staff_user_id uuid not null references public.profiles (id) on delete cascade,
  responsibility text not null,
  due_on date,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index care_plan_assignments_plan_idx
  on public.care_plan_assignments (plan_id, completed_at);
create index care_plan_assignments_user_idx
  on public.care_plan_assignments (staff_user_id, completed_at);

create or replace function public.set_care_plan_assignment_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan uuid;
begin
  select organisation_id into v_plan
  from public.care_plans
  where id = new.plan_id;

  if v_plan is null then
    raise exception 'Care plan does not exist';
  end if;

  new.organisation_id := v_plan;
  return new;
end;
$$;

create trigger care_plan_assignments_set_scope
  before insert or update of plan_id, organisation_id on public.care_plan_assignments
  for each row execute function public.set_care_plan_assignment_scope();

-- Daily care -------------------------------------------------------------------

create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  care_plan_id uuid references public.care_plans (id) on delete set null,
  title text not null,
  category care_task_category not null default 'other',
  instructions text,
  schedule_times text[] not null default '{}',
  requires_two_staff boolean not null default false,
  required_qualification text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_tasks_resident_idx
  on public.care_tasks (resident_id, is_active);
create index care_tasks_plan_idx
  on public.care_tasks (care_plan_id);

create trigger care_tasks_set_updated_at
  before update on public.care_tasks
  for each row execute function public.set_updated_at();

create trigger care_tasks_set_organisation
  before insert or update of resident_id, organisation_id on public.care_tasks
  for each row execute function public.set_resident_owned_organisation();

create table public.care_task_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  task_id uuid references public.care_tasks (id) on delete set null,
  resident_id uuid not null
    references public.residents (id) on delete cascade,
  shift_id uuid references public.shift_schedules (id) on delete set null,
  recorded_by uuid references public.profiles (id) on delete set null,
  status care_task_record_status not null default 'completed',
  completed_at timestamptz,
  assistance_notes text,
  meal_offered text,
  meal_consumed text,
  hydration_ml integer check (hydration_ml is null or hydration_ml >= 0),
  mobility_notes text,
  observations text,
  review_outcome care_review_outcome,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index care_task_records_resident_idx
  on public.care_task_records (resident_id, created_at desc);
create index care_task_records_shift_idx
  on public.care_task_records (shift_id);

create trigger care_task_records_set_updated_at
  before update on public.care_task_records
  for each row execute function public.set_updated_at();

create trigger care_task_records_set_organisation
  before insert or update of resident_id, organisation_id on public.care_task_records
  for each row execute function public.set_resident_owned_organisation();

-- A reviewed care record is locked against edits by the original recorder.
create or replace function public.guard_care_task_record_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.reviewed_at is not null
     and auth.uid() is not null
     and not public.has_permission('care_plan_manage', old.organisation_id) then
    raise exception 'Reviewed care records cannot be edited';
  end if;
  return new;
end;
$$;

create trigger care_task_records_guard_review
  before update on public.care_task_records
  for each row execute function public.guard_care_task_record_review();


-- Row Level Security -----------------------------------------------------------

alter table public.care_staff_profiles enable row level security;
alter table public.staff_qualifications enable row level security;
alter table public.staff_training_records enable row level security;
alter table public.staff_documents enable row level security;
alter table public.shift_schedules enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.shift_attendance enable row level security;
alter table public.shift_handovers enable row level security;
alter table public.care_tasks enable row level security;
alter table public.care_task_records enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_plan_versions enable row level security;
alter table public.care_plan_assignments enable row level security;

-- Staff records: managers, or the member of staff themselves.
create policy care_staff_profiles_select on public.care_staff_profiles
  for select using (
    public.has_permission('staff_manage', organisation_id)
    or user_id = auth.uid()
  );

create policy care_staff_profiles_write on public.care_staff_profiles
  for insert with check (
    public.has_permission('staff_manage', organisation_id)
  );

create policy care_staff_profiles_update on public.care_staff_profiles
  for update using (
    public.has_permission('staff_manage', organisation_id)
  )
  with check (
    public.has_permission('staff_manage', organisation_id)
  );

create policy care_staff_profiles_delete on public.care_staff_profiles
  for delete using (
    public.has_permission('staff_manage', organisation_id)
  );

create policy staff_qualifications_select on public.staff_qualifications
  for select using (
    public.has_permission('staff_manage', organisation_id)
    or exists (
      select 1 from public.care_staff_profiles sp
      where sp.id = staff_id and sp.user_id = auth.uid()
    )
  );

create policy staff_qualifications_write on public.staff_qualifications
  for all using (
    public.has_permission('staff_manage', organisation_id)
  )
  with check (
    public.has_permission('staff_manage', organisation_id)
  );

create policy staff_training_select on public.staff_training_records
  for select using (
    public.has_permission('staff_manage', organisation_id)
    or exists (
      select 1 from public.care_staff_profiles sp
      where sp.id = staff_id and sp.user_id = auth.uid()
    )
  );

create policy staff_training_write on public.staff_training_records
  for all using (
    public.has_permission('staff_manage', organisation_id)
  )
  with check (
    public.has_permission('staff_manage', organisation_id)
  );

create policy staff_documents_select on public.staff_documents
  for select using (
    public.has_permission('staff_manage', organisation_id)
    or exists (
      select 1 from public.care_staff_profiles sp
      where sp.id = staff_id and sp.user_id = auth.uid()
    )
  );

create policy staff_documents_write on public.staff_documents
  for all using (
    public.has_permission('staff_manage', organisation_id)
  )
  with check (
    public.has_permission('staff_manage', organisation_id)
  );

-- Shifts: anyone who may view rosters, managed by shift_manage.
create policy shift_schedules_select on public.shift_schedules
  for select using (
    public.has_permission('shift_view', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

create policy shift_schedules_write on public.shift_schedules
  for all using (
    public.has_permission('shift_manage', organisation_id)
  )
  with check (
    public.has_permission('shift_manage', organisation_id)
  );

create policy shift_assignments_select on public.shift_assignments
  for select using (
    public.has_permission('shift_view', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

create policy shift_assignments_write on public.shift_assignments
  for all using (
    public.has_permission('shift_manage', organisation_id)
  )
  with check (
    public.has_permission('shift_manage', organisation_id)
  );

create policy shift_attendance_select on public.shift_attendance
  for select using (
    public.has_permission('shift_view', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

create policy shift_attendance_insert on public.shift_attendance
  for insert with check (
    public.has_permission('shift_manage', organisation_id)
    or exists (
      select 1 from public.shift_assignments sa
      where sa.id = assignment_id and sa.staff_user_id = auth.uid()
    )
  );

create policy shift_attendance_update on public.shift_attendance
  for update using (
    public.has_permission('shift_manage', organisation_id)
    or exists (
      select 1 from public.shift_assignments sa
      where sa.id = assignment_id and sa.staff_user_id = auth.uid()
    )
  )
  with check (
    public.has_permission('shift_manage', organisation_id)
    or exists (
      select 1 from public.shift_assignments sa
      where sa.id = assignment_id and sa.staff_user_id = auth.uid()
    )
  );

create policy shift_handovers_select on public.shift_handovers
  for select using (
    public.has_permission('shift_view', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

create policy shift_handovers_insert on public.shift_handovers
  for insert with check (
    public.has_permission('care_record_manage', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

create policy shift_handovers_update on public.shift_handovers
  for update using (
    public.has_permission('care_record_manage', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  )
  with check (
    public.has_permission('care_record_manage', organisation_id)
    or public.has_permission('shift_manage', organisation_id)
  );

-- Daily care: only staff who record care or manage plans; never family readers.
create policy care_tasks_select on public.care_tasks
  for select using (
    public.can_access_resident(resident_id)
    and (
      public.has_permission('care_record_manage', organisation_id)
      or public.has_permission('care_plan_manage', organisation_id)
    )
  );

create policy care_tasks_write on public.care_tasks
  for all using (
    public.has_permission('care_plan_manage', organisation_id)
  )
  with check (
    public.has_permission('care_plan_manage', organisation_id)
  );

create policy care_task_records_select on public.care_task_records
  for select using (
    public.can_access_resident(resident_id)
    and (
      public.has_permission('care_record_manage', organisation_id)
      or public.has_permission('care_plan_manage', organisation_id)
      or public.has_permission('resident_manage', organisation_id)
    )
  );

create policy care_task_records_insert on public.care_task_records
  for insert with check (
    public.has_permission('care_record_manage', organisation_id)
    and public.can_access_resident(resident_id)
  );

create policy care_task_records_update on public.care_task_records
  for update using (
    public.has_permission('care_record_manage', organisation_id)
    or public.has_permission('care_plan_manage', organisation_id)
  )
  with check (
    public.has_permission('care_record_manage', organisation_id)
    or public.has_permission('care_plan_manage', organisation_id)
  );

-- Care plans: restricted plans are only visible to plan managers. Standard plans
-- are visible to staff with resident_view; family access requires an explicit
-- relationship plus the summary view served by the application.
create policy care_plans_select on public.care_plans
  for select using (
    public.can_access_resident(resident_id)
    and (
      public.has_permission('care_plan_manage', organisation_id)
      or (
        access_level = 'standard'
        and public.has_permission('resident_view', organisation_id)
      )
    )
  );

create policy care_plans_write on public.care_plans
  for all using (
    public.has_permission('care_plan_manage', organisation_id)
  )
  with check (
    public.has_permission('care_plan_manage', organisation_id)
  );

create policy care_plan_versions_select on public.care_plan_versions
  for select using (
    exists (
      select 1
      from public.care_plans p
      where p.id = plan_id
        and public.can_access_resident(p.resident_id)
        and (
          public.has_permission('care_plan_manage', p.organisation_id)
          or (
            p.access_level = 'standard'
            and public.has_permission('resident_view', p.organisation_id)
          )
        )
    )
  );

create policy care_plan_versions_write on public.care_plan_versions
  for all using (
    public.has_permission('care_plan_manage', organisation_id)
  )
  with check (
    public.has_permission('care_plan_manage', organisation_id)
  );

create policy care_plan_assignments_select on public.care_plan_assignments
  for select using (
    public.has_permission('care_plan_manage', organisation_id)
    or staff_user_id = auth.uid()
  );

create policy care_plan_assignments_write on public.care_plan_assignments
  for all using (
    public.has_permission('care_plan_manage', organisation_id)
  )
  with check (
    public.has_permission('care_plan_manage', organisation_id)
  );
