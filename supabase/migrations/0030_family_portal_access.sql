-- =============================================================================
-- CareBridge - Phase 7 completion: family portal access levels
-- Migration: 0030_family_portal_access.sql
--
-- A `summary` relationship may see a safe resident summary but not the full
-- resident row or dependent care tables. A `full` relationship keeps the
-- existing RLS access. The family portal reads summaries through a
-- security-definer function scoped to the caller.
-- =============================================================================

create or replace function public.can_access_resident(
  p_resident uuid,
  p_permission text default 'resident_view'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.residents r
    where r.id = p_resident
      and (
        public.is_super_admin()
        or public.has_permission(p_permission, r.organisation_id)
        or (
          p_permission = 'resident_view'
          and exists (
            select 1
            from public.resident_relationships rr
            where rr.resident_id = r.id
              and rr.user_id = auth.uid()
              and rr.revoked_at is null
              and rr.access_level = 'full'
          )
        )
      )
  );
$$;

create or replace function public.family_resident_summaries()
returns table (
  resident_id uuid,
  relationship text,
  access_level public.resident_access_level,
  first_name text,
  last_name text,
  preferred_name text,
  room_number text,
  status public.resident_status,
  admission_date date,
  care_level text,
  facility_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    rr.relationship,
    rr.access_level,
    r.first_name,
    r.last_name,
    r.preferred_name,
    r.room_number,
    r.status,
    r.admission_date,
    r.care_level,
    f.name
  from public.resident_relationships rr
  join public.residents r on r.id = rr.resident_id
  join public.care_facilities f on f.id = r.facility_id
  where rr.user_id = auth.uid()
    and rr.revoked_at is null
  order by r.last_name, r.first_name;
$$;

revoke all on function public.family_resident_summaries() from public, anon;
grant execute on function public.family_resident_summaries() to authenticated;
