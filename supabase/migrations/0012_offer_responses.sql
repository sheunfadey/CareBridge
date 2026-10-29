-- =============================================================================
-- CareBridge - Phase 5 offer responses and placement activation
-- Migration: 0012_offer_responses.sql
--
-- Applicants respond to offers; the database keeps the related application and
-- internship placement consistent. Candidates may accept or decline the
-- placement agreement without being able to change the rest of the record.
-- =============================================================================

-- Offers ---------------------------------------------------------------------

create or replace function public.apply_job_offer_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('accepted', 'declined') and old.status = 'sent' then
    update public.job_applications
    set
      status = case
        when new.status = 'accepted' then 'hired'::application_status
        else 'rejected'::application_status
      end,
      decided_at = now(),
      decided_by = null
    where id = new.application_id;
  end if;
  return new;
end;
$$;

create trigger job_offers_apply_response
  after update of status on public.job_offers
  for each row execute function public.apply_job_offer_response();

create or replace function public.apply_internship_offer_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  application record;
  listing record;
begin
  if new.status not in ('accepted', 'declined') or old.status <> 'sent' then
    return new;
  end if;

  select a.id, a.applicant_id, a.listing_id
    into application
    from public.internship_applications a
    where a.id = new.application_id;

  if not found then
    return new;
  end if;

  update public.internship_applications
  set
    status = case
      when new.status = 'accepted' then 'accepted'::internship_application_status
      else 'rejected'::internship_application_status
    end,
    decided_at = now(),
    decided_by = null
  where id = application.id;

  if new.status = 'accepted' then
    select l.organisation_id, l.start_date, l.end_date, l.expected_hours, l.location
      into listing
      from public.internship_listings l
      where l.id = application.listing_id;

    insert into public.internship_placements (
      organisation_id,
      listing_id,
      application_id,
      candidate_id,
      status,
      agreement_status,
      location,
      start_date,
      end_date,
      expected_hours,
      learning_objectives,
      created_by
    )
    values (
      listing.organisation_id,
      application.listing_id,
      application.id,
      application.applicant_id,
      'pending_agreement',
      'pending',
      coalesce(new.location, listing.location),
      coalesce(new.start_date, listing.start_date, current_date),
      coalesce(new.end_date, listing.end_date, coalesce(new.start_date, listing.start_date, current_date) + 90),
      coalesce(new.expected_hours, listing.expected_hours),
      '{}',
      new.offered_by
    )
    on conflict (application_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger internship_offers_apply_response
  after update of status on public.internship_offers
  for each row execute function public.apply_internship_offer_response();

-- Placement agreement --------------------------------------------------------

create policy internship_placements_update_candidate on public.internship_placements
  for update using (candidate_id = auth.uid())
  with check (candidate_id = auth.uid());

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

create trigger internship_placements_guard_candidate_update
  before update on public.internship_placements
  for each row execute function public.guard_placement_candidate_update();
