-- =============================================================================
-- CareBridge - Allow course creators to read their new draft
-- Migration: 0034_course_creator_select.sql
--
-- INSERT ... RETURNING evaluates the SELECT policy against the new row. The
-- existing policy only used course_readable(), whose stable subquery cannot see
-- the row in the same command. Adding the direct created_by check lets course
-- managers create drafts with RETURNING without weakening published-course
-- access.
-- =============================================================================

drop policy if exists courses_select on public.courses;

create policy courses_select on public.courses
  for select using (
    created_by = auth.uid()
    or public.course_readable(id)
  );
