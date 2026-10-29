-- =============================================================================
-- CareBridge - Phase 5 placement agreement guard fix
-- Migration: 0013_placement_guard_fix.sql
--
-- The candidate guard reset every protected column except `status`. A candidate
-- accepting the agreement could therefore also set an arbitrary placement
-- status (for example `completed`). Reset the status alongside the other
-- protected columns and only allow the explicit decline transition.
-- =============================================================================

create or replace function public.guard_placement_candidate_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.can_manage_internships(old.organisation_id)
     and old.candidate_id = auth.uid() then
    -- Candidates may only answer the agreement.
    new.organisation_id = old.organisation_id;
    new.listing_id = old.listing_id;
    new.application_id = old.application_id;
    new.candidate_id = old.candidate_id;
    new.supervisor_id = old.supervisor_id;
    new.status = old.status;
    new.location = old.location;
    new.state = old.state;
    new.city = old.city;
    new.start_date = old.start_date;
    new.end_date = old.end_date;
    new.expected_hours = old.expected_hours;
    new.learning_objectives = old.learning_objectives;
    new.supervision_arrangements = old.supervision_arrangements;
    new.safeguarding_cleared = old.safeguarding_cleared;
    new.insurance_cleared = old.insurance_cleared;
    new.started_at = old.started_at;
    new.completed_at = old.completed_at;
    new.completion_summary = old.completion_summary;
    new.created_by = old.created_by;
    new.created_at = old.created_at;

    if new.agreement_status is distinct from old.agreement_status then
      if old.agreement_status <> 'pending'
         or new.agreement_status not in ('accepted', 'declined') then
        new.agreement_status = old.agreement_status;
      elsif new.agreement_status = 'declined' then
        new.status = 'terminated';
      end if;
    end if;
  end if;
  return new;
end;
$$;
