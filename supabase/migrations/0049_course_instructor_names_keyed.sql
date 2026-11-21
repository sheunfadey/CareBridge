-- Return the instructor user id as well as the course id so callers can key the
-- result by either identifier. Dropped and recreated because the OUT row type
-- changed from the previous definition.
drop function if exists public.course_instructor_names();

create function public.course_instructor_names()
returns table (course_id uuid, instructor_id uuid, instructor_name text)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as course_id,
    c.instructor_id as instructor_id,
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
