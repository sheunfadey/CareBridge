-- =============================================================================
-- CareBridge - Academy assessment engine
-- Migration: 0031_academy_assessments.sql
--
-- Assessments are course-level and auto-graded. Correct answers never leave the
-- database before an attempt is submitted: learners read question prompts and
-- options through a security-definer function that omits the answer key.
--
-- Attempts and answers are append-only after submission. Course completion can
-- require published assessments to be passed in addition to required lessons.
-- =============================================================================

create type assessment_kind as enum ('quiz', 'exam');
create type assessment_status as enum ('draft', 'published', 'archived');
create type assessment_question_type as enum (
  'single_choice',
  'multiple_choice',
  'true_false'
);
create type assessment_attempt_status as enum ('in_progress', 'submitted', 'expired');

-- Assessments -----------------------------------------------------------------

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete cascade,
  title text not null,
  instructions text,
  kind assessment_kind not null default 'quiz',
  pass_mark_percent integer not null default 70
    check (pass_mark_percent between 0 and 100),
  max_attempts integer not null default 3
    check (max_attempts between 1 and 20),
  time_limit_minutes integer
    check (time_limit_minutes is null or time_limit_minutes between 1 and 480),
  is_required boolean not null default false,
  status assessment_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_published_at_required check (
    status <> 'published' or published_at is not null
  )
);

create index assessments_course_idx
  on public.assessments (course_id, status);
create index assessments_organisation_idx
  on public.assessments (organisation_id, status);

create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

-- The owning organisation always follows the course, so RLS and permissions can
-- never be pointed at a different tenant.
create or replace function public.set_assessment_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select c.organisation_id into new.organisation_id
  from public.courses c
  where c.id = new.course_id;

  if not found then
    raise exception 'Course not found' using errcode = 'P0002';
  end if;

  return new;
end;
$$;

create trigger assessments_set_scope
  before insert or update of course_id on public.assessments
  for each row execute function public.set_assessment_scope();

-- Questions -------------------------------------------------------------------

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  prompt text not null,
  question_type assessment_question_type not null default 'single_choice',
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  points integer not null default 1 check (points between 1 and 100),
  explanation text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  constraint assessment_questions_options_array check (jsonb_typeof(options) = 'array'),
  constraint assessment_questions_answer_array check (
    jsonb_typeof(correct_answer) = 'array'
  )
);

create index assessment_questions_assessment_idx
  on public.assessment_questions (assessment_id, position);

create or replace function public.validate_assessment_question()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids text[];
  v_correct text[];
begin
  if jsonb_array_length(new.options) < 2 or jsonb_array_length(new.options) > 8 then
    raise exception 'A question needs between 2 and 8 options';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.options) as option
    where coalesce(option->>'id', '') = ''
       or coalesce(option->>'label', '') = ''
  ) then
    raise exception 'Every option needs an id and a label';
  end if;

  select array_agg(option->>'id') into v_ids
  from jsonb_array_elements(new.options) as option;

  if array_length(v_ids, 1) <>
     (select count(distinct value) from unnest(v_ids) as value) then
    raise exception 'Option ids must be unique';
  end if;

  select array_agg(value) into v_correct
  from jsonb_array_elements_text(new.correct_answer) as value;

  if v_correct is null or array_length(v_correct, 1) = 0 then
    raise exception 'A question needs at least one correct answer';
  end if;

  if array_length(v_correct, 1) <>
     (select count(distinct value) from unnest(v_correct) as value) then
    raise exception 'Correct answers must be unique';
  end if;

  if not (v_correct <@ v_ids) then
    raise exception 'Every correct answer must reference an option id';
  end if;

  if new.question_type in ('single_choice', 'true_false')
     and array_length(v_correct, 1) <> 1 then
    raise exception 'Single choice and true/false questions need exactly one correct answer';
  end if;

  if new.question_type = 'true_false' and array_length(v_ids, 1) <> 2 then
    raise exception 'True/false questions need exactly two options';
  end if;

  return new;
