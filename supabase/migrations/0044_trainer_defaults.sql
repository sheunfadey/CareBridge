-- =============================================================================
-- CareBridge - Default trainers into the trainer portal
-- Migration: 0044_trainer_defaults.sql
--
-- Existing training administrators and instructors are moved to the trainer
-- home so course management is visible immediately. They can still switch to
-- the student portal from the account menu.
-- =============================================================================

update public.profiles p
set active_portal = 'trainer'
where p.active_portal = 'student'
  and exists (
    select 1
    from public.user_role_assignments ura
    where ura.user_id = p.id
      and ura.role_key in ('training_admin', 'instructor')
  );
