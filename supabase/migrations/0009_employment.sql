-- =============================================================================
-- CareBridge - Phase 5: internships and employment marketplace
-- Migration: 0009_employment.sql
--
-- Placement providers, internship listings and applications, employer job
-- postings and job applications. All tenant-owned rows carry an organisation
-- scope and are protected by Row Level Security. Applications are owned by the
-- applicant; organisations may only read applications for their own listings.
--
-- Later phases add placements, supervisors, evaluations, interviews, offers and
-- verification records. This migration intentionally covers the browse/apply and
-- employer-posting workflow so both sides work end to end.
-- =============================================================================

create type employment_type as enum (
  'full_time',
  'part_time',
  'temporary',
  'contract',
  'internship'
);

create type job_status as enum (
  'draft',
  'pending_approval',
  'published',
  'closed',
  'archived'
);

create type application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'offered',
  'hired',
  'rejected',
  'withdrawn'
);

create type internship_listing_status as enum (
  'draft',
  'open',
  'closed',
  'archived'
);

create type internship_application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'offered',
  'accepted',
  'rejected',
  'withdrawn'
);

-- Placement providers --------------------------------------------------------

-- A placement provider is an organisation authorised to host interns. Verification
-- is a separate controlled process (see organisation_verifications); this row
-- records the operational profile used for listings.
create table public.placement_providers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique
    references public.organisations (id) on delete cascade,
  description text,
  contact_email text,
  contact_phone text,
  address text,
  state text,
  city text,
  safeguarding_lead text,
  is_accepting_interns boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger placement_providers_set_updated_at
  before update on public.placement_providers
  for each row execute function public.set_updated_at();

-- Internship listings --------------------------------------------------------

create table public.internship_listings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  state text,
  city text,
  location text,
  start_date date,
  end_date date,
  expected_hours integer check (expected_hours is null or expected_hours > 0),
  slots integer not null default 1 check (slots > 0),
  requirements text[] not null default '{}',
  learning_objectives text[] not null default '{}',
  application_deadline date,
  status internship_listing_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_listings_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint internship_listings_dates check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index internship_listings_organisation_idx
  on public.internship_listings (organisation_id, status);
create index internship_listings_open_idx
  on public.internship_listings (status, application_deadline);

create trigger internship_listings_set_updated_at
  before update on public.internship_listings
  for each row execute function public.set_updated_at();

create table public.internship_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null
    references public.internship_listings (id) on delete cascade,
  applicant_id uuid not null
    references public.profiles (id) on delete cascade,
  cover_note text,
  status internship_application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create index internship_applications_listing_idx
  on public.internship_applications (listing_id, status);
create index internship_applications_applicant_idx
  on public.internship_applications (applicant_id, submitted_at desc);

create trigger internship_applications_set_updated_at
  before update on public.internship_applications
  for each row execute function public.set_updated_at();

-- Job postings ---------------------------------------------------------------

create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  duties text[] not null default '{}',
  employment_type employment_type not null default 'full_time',
  work_location text,
  state text,
  city text,
  shift_requirements text,
  experience_requirements text,
  qualifications text[] not null default '{}',
  skills text[] not null default '{}',
  salary_min_minor_units bigint check (salary_min_minor_units is null or salary_min_minor_units >= 0),
  salary_max_minor_units bigint check (salary_max_minor_units is null or salary_max_minor_units >= 0),
  salary_currency text not null default 'NGN' check (char_length(salary_currency) = 3),
  is_salary_disclosed boolean not null default false,
  safeguarding_requirements text,
  application_deadline date,
  status job_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_postings_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint job_postings_salary_order check (
    salary_min_minor_units is null
    or salary_max_minor_units is null
    or salary_max_minor_units >= salary_min_minor_units
  ),
  constraint job_postings_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create index job_postings_organisation_idx
  on public.job_postings (organisation_id, status);
create index job_postings_public_idx
  on public.job_postings (status, published_at desc);
create index job_postings_filters_idx
  on public.job_postings (state, city, employment_type);

create trigger job_postings_set_updated_at
  before update on public.job_postings
  for each row execute function public.set_updated_at();

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null
    references public.job_postings (id) on delete cascade,
  applicant_id uuid not null
    references public.profiles (id) on delete cascade,
  cover_letter text,
  status application_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index job_applications_job_idx
  on public.job_applications (job_id, status);
create index job_applications_applicant_idx
  on public.job_applications (applicant_id, submitted_at desc);

create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

-- Access helpers -------------------------------------------------------------

create or replace function public.can_manage_internships(p_organisation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      p_organisation is not null
      and public.has_permission('internship_manage', p_organisation)
    );
$$;

create or replace function public.can_manage_jobs(p_organisation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      p_organisation is not null
      and public.has_permission('job_manage', p_organisation)
    );
