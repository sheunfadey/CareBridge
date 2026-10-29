-- =============================================================================
-- CareBridge — Phase 2: identity, organisations and access control
-- Migration: 0001_core_identity.sql
-- =============================================================================

-- Semantic enums -------------------------------------------------------------

create type organisation_type as enum (
  'platform_academy',
  'training_provider',
  'care_home',
  'home_care_agency',
  'recruitment_partner',
  'charity',
  'corporate_customer'
);

create type organisation_status as enum (
  'pending',
  'active',
  'suspended',
  'disabled'
);

create type verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

create type membership_status as enum (
  'invited',
  'active',
  'suspended',
  'removed'
);

create type account_status as enum ('active', 'deactivated');

create type account_type as enum (
  'caregiver',
  'training_provider',
  'care_provider',
  'referral_partner',
  'charity',
  'employer'
);

-- Shared trigger to maintain updated_at --------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  state text,
  city text,
  account_type account_type,
  onboarding_completed_at timestamptz,
  timezone text not null default 'Africa/Lagos',
  is_super_admin boolean not null default false,
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- organisations --------------------------------------------------------------

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type organisation_type not null,
  status organisation_status not null default 'pending',
  verification_status verification_status not null default 'unverified',
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  state text,
  city text,
  permitted_modules text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$')
);

create index organisations_type_idx on public.organisations (type);
create index organisations_status_idx on public.organisations (status);

create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

-- organisation_memberships ---------------------------------------------------

create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status membership_status not null default 'invited',
  is_owner boolean not null default false,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index organisation_memberships_user_idx
  on public.organisation_memberships (user_id, status);
create index organisation_memberships_org_idx
  on public.organisation_memberships (organisation_id, status);

create trigger organisation_memberships_set_updated_at
  before update on public.organisation_memberships
  for each row execute function public.set_updated_at();

-- roles / permissions --------------------------------------------------------

create table public.roles (
  key text primary key,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_key text not null references public.roles (key) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_key text not null references public.roles (key) on delete cascade,
  -- null organisation_id means a platform-wide assignment
  organisation_id uuid references public.organisations (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index user_role_assignments_user_idx
  on public.user_role_assignments (user_id);
create index user_role_assignments_org_idx
  on public.user_role_assignments (organisation_id);

-- Only one row per (user, role, organisation); nulls handled by a unique index.
create unique index user_role_assignments_unique
  on public.user_role_assignments (
    user_id,
    role_key,
    coalesce(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- organisation_invitations ---------------------------------------------------

create table public.organisation_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  email text not null,
  role_key text not null references public.roles (key),
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index organisation_invitations_email_idx
  on public.organisation_invitations (lower(email), status);

-- organisation_verifications -------------------------------------------------

create table public.organisation_verifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  status verification_status not null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index organisation_verifications_org_idx
  on public.organisation_verifications (organisation_id);

-- user_consents --------------------------------------------------------------

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null,
  version text not null,
  granted boolean not null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, version)
);

-- user_notification_preferences ----------------------------------------------

create table public.user_notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger user_notification_preferences_set_updated_at
  before update on public.user_notification_preferences
  for each row execute function public.set_updated_at();

-- audit_logs -----------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  organisation_id uuid references public.organisations (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_org_idx on public.audit_logs (organisation_id, created_at desc);

-- New auth user → profile ----------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Access helpers -------------------------------------------------------------

-- Organisations the current user belongs to (active membership).
create or replace function public.current_organisation_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(organisation_id), '{}')
  from public.organisation_memberships
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Whether the current user is a member (any status) of an organisation.
create or replace function public.is_org_member(p_organisation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_memberships
    where organisation_id = p_organisation
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

-- Whether the current user holds a permission, optionally scoped to an org.
-- Checks platform-wide assignments plus assignments for the given organisation.
create or replace function public.has_permission(
  p_permission text,
  p_organisation uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.user_role_assignments ura
      join public.role_permissions rp on rp.role_key = ura.role_key
      where ura.user_id = auth.uid()
        and rp.permission_key = p_permission
        and (
          ura.organisation_id is null
          or ura.organisation_id = p_organisation
        )
    );
$$;
