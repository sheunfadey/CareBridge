-- =============================================================================
-- CareBridge - Phase 8 follow-up: scholarship review transitions
-- Migration: 0023_scholarship_review_transitions.sql
--
-- Reviewers may move an application straight from submitted to shortlisted or
-- approved without first recording an intermediate under-review step. The
-- applicant guard remains unchanged: applicants may only withdraw.
-- =============================================================================

create or replace function public.guard_scholarship_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_reviewer boolean := public.has_permission(
    'scholarship_review', old.organisation_id
  );
begin
  -- Trusted server-side operations (awarding, data repair) run without a user
  -- session and may set the approved status directly.
  if auth.uid() is null then
    return new;
  end if;

  if old.applicant_id = auth.uid() and not is_reviewer then
    if old.status not in ('submitted', 'under_review') then
      raise exception 'This application can no longer be changed';
    end if;

    if new.status is distinct from old.status and new.status <> 'withdrawn' then
      raise exception 'Applicants may only withdraw their application';
    end if;

    new.applicant_id := old.applicant_id;
    new.programme_id := old.programme_id;
    new.reviewer_id := old.reviewer_id;
    new.reviewed_at := old.reviewed_at;
    new.decision_notes := old.decision_notes;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'submitted' and new.status in ('under_review', 'shortlisted', 'approved', 'rejected', 'withdrawn'))
      or (old.status = 'under_review' and new.status in ('shortlisted', 'approved', 'rejected', 'withdrawn'))
      or (old.status = 'shortlisted' and new.status in ('approved', 'rejected', 'withdrawn'))
    ) then
      raise exception 'Illegal scholarship application transition: % -> %', old.status, new.status;
    end if;

    if new.status in ('under_review', 'shortlisted', 'approved', 'rejected') then
      new.reviewer_id := coalesce(auth.uid(), new.reviewer_id);
      new.reviewed_at := now();
    end if;
  end if;

  return new;
end;
$$;
