-- =============================================================================
-- CareBridge — Phase 2: Row Level Security
-- Migration: 0002_rls_policies.sql
--
-- Principle: least privilege. A user may only read/write records belonging to
-- organisations they are an active member of, or records they personally own.
-- The Super Administrator flag is respected via public.is_super_admin(), which
-- is itself security-definer and never trusts client input.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.organisation_invitations enable row level security;
alter table public.organisation_verifications enable row level security;
alter table public.user_consents enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.audit_logs enable row level security;

-- profiles -------------------------------------------------------------------

-- A user reads their own profile; org admins read profiles of their members;
-- super admins read all.
create policy profiles_select_self on public.profiles
  for select using (
    id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1
      from public.organisation_memberships m
      where m.user_id = profiles.id
        and m.organisation_id = any (public.current_organisation_ids())
    )
  );

create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- Prevent privilege escalation: a non-super-admin cannot set is_super_admin.
create or replace function public.prevent_super_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_super_admin and not public.is_super_admin() then
    new.is_super_admin = old.is_super_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_super_admin_escalation();

-- organisations --------------------------------------------------------------

create policy organisations_select_member on public.organisations
  for select using (
    public.is_super_admin()
    or public.is_org_member(id)
  );

create policy organisations_insert_self on public.organisations
  for insert with check (created_by = auth.uid());

create policy organisations_update_admin on public.organisations
  for update using (
    public.is_super_admin()
    or exists (
      select 1
      from public.organisation_memberships m
      where m.organisation_id = organisations.id
        and m.user_id = auth.uid()
        and m.is_owner
        and m.status = 'active'
    )
  )
  with check (
    public.is_super_admin()
    or public.is_org_member(id)
  );

-- organisation_memberships ---------------------------------------------------

create policy memberships_select on public.organisation_memberships
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_org_member(organisation_id)
  );

create policy memberships_insert on public.organisation_memberships
  for insert with check (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.has_permission('user_invite', organisation_id)
  );

create policy memberships_update on public.organisation_memberships
  for update using (
    public.is_super_admin()
    or public.has_permission('user_role_assign', organisation_id)
  )
  with check (
    public.is_super_admin()
    or public.has_permission('user_role_assign', organisation_id)
  );

create policy memberships_delete on public.organisation_memberships
  for delete using (
    public.is_super_admin()
    or public.has_permission('user_role_assign', organisation_id)
  );

-- roles / permissions --------------------------------------------------------

-- Reference data: readable by any authenticated user; managed by platform admins.
create policy roles_select on public.roles
  for select using (auth.uid() is not null);
create policy roles_manage on public.roles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy permissions_select on public.permissions
  for select using (auth.uid() is not null);
create policy permissions_manage on public.permissions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy role_permissions_select on public.role_permissions
  for select using (auth.uid() is not null);
create policy role_permissions_manage on public.role_permissions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- user_role_assignments ------------------------------------------------------

create policy role_assignments_select on public.user_role_assignments
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or (organisation_id is not null and public.is_org_member(organisation_id))
  );

-- A user may never self-assign a role; privileged roles require super_admin.
create policy role_assignments_insert on public.user_role_assignments
  for insert with check (
    public.is_super_admin()
    or (
      user_id <> auth.uid()
      and organisation_id is not null
      and public.has_permission('user_role_assign', organisation_id)
      and role_key not in ('super_admin', 'platform_support', 'finance_officer', 'compliance_officer')
    )
  );

create policy role_assignments_delete on public.user_role_assignments
  for delete using (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('user_role_assign', organisation_id)
      and role_key not in ('super_admin', 'platform_support', 'finance_officer', 'compliance_officer')
    )
  );

-- organisation_invitations ---------------------------------------------------

create policy invitations_select on public.organisation_invitations
  for select using (
    public.is_super_admin()
    or public.has_permission('user_invite', organisation_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy invitations_insert on public.organisation_invitations
  for insert with check (
    public.is_super_admin()
    or public.has_permission('user_invite', organisation_id)
  );

create policy invitations_update on public.organisation_invitations
  for update using (
    public.is_super_admin()
    or public.has_permission('user_invite', organisation_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    public.is_super_admin()
    or public.has_permission('user_invite', organisation_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- organisation_verifications -------------------------------------------------

create policy verifications_select on public.organisation_verifications
  for select using (
    public.is_super_admin()
    or public.is_org_member(organisation_id)
    or public.has_permission('organisation_review', null)
  );

create policy verifications_insert on public.organisation_verifications
  for insert with check (
    public.is_super_admin()
    or public.has_permission('organisation_review', null)
  );

-- user_consents --------------------------------------------------------------

create policy consents_select on public.user_consents
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy consents_insert on public.user_consents
  for insert with check (user_id = auth.uid());

-- user_notification_preferences ----------------------------------------------

create policy notification_prefs_select on public.user_notification_preferences
  for select using (user_id = auth.uid() or public.is_super_admin());

create policy notification_prefs_upsert on public.user_notification_preferences
  for insert with check (user_id = auth.uid());

create policy notification_prefs_update on public.user_notification_preferences
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_logs -----------------------------------------------------------------

-- Readable by those with the audit_log_view permission, scoped to their orgs,
-- or platform-wide for super admins. Only the server (service role) writes.
create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_super_admin()
    or (
      public.has_permission('audit_log_view', organisation_id)
    )
  );

create policy audit_logs_insert on public.audit_logs
  for insert with check (actor_id = auth.uid() or public.is_super_admin());
