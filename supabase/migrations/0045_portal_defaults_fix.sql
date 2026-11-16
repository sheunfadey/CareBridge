-- =============================================================================
-- CareBridge - Default trainers and organisation admins into the right portal
-- Migration: 0045_portal_defaults_fix.sql
--
-- Trainers/instructors belong in the trainer studio regardless of the portal
-- they happened to save before. Care-home owners and managers belong in the
-- caregiver/workspace portal, not the student portal.
-- =============================================================================

update public.profiles p
set active_portal = 'trainer'
where exists (
  select 1
  from public.user_role_assignments ura
  where ura.user_id = p.id
    and ura.role_key in ('training_admin', 'instructor')
);

update public.profiles p
set active_portal = 'caregiver'
where p.active_portal = 'student'
  and exists (
    select 1
    from public.user_role_assignments ura
    where ura.user_id = p.id
      and ura.role_key in ('care_home_owner', 'care_home_manager')
  );