end;
$$;

create trigger assessment_questions_validate
  before insert or update on public.assessment_questions
  for each row execute function public.validate_assessment_question();

-- Attempts --------------------------------------------------------------------

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  enrolment_id uuid not null
    references public.course_enrolments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status assessment_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  submitted_at timestamptz,
  score_points integer check (score_points is null or score_points >= 0),
  max_points integer check (max_points is null or max_points >= 0),
  passed boolean,
  unique (assessment_id, enrolment_id, attempt_number)
);

create index assessment_attempts_enrolment_idx
  on public.assessment_attempts (enrolment_id, assessment_id);
create index assessment_attempts_user_idx
  on public.assessment_attempts (user_id, submitted_at desc)
  where submitted_at is not null;

create table public.assessment_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null
    references public.assessment_attempts (id) on delete cascade,
  question_id uuid not null
    references public.assessment_questions (id) on delete restrict,
  answer jsonb not null default '[]'::jsonb,
  is_correct boolean not null default false,
  awarded_points integer not null default 0 check (awarded_points >= 0),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  constraint assessment_attempt_answers_array check (jsonb_typeof(answer) = 'array')
);

create index assessment_attempt_answers_question_idx
  on public.assessment_attempt_answers (question_id);

-- Submitted attempts cannot be changed; answers are history.
create or replace function public.guard_assessment_attempt_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Assessment attempts cannot be deleted';
  end if;

  if old.status <> 'in_progress' then
    raise exception 'Submitted assessment attempts are immutable';
  end if;

  if new.assessment_id <> old.assessment_id
     or new.enrolment_id <> old.enrolment_id
     or new.user_id <> old.user_id
     or new.attempt_number <> old.attempt_number
     or new.started_at <> old.started_at then
    raise exception 'Assessment attempt identity cannot be changed';
  end if;

  return new;
end;
$$;

create trigger assessment_attempts_guard_history
  before update or delete on public.assessment_attempts
  for each row execute function public.guard_assessment_attempt_history();

create or replace function public.guard_assessment_answer_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Assessment answers are append-only';
end;
$$;

create trigger assessment_attempt_answers_guard_history
  before update or delete on public.assessment_attempt_answers
  for each row execute function public.guard_assessment_answer_history();

-- Completion helpers ----------------------------------------------------------

-- Required lessons in required modules must all have progress. A course with no
-- required lessons passes this check trivially.
create or replace function public.course_required_lessons_complete(p_enrolment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select count(*) filter (where not exists (
        select 1
        from public.lesson_progress lp
        where lp.enrolment_id = p_enrolment
          and lp.lesson_id = l.id
      )) = 0
      from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.course_enrolments e on e.course_id = m.course_id
      where e.id = p_enrolment
        and l.is_required
        and m.is_required
    ),
    true
  );
$$;

-- Every published, required assessment must have at least one passed attempt.
create or replace function public.course_required_assessments_complete(p_enrolment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.assessments a
    join public.course_enrolments e on e.course_id = a.course_id
    where e.id = p_enrolment
      and a.status = 'published'
      and a.is_required
      and not exists (
        select 1
        from public.assessment_attempts at
        where at.assessment_id = a.id
          and at.enrolment_id = p_enrolment
          and at.passed
      )
  );
$$;

