-- =============================================================================
-- CareBridge - Phase 5 completion: placement execution, interviews and offers
-- Migration: 0011_placement_execution.sql
--
-- Adds the operational side of internships (placements, supervisors, attendance,
-- weekly logs, evaluations, incidents and completion records), the recruitment
-- side of employment (interviews and offers for jobs and placements) and a
-- guard that stops organisation owners from self-verifying.
--
-- Safety rules encoded here:
--   * only verified organisations can create placements or send offers;
--   * a placement must reference an accepted internship application;
--   * supervisors and managers can record operational data, candidates can read
--     their own placement and submit weekly logs / safeguarding concerns;
--   * completion records are issued manually after a completed placement.
-- =============================================================================

-- Enums ----------------------------------------------------------------------

create type placement_status as enum (
  'pending_agreement',
  'active',
  'completed',
  'terminated'
);

create type placement_agreement_status as enum (
  'pending',
  'accepted',
  'declined'
);

create type internship_log_status as enum (
  'submitted',
  'approved',
  'changes_requested'
);

create type attendance_status as enum (
  'present',
  'absent',
  'late',
  'excused'
);

create type evaluation_status as enum (
  'draft',
  'submitted'
);

create type evaluation_recommendation as enum (
  'pass',
  'needs_improvement',
  'fail'
);

create type incident_severity as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type incident_status as enum (
  'open',
  'investigating',
  'resolved',
  'closed'
);

create type interview_mode as enum (
  'in_person',
  'video',
  'phone'
);

