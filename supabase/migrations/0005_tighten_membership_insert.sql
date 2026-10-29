-- =============================================================================
-- CareBridge — Phase 2: tighten membership insert policy
-- Migration: 0005_tighten_membership_insert.sql
--
-- The original memberships_insert policy allowed any authenticated user to
-- insert a membership row for themselves in ANY organisation
-- (`user_id = auth.uid()`), which is a cross-tenant hole: a user could add
-- themselves to an organisation they were never invited to.
--
-- Invitation acceptance is handled by public.accept_invitation(), which is
-- SECURITY DEFINER and validates the invitation token/email before writing.
-- Direct inserts therefore only need to be permitted for super admins and
-- users holding user_invite within that organisation.
-- =============================================================================

drop policy if exists memberships_insert on public.organisation_memberships;

create policy memberships_insert on public.organisation_memberships
  for insert with check (
    public.is_super_admin()
    or public.has_permission('user_invite', organisation_id)
  );
