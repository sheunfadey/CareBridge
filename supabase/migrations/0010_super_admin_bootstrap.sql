-- =============================================================================
-- CareBridge - Super admin bootstrap
-- Migration: 0010_super_admin_bootstrap.sql
--
-- The profiles escalation guard blocks any update that sets is_super_admin
-- unless the acting session is already a super admin. That also blocks trusted
-- server-side bootstrapping (SQL editor / service_role / migrations), where
-- auth.uid() is null, so a fresh environment could never promote its first
-- super admin without manually disabling the trigger.
--
-- Trusted server-side connections already bypass RLS, so exempting requests
-- without an authenticated user does not widen access for end users. An
-- authenticated, non-super-admin session is still blocked.
-- =============================================================================

create or replace function public.prevent_super_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin
     and not public.is_super_admin()
     and auth.uid() is not null then
    new.is_super_admin = old.is_super_admin;
  end if;
  return new;
end;
$$;

comment on function public.prevent_super_admin_escalation() is
  'Blocks authenticated non-super-admins from promoting profiles; trusted server-side sessions (auth.uid() is null) may bootstrap the first super admin.';
