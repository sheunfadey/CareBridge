-- Organisation deletion -------------------------------------------------------
-- Deleting an organisation cascades through many child tables. A few of those
-- tables protect their own history against direct parent deletion with
-- ON DELETE RESTRICT, which makes a single organisation delete fail even though
-- every referencing row is being removed in the same cascade.
--
-- Re-register those foreign keys as deferrable NO ACTION constraints. The
-- guarantee is unchanged - a parent still cannot be removed while children
-- exist - but the check runs at the end of the transaction, after the cascade
-- has removed the children.

do $$
declare
  fk record;
  definition text;
begin
  for fk in
    select
      c.oid,
      c.conname,
      c.conrelid::regclass as child
    from pg_constraint c
    where c.contype = 'f'
      and c.confdeltype = 'r'
      and c.confrelid in (
        'public.organisations'::regclass,
        'public.care_facilities'::regclass,
        'public.inventory_items'::regclass,
        'public.service_invoices'::regclass,
        'public.service_payments'::regclass,
        'public.organisation_subscriptions'::regclass,
        'public.charity_campaigns'::regclass,
        'public.scholarship_applications'::regclass,
        'public.scholarship_programmes'::regclass,
        'public.assessment_questions'::regclass,
        'public.programmes'::regclass
      )
  loop
    definition := pg_get_constraintdef(fk.oid);

    execute format('alter table %s drop constraint %I', fk.child, fk.conname);
    execute format(
      'alter table %s add constraint %I %s deferrable initially deferred',
      fk.child,
      fk.conname,
      replace(definition, ' ON DELETE RESTRICT', ' ON DELETE NO ACTION')
    );
  end loop;
end $$;

-- Only the service role may destroy a tenant. The server action verifies the
-- caller is a super administrator before calling this function.
create or replace function public.delete_organisation(p_organisation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Residents intentionally do not cascade from an organisation, because the
  -- care record must never disappear by accident. A platform administrator
  -- deleting the tenant is explicit, so remove them first; their care records,
  -- shifts, incidents and medication history cascade from the resident row.
  delete from public.residents
  where organisation_id = p_organisation_id;

  delete from public.organisations where id = p_organisation_id;

  if not found then
    raise exception 'Organisation not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_organisation(uuid) from public;
revoke all on function public.delete_organisation(uuid) from anon;
revoke all on function public.delete_organisation(uuid) from authenticated;
grant execute on function public.delete_organisation(uuid) to service_role;

comment on function public.delete_organisation(uuid) is
  'Deletes an organisation and all tenant-scoped data. Service role only; callers must verify super-admin access.';