-- Idempotent completion and certificate issue. Only called from security-definer
-- RPCs, never exposed to clients.
create or replace function public.finalise_course_completion(p_enrolment uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrolment public.course_enrolments%rowtype;
  v_course public.courses%rowtype;
  v_total integer;
  v_done integer;
  v_required_assessments integer;
  v_completion_id uuid;
  v_certificate_id uuid;
  v_learner_name text;
  v_certificate_number text;
  v_verification_code text;
begin
  select * into v_enrolment
  from public.course_enrolments
  where id = p_enrolment
  for update;

  if not found then
    return jsonb_build_object('courseCompleted', false);
  end if;

  select * into v_course
  from public.courses
  where id = v_enrolment.course_id;

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

  select count(*) into v_required_assessments
  from public.assessments a
  where a.course_id = v_course.id
    and a.status = 'published'
    and a.is_required;

  if v_done < v_total
     or not public.course_required_lessons_complete(v_enrolment.id)
     or not public.course_required_assessments_complete(v_enrolment.id) then
    return jsonb_build_object(
      'courseCompleted', false,
      'completedLessons', v_done,
      'requiredLessons', v_total,
      'requiredAssessments', v_required_assessments
    );
  end if;

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
    v_enrolment.user_id,
    v_course.id,
    v_course.version,
    now(),
    jsonb_build_object(
      'required_lessons', v_total,
      'completed_lessons', v_done,
      'required_assessments', v_required_assessments,
      'policy', 'required_lessons_and_assessments'
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
    where p.id = v_enrolment.user_id;

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
      v_enrolment.user_id,
      v_course.id,
      v_certificate_number,
      v_verification_code,
      coalesce(v_learner_name, 'Learner'),
      v_course.title,
      v_course.certificate_issuer,
      'Course completion - ' || v_course.title,
      'This certificate records completion of a CareBridge course. It is not a government licence or external professional accreditation.'
    )
    on conflict (completion_record_id) do nothing
    returning id into v_certificate_id;

    if v_certificate_id is null then
      select id into v_certificate_id
      from public.certificates
      where completion_record_id = v_completion_id;
    end if;
  end if;

  return jsonb_build_object(
    'courseCompleted', true,
    'completionId', v_completion_id,
    'certificateId', v_certificate_id,
    'completedLessons', v_done,
    'requiredLessons', v_total
  );
end;
$$;

revoke all on function public.course_required_lessons_complete(uuid)
  from public, anon, authenticated;
revoke all on function public.course_required_assessments_complete(uuid)
  from public, anon, authenticated;
revoke all on function public.finalise_course_completion(uuid)
  from public, anon, authenticated;

-- Lesson completion now also respects required assessments.
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
  v_result jsonb := '{}'::jsonb;
  v_course_completed boolean := false;
  v_certificate_id uuid;
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
    v_result := public.finalise_course_completion(v_enrolment.id);
    v_course_completed := coalesce((v_result->>'courseCompleted')::boolean, false);
    if v_result->>'certificateId' is not null then
      v_certificate_id := (v_result->>'certificateId')::uuid;
    end if;
  end if;

  return jsonb_build_object(
    'lessonCompleted', true,
    'courseCompleted', v_course_completed,
    'completedLessons', v_done,
    'requiredLessons', v_total,
    'progressPercent',
      case when v_total = 0 then 100 else round(v_done * 100.0 / v_total) end,
    'certificateId', v_certificate_id
  );
end;
$$;

-- Start an attempt ------------------------------------------------------------

create or replace function public.start_assessment_attempt(p_assessment uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_assessment public.assessments%rowtype;
  v_enrolment public.course_enrolments%rowtype;
  v_attempt public.assessment_attempts%rowtype;
  v_used integer;
  v_questions jsonb;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_assessment
  from public.assessments
  where id = p_assessment;

  if not found then
    raise exception 'Assessment not found' using errcode = 'P0002';
  end if;

  if v_assessment.status <> 'published' then
    raise exception 'This assessment is not open' using errcode = 'P0001';
  end if;

  select * into v_enrolment
  from public.course_enrolments
  where course_id = v_assessment.course_id
    and user_id = v_user
    and status in ('active', 'completed')
  for update;

  if not found then
    raise exception 'Enrol in this course before taking assessments'
      using errcode = 'P0001';
  end if;

  select * into v_attempt
  from public.assessment_attempts
  where assessment_id = p_assessment
    and enrolment_id = v_enrolment.id
    and status = 'in_progress'
  order by attempt_number desc
  limit 1
  for update;

  if found
     and v_attempt.expires_at is not null
     and v_attempt.expires_at <= now() then
    update public.assessment_attempts
    set status = 'expired'
    where id = v_attempt.id;
    v_attempt := null;
  end if;

  if v_attempt.id is null then
    select count(*) into v_used
    from public.assessment_attempts
    where assessment_id = p_assessment
      and enrolment_id = v_enrolment.id
      and status in ('submitted', 'expired');

    if v_used >= v_assessment.max_attempts then
      raise exception 'No attempts remaining for this assessment'
        using errcode = 'P0001';
    end if;

    insert into public.assessment_attempts (
      assessment_id,
      enrolment_id,
      user_id,
      attempt_number,
      status,
      started_at,
      expires_at
    )
    values (
      p_assessment,
      v_enrolment.id,
      v_user,
      (
        select coalesce(max(attempt_number), 0) + 1
        from public.assessment_attempts
        where assessment_id = p_assessment
          and enrolment_id = v_enrolment.id
      ),
      'in_progress',
      now(),
      case
        when v_assessment.time_limit_minutes is null then null
        else now() + make_interval(mins => v_assessment.time_limit_minutes)
      end
    )
    returning * into v_attempt;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'prompt', q.prompt,
        'questionType', q.question_type,
        'options', q.options,
        'points', q.points,
        'position', q.position
      )
      order by q.position, q.id
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.assessment_questions q
  where q.assessment_id = p_assessment;

  if jsonb_array_length(v_questions) = 0 then
    raise exception 'This assessment has no questions yet' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'attemptId', v_attempt.id,
    'attemptNumber', v_attempt.attempt_number,
    'startedAt', v_attempt.started_at,
    'expiresAt', v_attempt.expires_at,
    'passMarkPercent', v_assessment.pass_mark_percent,
    'maxAttempts', v_assessment.max_attempts,
    'questions', v_questions
  );
