-- =============================================================================
-- CareBridge - Academy course permissions for organisation admins and trainers
-- Migration: 0033_academy_course_permissions.sql
--
-- Organisation owners and instructors can create and manage courses for their
-- organisation. Permissions stay organisation-scoped through role assignments;
-- RLS still decides which courses an account may read or write.
-- =============================================================================

insert into public.role_permissions (role_key, permission_key)
values
  ('care_home_owner', 'course_view'),
  ('care_home_owner', 'course_manage'),
  ('care_home_owner', 'course_publish'),
  ('care_home_owner', 'learning_material_manage'),
  ('care_home_owner', 'assessment_manage'),
  ('instructor', 'course_manage'),
  ('instructor', 'course_publish'),
  ('instructor', 'assessment_manage')
on conflict do nothing;