create type interview_status as enum (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

create type offer_status as enum (
  'sent',
  'accepted',
  'declined',
  'withdrawn',
  'expired'
);

-- Placements -----------------------------------------------------------------

create table public.internship_placements (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  listing_id uuid not null
    references public.internship_listings (id) on delete cascade,
  application_id uuid not null unique
    references public.internship_applications (id) on delete cascade,
  candidate_id uuid not null
    references public.profiles (id) on delete cascade,
  supervisor_id uuid references public.profiles (id) on delete set null,
  status placement_status not null default 'pending_agreement',
  agreement_status placement_agreement_status not null default 'pending',
  location text,
  state text,
  city text,
  start_date date not null,
  end_date date not null,
  expected_hours integer check (expected_hours is null or expected_hours > 0),
  learning_objectives text[] not null default '{}',
  supervision_arrangements text,
  safeguarding_cleared boolean not null default false,
  insurance_cleared boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  completion_summary text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_placements_dates check (end_date >= start_date)
);

create index internship_placements_organisation_idx
  on public.internship_placements (organisation_id, status);
create index internship_placements_candidate_idx
  on public.internship_placements (candidate_id, status);
create index internship_placements_supervisor_idx
  on public.internship_placements (supervisor_id, status);

create trigger internship_placements_set_updated_at
  before update on public.internship_placements
  for each row execute function public.set_updated_at();

create table public.internship_logs (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null
    references public.internship_placements (id) on delete cascade,
  author_id uuid not null
    references public.profiles (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  hours integer not null default 0 check (hours >= 0 and hours <= 168),
  summary text not null,
  challenges text,
  next_steps text,
  status internship_log_status not null default 'submitted',
  supervisor_feedback text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_logs_dates check (week_end >= week_start),
  unique (placement_id, author_id, week_start)
);

create index internship_logs_placement_idx
  on public.internship_logs (placement_id, week_start desc);

create trigger internship_logs_set_updated_at
  before update on public.internship_logs
  for each row execute function public.set_updated_at();

create table public.internship_attendance (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null
    references public.internship_placements (id) on delete cascade,
  attendance_date date not null,
  status attendance_status not null default 'present',
  hours integer not null default 0 check (hours >= 0 and hours <= 24),
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement_id, attendance_date)
);

create index internship_attendance_placement_idx
  on public.internship_attendance (placement_id, attendance_date desc);

create trigger internship_attendance_set_updated_at
  before update on public.internship_attendance
  for each row execute function public.set_updated_at();

create table public.internship_evaluations (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null
    references public.internship_placements (id) on delete cascade,
  evaluator_id uuid not null
    references public.profiles (id) on delete cascade,
  evaluation_date date not null default current_date,
  overall_rating integer not null check (overall_rating between 1 and 5),
  care_practice_rating integer check (
    care_practice_rating is null or care_practice_rating between 1 and 5
  ),
  communication_rating integer check (
    communication_rating is null or communication_rating between 1 and 5
  ),
  professionalism_rating integer check (
    professionalism_rating is null or professionalism_rating between 1 and 5
  ),
  safeguarding_rating integer check (
    safeguarding_rating is null or safeguarding_rating between 1 and 5
  ),
  strengths text,
  areas_for_improvement text,
  recommendation evaluation_recommendation not null,
  status evaluation_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (placement_id, evaluator_id)
);

create index internship_evaluations_placement_idx
  on public.internship_evaluations (placement_id, evaluation_date desc);

create trigger internship_evaluations_set_updated_at
  before update on public.internship_evaluations
  for each row execute function public.set_updated_at();

create table public.internship_incidents (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null
    references public.internship_placements (id) on delete cascade,
  reported_by uuid not null
    references public.profiles (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  category text not null,
  severity incident_severity not null default 'medium',
  description text not null,
  status incident_status not null default 'open',
  resolution text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index internship_incidents_placement_idx
  on public.internship_incidents (placement_id, occurred_at desc);
create index internship_incidents_status_idx
  on public.internship_incidents (status, severity);

create trigger internship_incidents_set_updated_at
  before update on public.internship_incidents
  for each row execute function public.set_updated_at();

create table public.internship_completion_records (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null unique
    references public.internship_placements (id) on delete cascade,
  candidate_id uuid not null
    references public.profiles (id) on delete cascade,
  organisation_id uuid not null
    references public.organisations (id) on delete cascade,
  certificate_code text not null unique,
  hours_completed integer not null default 0 check (hours_completed >= 0),
  outcome text not null default 'completed',
  summary text,
  issued_by uuid references public.profiles (id) on delete set null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index internship_completion_candidate_idx
  on public.internship_completion_records (candidate_id, issued_at desc);

-- Interviews -----------------------------------------------------------------

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid
    references public.job_applications (id) on delete cascade,
  internship_application_id uuid
    references public.internship_applications (id) on delete cascade,
  scheduled_by uuid references public.profiles (id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30
    check (duration_minutes between 10 and 480),
  mode interview_mode not null default 'in_person',
  location text,
  meeting_link text,
  status interview_status not null default 'scheduled',
  feedback text,
  rating integer check (rating is null or rating between 1 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interviews_single_application check (
    (job_application_id is not null)::int
    + (internship_application_id is not null)::int = 1
  )
);

create index interviews_job_application_idx
  on public.interviews (job_application_id, scheduled_at desc);
create index interviews_internship_application_idx
  on public.interviews (internship_application_id, scheduled_at desc);
create index interviews_scheduled_idx
  on public.interviews (status, scheduled_at);

create trigger interviews_set_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

-- Offers ---------------------------------------------------------------------

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique
    references public.job_applications (id) on delete cascade,
  offered_by uuid references public.profiles (id) on delete set null,
  employment_type employment_type not null default 'full_time',
  salary_minor_units bigint check (salary_minor_units is null or salary_minor_units >= 0),
  salary_currency text not null default 'NGN' check (char_length(salary_currency) = 3),
  start_date date,
  expires_at timestamptz,
  status offer_status not null default 'sent',
  notes text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_offers_application_idx on public.job_offers (application_id);

create trigger job_offers_set_updated_at
  before update on public.job_offers
  for each row execute function public.set_updated_at();

create table public.internship_offers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique
    references public.internship_applications (id) on delete cascade,
  offered_by uuid references public.profiles (id) on delete set null,
  start_date date,
  end_date date,
  expected_hours integer check (expected_hours is null or expected_hours > 0),
  location text,
  expires_at timestamptz,
  status offer_status not null default 'sent',
  notes text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_offers_dates check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index internship_offers_application_idx
  on public.internship_offers (application_id);

create trigger internship_offers_set_updated_at
  before update on public.internship_offers
  for each row execute function public.set_updated_at();

-- Access helpers -------------------------------------------------------------

create or replace function public.can_read_placement(p_placement uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.internship_placements p
      where p.id = p_placement
        and (
          p.candidate_id = auth.uid()
          or p.supervisor_id = auth.uid()
          or public.can_manage_internships(p.organisation_id)
        )
    );
$$;

create or replace function public.can_supervise_placement(p_placement uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.internship_placements p
      where p.id = p_placement
        and (
          p.supervisor_id = auth.uid()
          or public.can_manage_internships(p.organisation_id)
        )
    );
$$;

create or replace function public.job_application_organisation(p_application uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select j.organisation_id
  from public.job_applications a
  join public.job_postings j on j.id = a.job_id
  where a.id = p_application;
$$;

create or replace function public.internship_application_organisation(p_application uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.organisation_id
  from public.internship_applications a
  join public.internship_listings l on l.id = a.listing_id
  where a.id = p_application;
$$;

-- Organisation verification guard -------------------------------------------

-- Owners may request verification (unverified/rejected -> pending) but cannot
-- mark themselves verified or change the organisation status. Platform
-- administrators and trusted server-side connections (auth.uid() is null) may.
create or replace function public.prevent_organisation_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and not public.is_super_admin()
     and not public.has_permission('organisation_review', null)
     and auth.uid() is not null then
    if new.verification_status = 'pending'
       and old.verification_status in ('unverified', 'rejected')
       and exists (
         select 1
         from public.organisation_memberships m
         where m.organisation_id = new.id
           and m.user_id = auth.uid()
           and m.is_owner
           and m.status = 'active'
       ) then
      -- allowed: owner requests a review
      null;
    else
      new.verification_status = old.verification_status;
    end if;
  end if;

  if new.status is distinct from old.status
     and not public.is_super_admin()
     and not public.has_permission('organisation_review', null)
     and auth.uid() is not null then
    new.status = old.status;
  end if;

  return new;
end;
$$;

create trigger organisations_prevent_privilege_escalation
  before update on public.organisations
  for each row execute function public.prevent_organisation_privilege_escalation();

-- Row Level Security ---------------------------------------------------------

alter table public.internship_placements enable row level security;
alter table public.internship_logs enable row level security;
alter table public.internship_attendance enable row level security;
alter table public.internship_evaluations enable row level security;
alter table public.internship_incidents enable row level security;
alter table public.internship_completion_records enable row level security;
alter table public.interviews enable row level security;
alter table public.job_offers enable row level security;
alter table public.internship_offers enable row level security;

-- Placements
create policy internship_placements_select on public.internship_placements
  for select using (public.can_read_placement(id));

create policy internship_placements_insert on public.internship_placements
  for insert with check (
    public.is_super_admin()
    or (
      public.can_manage_internships(organisation_id)
      and exists (
        select 1
        from public.organisations o
        where o.id = organisation_id
          and o.verification_status = 'verified'
      )
      and exists (
        select 1
        from public.internship_applications a
        join public.internship_listings l on l.id = a.listing_id
        where a.id = application_id
          and a.status = 'accepted'
          and a.applicant_id = candidate_id
          and l.id = listing_id
          and l.organisation_id = organisation_id
      )
    )
  );

create policy internship_placements_update on public.internship_placements
  for update using (public.can_manage_internships(organisation_id))
  with check (public.can_manage_internships(organisation_id));

create policy internship_placements_delete on public.internship_placements
  for delete using (public.can_manage_internships(organisation_id));

-- Weekly logs: candidate authors their own, supervisors/managers review.
create policy internship_logs_select on public.internship_logs
  for select using (public.can_read_placement(placement_id));

create policy internship_logs_insert on public.internship_logs
  for insert with check (
    author_id = auth.uid()
    and public.can_read_placement(placement_id)
    and exists (
      select 1
      from public.internship_placements p
      where p.id = placement_id
        and p.status = 'active'
        and (p.candidate_id = auth.uid() or public.can_supervise_placement(p.id))
    )
  );

create policy internship_logs_update_author on public.internship_logs
  for update using (
    author_id = auth.uid() and status = 'submitted'
  )
  with check (author_id = auth.uid() and status = 'submitted');

create policy internship_logs_update_supervisor on public.internship_logs
  for update using (public.can_supervise_placement(placement_id))
  with check (public.can_supervise_placement(placement_id));

create policy internship_logs_delete on public.internship_logs
  for delete using (public.can_supervise_placement(placement_id));

-- Attendance
create policy internship_attendance_select on public.internship_attendance
  for select using (public.can_read_placement(placement_id));

create policy internship_attendance_write on public.internship_attendance
  for all using (public.can_supervise_placement(placement_id))
  with check (public.can_supervise_placement(placement_id));

-- Evaluations
create policy internship_evaluations_select on public.internship_evaluations
  for select using (public.can_read_placement(placement_id));

create policy internship_evaluations_insert on public.internship_evaluations
  for insert with check (
    evaluator_id = auth.uid()
    and public.can_supervise_placement(placement_id)
  );

create policy internship_evaluations_update on public.internship_evaluations
  for update using (
    evaluator_id = auth.uid() or public.can_supervise_placement(placement_id)
  )
  with check (public.can_supervise_placement(placement_id));

create policy internship_evaluations_delete on public.internship_evaluations
  for delete using (public.can_supervise_placement(placement_id));

-- Incidents: candidates may report, supervisors/managers may resolve.
create policy internship_incidents_select on public.internship_incidents
  for select using (public.can_read_placement(placement_id));

create policy internship_incidents_insert on public.internship_incidents
  for insert with check (
    reported_by = auth.uid()
    and public.can_read_placement(placement_id)
  );

create policy internship_incidents_update on public.internship_incidents
  for update using (public.can_supervise_placement(placement_id))
  with check (public.can_supervise_placement(placement_id));

create policy internship_incidents_delete on public.internship_incidents
  for delete using (public.can_supervise_placement(placement_id));

-- Completion records
create policy internship_completion_select on public.internship_completion_records
  for select using (public.can_read_placement(placement_id));

create policy internship_completion_insert on public.internship_completion_records
  for insert with check (
    public.can_manage_internships(organisation_id)
    and exists (
      select 1
      from public.internship_placements p
      where p.id = placement_id
        and p.status = 'completed'
        and p.safeguarding_cleared
        and p.completed_at is not null
    )
  );

create policy internship_completion_update on public.internship_completion_records
  for update using (public.can_manage_internships(organisation_id))
  with check (public.can_manage_internships(organisation_id));

create policy internship_completion_delete on public.internship_completion_records
  for delete using (public.can_manage_internships(organisation_id));

-- Interviews: applicants read their own; staff with the matching permission read
-- and write. An interview belongs to exactly one application.
create policy interviews_select on public.interviews
  for select using (
    public.is_super_admin()
    or (
      job_application_id is not null
      and exists (
        select 1
        from public.job_applications a
        where a.id = job_application_id
          and (
            a.applicant_id = auth.uid()
            or public.can_manage_jobs(public.job_application_organisation(a.id))
            or public.has_permission(
              'candidate_view',
              public.job_application_organisation(a.id)
            )
          )
      )
    )
    or (
      internship_application_id is not null
      and exists (
        select 1
        from public.internship_applications a
        where a.id = internship_application_id
          and (
            a.applicant_id = auth.uid()
            or public.can_manage_internships(
              public.internship_application_organisation(a.id)
            )
          )
      )
    )
  );

create policy interviews_insert on public.interviews
  for insert with check (
    public.is_super_admin()
    or (
      job_application_id is not null
      and public.can_manage_jobs(public.job_application_organisation(job_application_id))
    )
    or (
      internship_application_id is not null
      and public.can_manage_internships(
        public.internship_application_organisation(internship_application_id)
      )
    )
  );

create policy interviews_update on public.interviews
  for update using (
    public.is_super_admin()
    or (
      job_application_id is not null
      and public.can_manage_jobs(public.job_application_organisation(job_application_id))
    )
    or (
      internship_application_id is not null
      and public.can_manage_internships(
        public.internship_application_organisation(internship_application_id)
      )
    )
  )
  with check (
    public.is_super_admin()
    or (
      job_application_id is not null
      and public.can_manage_jobs(public.job_application_organisation(job_application_id))
    )
    or (
      internship_application_id is not null
      and public.can_manage_internships(
        public.internship_application_organisation(internship_application_id)
      )
    )
  );

create policy interviews_delete on public.interviews
  for delete using (
    public.is_super_admin()
    or (
      job_application_id is not null
      and public.can_manage_jobs(public.job_application_organisation(job_application_id))
    )
    or (
      internship_application_id is not null
      and public.can_manage_internships(
        public.internship_application_organisation(internship_application_id)
      )
    )
  );

-- Job offers
create policy job_offers_select on public.job_offers
  for select using (
    public.is_super_admin()
    or exists (
      select 1
      from public.job_applications a
      where a.id = application_id
        and (
          a.applicant_id = auth.uid()
          or public.can_manage_jobs(public.job_application_organisation(a.id))
        )
    )
  );

create policy job_offers_insert on public.job_offers
  for insert with check (
    public.is_super_admin()
    or (
      public.can_manage_jobs(public.job_application_organisation(application_id))
      and exists (
        select 1
        from public.organisations o
        where o.id = public.job_application_organisation(application_id)
          and o.verification_status = 'verified'
      )
    )
  );

create policy job_offers_update_staff on public.job_offers
  for update using (
    public.is_super_admin()
    or public.can_manage_jobs(public.job_application_organisation(application_id))
  )
  with check (
    public.is_super_admin()
    or public.can_manage_jobs(public.job_application_organisation(application_id))
  );

create policy job_offers_update_applicant on public.job_offers
  for update using (
    status = 'sent'
    and exists (
      select 1
      from public.job_applications a
      where a.id = application_id
        and a.applicant_id = auth.uid()
    )
  )
  with check (
    status in ('accepted', 'declined')
    and responded_at is not null
    and exists (
      select 1
      from public.job_applications a
      where a.id = application_id
        and a.applicant_id = auth.uid()
    )
  );

-- Internship offers
create policy internship_offers_select on public.internship_offers
  for select using (
    public.is_super_admin()
    or exists (
      select 1
      from public.internship_applications a
      where a.id = application_id
        and (
          a.applicant_id = auth.uid()
          or public.can_manage_internships(
            public.internship_application_organisation(a.id)
          )
        )
    )
  );

create policy internship_offers_insert on public.internship_offers
  for insert with check (
    public.is_super_admin()
    or (
      public.can_manage_internships(
        public.internship_application_organisation(application_id)
      )
      and exists (
        select 1
        from public.organisations o
        where o.id = public.internship_application_organisation(application_id)
          and o.verification_status = 'verified'
      )
    )
  );

create policy internship_offers_update_staff on public.internship_offers
  for update using (
    public.is_super_admin()
    or public.can_manage_internships(
      public.internship_application_organisation(application_id)
    )
  )
  with check (
    public.is_super_admin()
    or public.can_manage_internships(
      public.internship_application_organisation(application_id)
    )
  );

create policy internship_offers_update_applicant on public.internship_offers
  for update using (
    status = 'sent'
    and exists (
      select 1
      from public.internship_applications a
      where a.id = application_id
        and a.applicant_id = auth.uid()
    )
  )
  with check (
    status in ('accepted', 'declined')
    and responded_at is not null
    and exists (
      select 1
      from public.internship_applications a
      where a.id = application_id
        and a.applicant_id = auth.uid()
    )
  );