end;
$$;

-- Submit and grade ------------------------------------------------------------

create or replace function public.submit_assessment_attempt(
  p_attempt uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt public.assessment_attempts%rowtype;
  v_assessment public.assessments%rowtype;
  v_question public.assessment_questions%rowtype;
  v_answer jsonb;
  v_is_correct boolean;
  v_score integer := 0;
  v_max integer := 0;
  v_percent integer := 0;
  v_passed boolean := false;
  v_results jsonb := '[]'::jsonb;
  v_awarded integer;
  v_final jsonb := '{}'::jsonb;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Answers must be an object keyed by question id'
      using errcode = '22023';
  end if;

  select * into v_attempt
  from public.assessment_attempts
  where id = p_attempt
  for update;

  if not found or v_attempt.user_id <> v_user then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'This attempt has already been submitted'
      using errcode = 'P0001';
  end if;

  select * into v_assessment
  from public.assessments
  where id = v_attempt.assessment_id;

  if v_attempt.expires_at is not null and v_attempt.expires_at <= now() then
    update public.assessment_attempts
    set status = 'expired',
        submitted_at = now()
    where id = v_attempt.id;
    raise exception 'The time limit for this attempt has expired'
      using errcode = 'P0001';
  end if;

  for v_question in
    select *
    from public.assessment_questions
    where assessment_id = v_attempt.assessment_id
    order by position, id
  loop
    v_answer := coalesce(
      p_answers -> v_question.id::text,
      '[]'::jsonb
    );

    if jsonb_typeof(v_answer) <> 'array' then
      raise exception 'Answer for question % must be an array', v_question.id
        using errcode = '22023';
    end if;

    v_is_correct := (
      select coalesce(array_agg(value order by value), '{}'::text[])
      from jsonb_array_elements_text(v_answer) as value
    ) = (
      select coalesce(array_agg(value order by value), '{}'::text[])
      from jsonb_array_elements_text(v_question.correct_answer) as value
    );

    v_awarded := case when v_is_correct then v_question.points else 0 end;
    v_max := v_max + v_question.points;
    v_score := v_score + v_awarded;

    insert into public.assessment_attempt_answers (
      attempt_id,
      question_id,
      answer,
      is_correct,
      awarded_points
    )
    values (
      v_attempt.id,
      v_question.id,
      v_answer,
      v_is_correct,
      v_awarded
    );

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'questionId', v_question.id,
        'correctOptionIds', v_question.correct_answer,
        'isCorrect', v_is_correct,
        'awardedPoints', v_awarded,
        'explanation', v_question.explanation
      )
    );
  end loop;

  if v_max > 0 then
    v_percent := round(v_score * 100.0 / v_max);
  end if;
  v_passed := v_percent >= v_assessment.pass_mark_percent;

  update public.assessment_attempts
  set status = 'submitted',
      submitted_at = now(),
      score_points = v_score,
      max_points = v_max,
      passed = v_passed
  where id = v_attempt.id;

  if v_passed then
    v_final := public.finalise_course_completion(v_attempt.enrolment_id);
  end if;

  return jsonb_build_object(
    'scorePoints', v_score,
    'maxPoints', v_max,
    'scorePercent', v_percent,
    'passed', v_passed,
    'passMarkPercent', v_assessment.pass_mark_percent,
    'results', v_results,
    'courseCompleted', coalesce((v_final->>'courseCompleted')::boolean, false),
    'certificateId', v_final->>'certificateId'
  );
