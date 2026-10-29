-- =============================================================================
-- CareBridge — Phase 2: invitation acceptance
-- Migration: 0004_invitation_acceptance.sql
--
-- Role self-assignment is denied by RLS (a user may never grant themselves a
-- role). Invitation acceptance must therefore run in a security-definer
-- function that validates the invitation and performs both writes atomically.
-- =============================================================================

create or replace function public.accept_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.organisation_invitations%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select lower(email) into v_email from public.profiles where id = auth.uid();

  select *
  into v_invitation
  from public.organisation_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Invitation is no longer valid' using errcode = 'P0001';
  end if;

  if v_invitation.expires_at < now() then
    update public.organisation_invitations
      set status = 'expired'
      where id = v_invitation.id;
    raise exception 'Invitation has expired' using errcode = 'P0001';
  end if;

  if v_email is distinct from lower(v_invitation.email) then
    raise exception 'Invitation was issued for a different email'
      using errcode = '42501';
  end if;

  insert into public.organisation_memberships
    (organisation_id, user_id, status, is_owner, joined_at)
  values
    (v_invitation.organisation_id, auth.uid(), 'active', false, now())
  on conflict (organisation_id, user_id) do update
    set status = 'active',
        joined_at = coalesce(public.organisation_memberships.joined_at, now()),
        updated_at = now();

  insert into public.user_role_assignments
    (user_id, role_key, organisation_id, granted_by)
  values
    (auth.uid(), v_invitation.role_key, v_invitation.organisation_id, v_invitation.invited_by)
  on conflict do nothing;

  update public.organisation_invitations
    set status = 'accepted',
        accepted_at = now(),
        accepted_by = auth.uid()
    where id = v_invitation.id;

  insert into public.audit_logs
    (actor_id, organisation_id, action, entity_type, entity_id, metadata)
  values
    (auth.uid(), v_invitation.organisation_id, 'membership.accepted',
     'organisation_invitation', v_invitation.id::text,
     jsonb_build_object('role', v_invitation.role_key));

  return v_invitation.organisation_id;
end;
$$;

revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;
