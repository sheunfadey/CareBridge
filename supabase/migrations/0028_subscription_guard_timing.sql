-- =============================================================================
-- CareBridge - Phase 9 follow-up: run subscription guards after scope triggers
-- Migration: 0029_subscription_guard_timing.sql
--
-- Several tables derive organisation_id in a BEFORE trigger. The subscription
-- writable/module guards must therefore run AFTER those triggers, otherwise they
-- see a null organisation_id and allow the write. This migration rewrites the
-- existing guard triggers from BEFORE to AFTER without changing their logic.
-- =============================================================================

do $$
declare
  r record;
  v_def text;
begin
  for r in
    select tgname, tgrelid::regclass::text as tbl
    from pg_trigger
    where not tgisinternal
      and (tgname like '%\_guard\_writable' or tgname like '%\_guard\_module')
  loop
    select pg_get_triggerdef(t.oid)
      into v_def
    from pg_trigger t
    where t.tgname = r.tgname
      and t.tgrelid = r.tbl::regclass;

    if v_def is null then
      continue;
    end if;

    execute format('drop trigger %I on %s', r.tgname, r.tbl);
    v_def := replace(v_def, ' BEFORE ', ' AFTER ');
    execute v_def;
  end loop;
end $$;
