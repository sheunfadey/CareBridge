-- =============================================================================
-- CareBridge - Allow organisation creators to read their new organisation
-- Migration: 0037_organisation_creator_select.sql
--
-- INSERT ... RETURNING evaluates the SELECT policy before the owner membership
-- row exists. The direct created_by check lets the creator receive the new id
-- without weakening tenant isolation.
-- =============================================================================

drop policy if exists organisations_select_member on public.organisations;

create policy organisations_select_member on public.organisations
  for select using (
    public.is_super_admin()
    or created_by = auth.uid()
    or public.is_org_member(id)
  );