$$;

-- Whether the current user may read an internship listing.
create or replace function public.internship_listing_readable(p_listing uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.internship_listings l
      where l.id = p_listing
        and (
          l.status = 'open'
          or public.can_manage_internships(l.organisation_id)
        )
    );
$$;

-- Whether the current user may read a job posting.
create or replace function public.job_readable(p_job uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.job_postings j
      where j.id = p_job
        and (
          j.status = 'published'
          or public.can_manage_jobs(j.organisation_id)
          or (
            (j.status = 'draft' or j.status = 'pending_approval' or j.status = 'closed')
            and public.has_permission('candidate_view', j.organisation_id)
          )
        )
    );
$$;

-- Row Level Security ---------------------------------------------------------

alter table public.placement_providers enable row level security;
alter table public.internship_listings enable row level security;
alter table public.internship_applications enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;

-- Placement providers
create policy placement_providers_select on public.placement_providers
  for select using (
    public.is_super_admin()
    or public.has_permission('internship_manage', organisation_id)
    or public.is_org_member(organisation_id)
  );

create policy placement_providers_write on public.placement_providers
  for all using (
    public.is_super_admin()
    or public.has_permission('internship_manage', organisation_id)
  )
  with check (
    public.is_super_admin()
    or public.has_permission('internship_manage', organisation_id)
  );

-- Internship listings
create policy internship_listings_select on public.internship_listings
  for select using (public.internship_listing_readable(id));

create policy internship_listings_insert on public.internship_listings
  for insert with check (
    public.is_super_admin()
    or public.has_permission('internship_manage', organisation_id)
  );

create policy internship_listings_update on public.internship_listings
  for update using (public.can_manage_internships(organisation_id))
  with check (public.can_manage_internships(organisation_id));

create policy internship_listings_delete on public.internship_listings
  for delete using (public.can_manage_internships(organisation_id));

-- Internship applications: applicants own their application; provider staff may
-- read applications for listings they manage.
create policy internship_applications_select on public.internship_applications
  for select using (
    applicant_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.internship_listings l
      where l.id = listing_id
        and public.can_manage_internships(l.organisation_id)
    )
  );

create policy internship_applications_insert on public.internship_applications
  for insert with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.internship_listings l
      where l.id = listing_id
        and l.status = 'open'
        and (l.application_deadline is null or l.application_deadline >= current_date)
    )
  );

create policy internship_applications_update_own on public.internship_applications
  for update using (
    applicant_id = auth.uid() and status in ('submitted', 'under_review')
  )
  with check (
    applicant_id = auth.uid() and status = 'withdrawn'
  );

create policy internship_applications_update_staff on public.internship_applications
  for update using (
    public.is_super_admin()
    or exists (
      select 1
      from public.internship_listings l
      where l.id = listing_id
        and public.can_manage_internships(l.organisation_id)
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1
      from public.internship_listings l
      where l.id = listing_id
        and public.can_manage_internships(l.organisation_id)
    )
  );

-- Job postings
create policy job_postings_select on public.job_postings
  for select using (public.job_readable(id));

create policy job_postings_insert on public.job_postings
  for insert with check (
    public.is_super_admin()
    or public.has_permission('job_manage', organisation_id)
  );

create policy job_postings_update on public.job_postings
  for update using (public.can_manage_jobs(organisation_id))
  with check (public.can_manage_jobs(organisation_id));

create policy job_postings_delete on public.job_postings
  for delete using (public.can_manage_jobs(organisation_id));

-- Job applications: applicants own their application; employer staff with
-- candidate_view or job_manage may read applications for their own jobs.
create policy job_applications_select on public.job_applications
  for select using (
    applicant_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.job_postings j
      where j.id = job_id
        and (
          public.has_permission('candidate_view', j.organisation_id)
          or public.can_manage_jobs(j.organisation_id)
        )
    )
  );

create policy job_applications_insert on public.job_applications
  for insert with check (
    applicant_id = auth.uid()
    and exists (
      select 1
      from public.job_postings j
      where j.id = job_id
        and j.status = 'published'
        and (j.application_deadline is null or j.application_deadline >= current_date)
    )
  );

create policy job_applications_update_own on public.job_applications
  for update using (
    applicant_id = auth.uid() and status in ('submitted', 'under_review')
  )
  with check (
    applicant_id = auth.uid() and status = 'withdrawn'
  );

create policy job_applications_update_staff on public.job_applications
  for update using (
    public.is_super_admin()
    or exists (
      select 1
      from public.job_postings j
      where j.id = job_id
        and public.can_manage_jobs(j.organisation_id)
    )
  )
  with check (
    public.is_super_admin()
    or exists (
      select 1
      from public.job_postings j
      where j.id = job_id
        and public.can_manage_jobs(j.organisation_id)
    )
  );