end;
$$;

revoke all on function public.start_assessment_attempt(uuid) from public, anon;
revoke all on function public.submit_assessment_attempt(uuid, jsonb) from public, anon;
grant execute on function public.start_assessment_attempt(uuid) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid, jsonb) to authenticated;

-- Row Level Security ----------------------------------------------------------

alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_attempt_answers enable row level security;

-- Assessment metadata: published assessments for readers of the course; drafts
-- and answer keys stay with managers.
create policy assessments_select on public.assessments
  for select using (
    public.can_manage_course(course_id)
    or (status = 'published' and public.course_readable(course_id))
  );

create policy assessments_insert on public.assessments
  for insert with check (
    public.can_manage_course(course_id)
    and (
      public.is_super_admin()
      or public.has_permission('assessment_manage', organisation_id)
    )
  );

create policy assessments_update on public.assessments
  for update using (
    public.can_manage_course(course_id)
    and (
      public.is_super_admin()
      or public.has_permission('assessment_manage', organisation_id)
    )
  )
  with check (
    public.can_manage_course(course_id)
    and (
      public.is_super_admin()
      or public.has_permission('assessment_manage', organisation_id)
    )
  );

create policy assessments_delete on public.assessments
  for delete using (
    public.can_manage_course(course_id)
    and (
      public.is_super_admin()
      or public.has_permission('assessment_manage', organisation_id)
    )
    and not exists (
      select 1
      from public.assessment_attempts at
      where at.assessment_id = assessments.id
    )
  );

create policy assessment_questions_select on public.assessment_questions
  for select using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_id
        and public.can_manage_course(a.course_id)
    )
  );

create policy assessment_questions_write on public.assessment_questions
  for all using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_id
        and public.can_manage_course(a.course_id)
        and (
          public.is_super_admin()
          or public.has_permission('assessment_manage', a.organisation_id)
        )
    )
  )
  with check (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_id
        and public.can_manage_course(a.course_id)
        and (
          public.is_super_admin()
          or public.has_permission('assessment_manage', a.organisation_id)
        )
    )
  );

create policy assessment_attempts_select on public.assessment_attempts
  for select using (
    user_id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.assessments a
      where a.id = assessment_id
        and public.can_manage_course(a.course_id)
    )
  );

create policy assessment_attempt_answers_select
  on public.assessment_attempt_answers
  for select using (
    exists (
      select 1
      from public.assessment_attempts at
      where at.id = attempt_id
        and (
          at.user_id = auth.uid()
          or public.is_super_admin()
          or exists (
            select 1
            from public.assessments a
            where a.id = at.assessment_id
              and public.can_manage_course(a.course_id)
          )
        )
    )
  );
