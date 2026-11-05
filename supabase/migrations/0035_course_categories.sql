-- =============================================================================
-- CareBridge - Course categories
-- Migration: 0035_course_categories.sql
--
-- Categories are shared platform taxonomy or organisation-owned. Courses keep
-- the legacy `category` label for compatibility and gain a validated
-- `category_id` reference.
-- =============================================================================

create table public.course_categories (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 2 and 80),
  slug text not null
    check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index course_categories_scope_slug_idx
  on public.course_categories (organisation_id, slug) nulls not distinct;
create index course_categories_scope_idx
  on public.course_categories (organisation_id, is_active, sort_order);

create trigger course_categories_set_updated_at
  before update on public.course_categories
  for each row execute function public.set_updated_at();

-- Platform taxonomy -----------------------------------------------------------

insert into public.course_categories
  (organisation_id, name, slug, description, sort_order)
values
  (null, 'Care foundations', 'care-foundations',
   'Core person-centred care, dignity, consent and everyday practice.', 10),
  (null, 'Safeguarding', 'safeguarding',
   'Recognising, recording and escalating safeguarding concerns.', 20),
  (null, 'Clinical care', 'clinical-care',
   'Medication safety, observations and condition-specific care.', 30),
  (null, 'Leadership and management', 'leadership-and-management',
   'Team leadership, supervision, quality and care-home management.', 40),
  (null, 'Employment readiness', 'employment-readiness',
   'Applications, interviews, workplace conduct and career development.', 50),
  (null, 'Digital and record keeping', 'digital-and-record-keeping',
   'Accurate records, digital tools and information handling.', 60)
on conflict (organisation_id, slug) do nothing;

alter table public.courses
  add column category_id uuid
  references public.course_categories (id) on delete set null;

create index courses_category_idx
  on public.courses (category_id, status);

-- Backfill categories already used as free text.
insert into public.course_categories
  (organisation_id, name, slug, sort_order)
select distinct
  c.organisation_id,
  btrim(c.category),
  trim(both '-' from lower(regexp_replace(btrim(c.category), '[^a-zA-Z0-9]+', '-', 'g'))),
  100
from public.courses c
where btrim(coalesce(c.category, '')) <> ''
on conflict (organisation_id, slug) do nothing;

update public.courses c
set category_id = cc.id
from public.course_categories cc
where cc.organisation_id is not distinct from c.organisation_id
  and cc.slug = trim(both '-' from lower(regexp_replace(btrim(c.category), '[^a-zA-Z0-9]+', '-', 'g')))
  and btrim(coalesce(c.category, '')) <> '';

-- Category scope --------------------------------------------------------------

create or replace function public.validate_course_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_organisation uuid;
begin
  if new.category_id is null then
    return new;
  end if;

  select organisation_id into v_category_organisation
  from public.course_categories
  where id = new.category_id;

  if not found then
    raise exception 'Course category not found' using errcode = 'P0002';
  end if;

  if v_category_organisation is not null
     and v_category_organisation is distinct from new.organisation_id then
    raise exception 'Course category belongs to another organisation'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger courses_validate_category
  before insert or update of category_id, organisation_id on public.courses
  for each row execute function public.validate_course_category();

-- Row Level Security ----------------------------------------------------------

alter table public.course_categories enable row level security;

create policy course_categories_select on public.course_categories
  for select using (
    is_active
    or public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
    or (
      organisation_id is null
      and public.has_permission('course_manage', null)
    )
  );

create policy course_categories_write on public.course_categories
  for all using (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
    or (
      organisation_id is null
      and public.has_permission('course_manage', null)
    )
  )
  with check (
    public.is_super_admin()
    or (
      organisation_id is not null
      and public.has_permission('course_manage', organisation_id)
    )
    or (
      organisation_id is null
      and public.has_permission('course_manage', null)
    )
  );
