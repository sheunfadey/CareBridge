-- =============================================================================
-- CareBridge - Portal preference
-- Migration: 0042_portal_mode.sql
--
-- Learners and working caregivers share one account but get different homes.
-- The preference is stored on the profile so it follows the user across devices.
-- Authorisation is unchanged: the portal changes presentation, not permissions.
-- =============================================================================

create type portal_mode as enum ('student', 'caregiver');

alter table public.profiles
  add column active_portal portal_mode not null default 'student';
