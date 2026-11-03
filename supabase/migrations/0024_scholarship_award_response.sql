-- =============================================================================
-- CareBridge - Phase 8 follow-up: scholarship award acceptance
-- Migration: 0024_scholarship_award_response.sql
--
-- Applicants must be able to accept or decline an award. They may only change
-- the status from awarded to accepted/withdrawn; every financial and allocation
-- field remains under charity staff control.
-- =============================================================================

create or replace function public.guard_scholarship_award_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and old.applicant_id = auth.uid()
     and not public.has_permission('scholarship_manage', old.organisation_id) then
    if new.amount_minor_units is distinct from old.amount_minor_units
       or new.currency is distinct from old.currency
       or new.coverage is distinct from old.coverage
       or new.course_id is distinct from old.course_id
       or new.application_id is distinct from old.application_id
       or new.programme_id is distinct from old.programme_id
       or new.applicant_id is distinct from old.applicant_id
       or new.awarded_by is distinct from old.awarded_by
       or new.awarded_at is distinct from old.awarded_at then
      raise exception 'Scholarship award financial fields are immutable';
    end if;

    if old.status <> 'awarded'
       or new.status not in ('accepted', 'withdrawn') then
      raise exception 'Applicants may only accept or decline an awarded scholarship';
    end if;
  end if;
  return new;
end;
$$;

create trigger scholarship_awards_guard_fields
  before update on public.scholarship_awards
  for each row execute function public.guard_scholarship_award_fields();

create policy scholarship_awards_respond_own on public.scholarship_awards
  for update using (applicant_id = auth.uid())
  with check (applicant_id = auth.uid());
