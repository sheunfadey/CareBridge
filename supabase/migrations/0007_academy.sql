-- =============================================================================
-- CareBridge - Phase 4: Caregiver Academy foundation
-- Migration: 0007_academy.sql
--
-- Hierarchy: programme -> course -> module -> lesson -> resource.
-- Enrolment and lesson progress are owned by the learner. Course completion is
-- evaluated in the database so duplicate completion events cannot corrupt
-- progress or issue duplicate certificates.
-- =============================================================================

create type programme_status as enum ('active', 'archived');
create type course_status as enum ('draft', 'in_review', 'published', 'archived');
create type course_difficulty as enum ('foundation', 'intermediate', 'advanced');
create type enrolment_status as enum ('active', 'completed', 'withdrawn');
create type learning_resource_kind as enum (
  'pdf',
  'document',
  'presentation',
  'audio',
  'video',
  'image',
  'link',
  'other'
);

-- Programmes -----------------------------------------------------------------

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  status programme_status not null default 'active',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programmes_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$')
);

create index programmes_organisation_idx
  on public.programmes (organisation_id, status);

create trigger programmes_set_updated_at
  before update on public.programmes
  for each row execute function public.set_updated_at();

-- Courses --------------------------------------------------------------------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete restrict,
  organisation_id uuid references public.organisations (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  cover_image_url text,
  category text,
  learning_outcomes text[] not null default '{}',
  prerequisites text[] not null default '{}',
  difficulty course_difficulty not null default 'foundation',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  instructor_id uuid references public.profiles (id) on delete set null,
  status course_status not null default 'draft',
  published_at timestamptz,
  price_minor_units bigint not null default 0 check (price_minor_units >= 0),
  currency text not null default 'NGN' check (char_length(currency) = 3),
  scholarship_eligible boolean not null default false,
  enrolment_limit integer check (enrolment_limit is null or enrolment_limit > 0),
  completion_criteria jsonb not null default '{"required_lessons": true}'::jsonb,
  certificate_enabled boolean not null default true,
  certificate_issuer text not null default 'CareBridge',
  version integer not null default 1 check (version > 0),
  is_public boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  constraint courses_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create index courses_programme_idx on public.courses (programme_id);
create index courses_organisation_idx on public.courses (organisation_id, status);
create index courses_public_idx on public.courses (status, is_public, published_at desc);
create index courses_instructor_idx on public.courses (instructor_id);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- Modules --------------------------------------------------------------------

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  summary text,
  position integer not null default 0 check (position >= 0),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_modules_course_idx
  on public.course_modules (course_id, position);

create trigger course_modules_set_updated_at
  before update on public.course_modules
  for each row execute function public.set_updated_at();

-- Lessons --------------------------------------------------------------------

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null,
  slug text not null,
  content text not null default '',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  position integer not null default 0 check (position >= 0),
  is_required boolean not null default true,
  is_preview boolean not null default false,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create index lessons_module_idx on public.lessons (module_id, position);

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- Learning resources ---------------------------------------------------------

create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  title text not null,
  kind learning_resource_kind not null default 'link',
  storage_path text,
  external_url text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  is_private boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint learning_resources_location check (
    storage_path is not null or external_url is not null
  )
);

create index learning_resources_course_idx
  on public.learning_resources (course_id, position);
create index learning_resources_lesson_idx
  on public.learning_resources (lesson_id);

-- Enrolments -----------------------------------------------------------------

