-- =============================================================================
-- CareBridge - Public course instructor names
-- Migration: 0048_course_instructor_names.sql
--
-- Profiles are only readable by people who share an organisation with them, so
-- the public catalogue cannot join instructor names directly. This function
-- exposes just the display name of the instructor attached to a published,
-- public course. Nothing else from the profile is returned.
-- =============================================================================

create or replace function public.course_instructor_names()
returns table (course_id uuid, instructor_name text)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as course_id,
    coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)) as instructor_name
  from public.courses c
  join public.profiles p on p.id = c.instructor_id
  where c.status = 'published'
    and c.is_public = true;
$$;

revoke all on function public.course_instructor_names() from public;
grant execute on function public.course_instructor_names() to anon;
grant execute on function public.course_instructor_names() to authenticated;
grant execute on function public.course_instructor_names() to service_role;