create table public.course_enrolments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete set null,
  status enrolment_status not null default 'active',
  source text not null default 'self'
    check (source in ('self', 'organisation', 'scholarship', 'platform')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index course_enrolments_user_idx
  on public.course_enrolments (user_id, status);
create index course_enrolments_course_idx
  on public.course_enrolments (course_id, status);

create trigger course_enrolments_set_updated_at
  before update on public.course_enrolments
  for each row execute function public.set_updated_at();

-- Lesson progress ------------------------------------------------------------

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references public.course_enrolments (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (enrolment_id, lesson_id)
);

create index lesson_progress_user_idx on public.lesson_progress (user_id);
create index lesson_progress_enrolment_idx
  on public.lesson_progress (enrolment_id);

-- Completion and certificates ------------------------------------------------

create table public.completion_records (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null unique
    references public.course_enrolments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  course_version integer not null,
  completed_at timestamptz not null default now(),
  criteria_snapshot jsonb not null default '{}'::jsonb
);

create index completion_records_user_idx
  on public.completion_records (user_id, completed_at desc);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  completion_record_id uuid not null unique
    references public.completion_records (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  certificate_number text not null unique,
  verification_code text not null unique,
  learner_name text not null,
  course_title text not null,
  issuer_name text not null,
  credential_scope text not null,
  disclaimer text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now()
);

create index certificates_user_idx on public.certificates (user_id);
create index certificates_course_idx on public.certificates (course_id);

-- Access helpers -------------------------------------------------------------

-- Whether the current user may manage a course and its structure.
create or replace function public.can_manage_course(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.courses c
      where c.id = p_course
        and (
          (
            c.organisation_id is not null
            and (
              public.has_permission('course_manage', c.organisation_id)
              or public.has_permission('learning_material_manage', c.organisation_id)
            )
          )
          or (
            c.organisation_id is null
            and (
              public.has_permission('course_manage', null)
              or public.has_permission('learning_material_manage', null)
            )
          )
        )
    );
$$;

create or replace function public.is_enrolled(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_enrolments e
    where e.course_id = p_course
      and e.user_id = auth.uid()
      and e.status in ('active', 'completed')
  );
$$;

-- Whether the current user may read a course and its learning content.
create or replace function public.course_readable(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or public.can_manage_course(p_course)
    or exists (
      select 1
      from public.courses c
      where c.id = p_course
        and (
          (c.status = 'published' and c.is_public)
          or public.is_enrolled(c.id)
          or (
            c.organisation_id is not null
            and public.has_permission('course_view', c.organisation_id)
          )
        )
    );
$$;

-- Enrolment ------------------------------------------------------------------

-- Enrols the current user in a published, free course. Idempotent: calling it
-- again returns the existing enrolment id. Payment-gated courses are rejected
-- until the payments phase is enabled.
create or replace function public.enrol_in_course(p_course uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_course public.courses%rowtype;
  v_enrolment uuid;
  v_count integer;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Lock the course row so the enrolment limit cannot be exceeded by
  -- concurrent requests.
  select * into v_course
  from public.courses
  where id = p_course
  for update;

  if not found then
    raise exception 'Course not found' using errcode = 'P0002';
  end if;

  if v_course.status <> 'published' then
    raise exception 'This course is not open for enrolment' using errcode = 'P0001';
  end if;

  select id into v_enrolment
  from public.course_enrolments
  where course_id = p_course
    and user_id = v_user;

  if v_enrolment is not null then
    update public.course_enrolments
    set status = 'active'
    where id = v_enrolment
      and status = 'withdrawn';
    return v_enrolment;
  end if;

  if v_course.price_minor_units > 0 then
    raise exception 'Payment is required before enrolment' using errcode = 'P0001';
  end if;

  if v_course.enrolment_limit is not null then
    select count(*) into v_count
    from public.course_enrolments
    where course_id = p_course
      and status in ('active', 'completed');

    if v_count >= v_course.enrolment_limit then
      raise exception 'This course is full' using errcode = 'P0001';
    end if;
  end if;

  insert into public.course_enrolments (course_id, user_id, status, source, enrolled_at)
  values (p_course, v_user, 'active', 'self', now())
  returning id into v_enrolment;

  return v_enrolment;
end;
$$;

-- Lesson completion and course completion ------------------------------------

create or replace function public.complete_lesson(p_lesson uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_lesson public.lessons%rowtype;
  v_course public.courses%rowtype;
  v_enrolment public.course_enrolments%rowtype;
  v_total integer;
  v_done integer;
  v_course_completed boolean := false;
  v_completion_id uuid;
  v_learner_name text;
  v_certificate_number text;
  v_verification_code text;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select l.* into v_lesson
  from public.lessons l
  where l.id = p_lesson;

  if not found then
    raise exception 'Lesson not found' using errcode = 'P0002';
  end if;

  select c.* into v_course
  from public.courses c
  join public.course_modules m on m.course_id = c.id
  where m.id = v_lesson.module_id;

  select * into v_enrolment
  from public.course_enrolments
  where course_id = v_course.id
    and user_id = v_user
    and status in ('active', 'completed')
  for update;

  if not found then
    raise exception 'Enrol in this course before recording progress' using errcode = 'P0001';
  end if;

  insert into public.lesson_progress (enrolment_id, lesson_id, user_id, completed_at)
  values (v_enrolment.id, p_lesson, v_user, now())
  on conflict (enrolment_id, lesson_id) do nothing;

  select count(*) into v_total
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  where m.course_id = v_course.id
    and l.is_required
    and m.is_required;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.course_modules m on m.id = l.module_id
  where lp.enrolment_id = v_enrolment.id
    and m.course_id = v_course.id
    and l.is_required
    and m.is_required;

  if v_total > 0 and v_done >= v_total then
    update public.course_enrolments
    set status = 'completed',
        completed_at = coalesce(completed_at, now())
    where id = v_enrolment.id;

    insert into public.completion_records (
      enrolment_id,
      user_id,
      course_id,
      course_version,
      completed_at,
      criteria_snapshot
    )
    values (
      v_enrolment.id,
      v_user,
      v_course.id,
      v_course.version,
      now(),
      jsonb_build_object(
        'required_lessons', v_total,
        'completed_lessons', v_done,
        'policy', 'all_required_lessons'
      )
    )
    on conflict (enrolment_id) do nothing
    returning id into v_completion_id;

    if v_completion_id is null then
      select id into v_completion_id
      from public.completion_records
      where enrolment_id = v_enrolment.id;
    end if;

    if v_course.certificate_enabled then
      select coalesce(p.full_name, p.email, 'Learner')
      into v_learner_name
      from public.profiles p
      where p.id = v_user;

      v_certificate_number :=
        'CB-' || to_char(now(), 'YYYY') || '-' ||
        upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      v_verification_code :=
        upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));

      insert into public.certificates (
        completion_record_id,
        user_id,
        course_id,
        certificate_number,
        verification_code,
        learner_name,
        course_title,
        issuer_name,
        credential_scope,
        disclaimer
      )
      values (
        v_completion_id,
        v_user,
        v_course.id,
        v_certificate_number,
        v_verification_code,
        coalesce(v_learner_name, 'Learner'),
        v_course.title,
        v_course.certificate_issuer,
        'Course completion - ' || v_course.title,
        'This certificate records completion of a CareBridge course. It is not a government licence or external professional accreditation.'
      )
      on conflict (completion_record_id) do nothing;
    end if;

    v_course_completed := true;
  end if;

  return jsonb_build_object(
    'lessonCompleted', true,
    'courseCompleted', v_course_completed,
    'completedLessons', v_done,
    'requiredLessons', v_total,
    'progressPercent',
      case when v_total = 0 then 100 else round(v_done * 100.0 / v_total) end
  );
end;
$$;

-- Public certificate verification. Returns only the fields intended for
-- verification; the holder supplies the verification code.
create or replace function public.get_public_certificate(p_code text)
returns table (
  certificate_number text,
  learner_name text,
  course_title text,
  issuer_name text,
  credential_scope text,
  disclaimer text,
  issued_at timestamptz,
  revoked boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_number,
    c.learner_name,
    c.course_title,
    c.issuer_name,
    c.credential_scope,
    c.disclaimer,
    c.issued_at,
    (c.revoked_at is not null)
  from public.certificates c
  where upper(c.verification_code) = upper(trim(p_code))
  limit 1;
$$;

-- Row Level Security ---------------------------------------------------------

alter table public.programmes enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.learning_resources enable row level security;
alter table public.course_enrolments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.completion_records enable row level security;
alter table public.certificates enable row level security;

-- Programmes: active programmes are public reference data; management is
-- restricted to platform administrators or training staff of the owning org.
create policy programmes_select on public.programmes
  for select using (
    status = 'active'
    or public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
  );

create policy programmes_insert on public.programmes
  for insert with check (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
  );

create policy programmes_update on public.programmes
  for update using (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
  )
  with check (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
  );

-- Courses: published public courses are readable anonymously. Drafts are
-- readable by managers and staff with course_view on the owning organisation.
create policy courses_select on public.courses
  for select using (public.course_readable(id));

create policy courses_insert on public.courses
  for insert with check (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
    or (
      organisation_id is null
      and public.has_permission('course_manage', null)
    )
  );

create policy courses_update on public.courses
  for update using (public.can_manage_course(id))
  with check (public.can_manage_course(id));

create policy courses_delete on public.courses
  for delete using (public.can_manage_course(id));

-- Course content -------------------------------------------------------------

create policy course_modules_select on public.course_modules
  for select using (public.course_readable(course_id));

create policy course_modules_write on public.course_modules
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

-- Lesson bodies are not public just because the course is published. Anonymous
-- visitors may read preview lessons only; full content requires enrolment or a
-- course management role.
create policy lessons_select on public.lessons
  for select using (
    exists (
      select 1
      from public.course_modules m
      where m.id = module_id
        and (
          public.can_manage_course(m.course_id)
          or public.is_enrolled(m.course_id)
          or (
            public.lessons.is_preview
            and exists (
              select 1
              from public.courses c
              where c.id = m.course_id
                and c.status = 'published'
                and c.is_public
            )
          )
        )
    )
  );

create policy lessons_write on public.lessons
  for all using (
    exists (
      select 1
      from public.course_modules m
      where m.id = module_id
        and public.can_manage_course(m.course_id)
    )
  )
  with check (
    exists (
      select 1
      from public.course_modules m
      where m.id = module_id
        and public.can_manage_course(m.course_id)
    )
  );

create policy learning_resources_select on public.learning_resources
  for select using (
    public.can_manage_course(course_id)
    or public.is_enrolled(course_id)
    or (
      not public.learning_resources.is_private
      and exists (
        select 1
        from public.courses c
        where c.id = course_id
          and c.status = 'published'
          and c.is_public
      )
    )
  );

create policy learning_resources_write on public.learning_resources
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

-- Enrolments: a learner reads their own; course managers read all enrolments on
-- their courses. Inserts happen through enrol_in_course (SECURITY DEFINER), so
-- there is no direct learner insert policy.
create policy enrolments_select on public.course_enrolments
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or public.can_manage_course(course_id)
    or (
      organisation_id is not null
      and public.has_permission('course_view', organisation_id)
    )
  );

create policy enrolments_insert_admin on public.course_enrolments
  for insert with check (
    public.is_super_admin()
    or public.can_manage_course(course_id)
  );

create policy enrolments_update_admin on public.course_enrolments
  for update using (
    public.is_super_admin()
    or public.can_manage_course(course_id)
  )
  with check (
    public.is_super_admin()
    or public.can_manage_course(course_id)
  );

-- Lesson progress: learners read and create their own records while enrolled.
create policy lesson_progress_select on public.lesson_progress
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.course_enrolments e
      where e.id = enrolment_id
        and public.can_manage_course(e.course_id)
    )
  );

create policy lesson_progress_insert_own on public.lesson_progress
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.course_enrolments e
      where e.id = enrolment_id
        and e.user_id = auth.uid()
        and e.status in ('active', 'completed')
    )
  );

-- Completion records and certificates: owners read their own; managers read
-- those for their courses. Rows are written by complete_lesson.
create policy completion_records_select on public.completion_records
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or public.can_manage_course(course_id)
  );

create policy certificates_select on public.certificates
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or public.can_manage_course(course_id)
  );

create policy certificates_update_revoke on public.certificates
  for update using (
    public.is_super_admin()
    or public.can_manage_course(course_id)
  )
  with check (
    public.is_super_admin()
    or public.can_manage_course(course_id)
  );
