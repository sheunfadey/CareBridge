-- =============================================================================
-- CareBridge — Phase 2: cross-tenant isolation checks
-- File: supabase/tests/rls_isolation.sql
--
-- Run against a disposable database (e.g. a local Supabase instance or a
-- scratch branch) — NOT production. It creates throwaway auth.users rows and
-- asserts that Row Level Security prevents one tenant from reading or writing
-- another tenant's data.
--
-- Usage:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
-- or
--   supabase db query --linked --file supabase/tests/rls_isolation.sql
--
-- The script raises an exception (and therefore fails) on the first
-- violation, so a clean run means every isolation assertion held.
-- =============================================================================

begin;

-- Deterministic ids so assertions can reference them.
-- user A owns org A; user B is a member of org B only.
do $$
declare
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_user_c uuid := '33333333-3333-4333-8333-333333333333';
  v_org_a  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_org_b  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_count  int;
  v_flag   boolean;
  v_status text;
  v_agreement text;
  v_start date;
begin
  -- Seed two independent tenants directly (bypass RLS as the test owner).
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (v_user_a, 'tenant-a@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
    (v_user_b, 'tenant-b@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
    (v_user_c, 'candidate-c@example.test', crypt('password', gen_salt('bf')), now(), now(), now())
  on conflict (id) do nothing;

  -- The handle_new_user trigger creates the matching profiles rows.
  if not exists (select 1 from public.profiles where id = v_user_a) then
    insert into public.profiles (id, email, full_name) values (v_user_a, 'tenant-a@example.test', 'Tenant A');
  end if;
  if not exists (select 1 from public.profiles where id = v_user_b) then
    insert into public.profiles (id, email, full_name) values (v_user_b, 'tenant-b@example.test', 'Tenant B');
  end if;
  if not exists (select 1 from public.profiles where id = v_user_c) then
    insert into public.profiles (id, email, full_name) values (v_user_c, 'candidate-c@example.test', 'Candidate C');
  end if;

  insert into public.organisations (id, name, slug, type, status, created_by)
  values
    (v_org_a, 'Tenant A Care', 'tenant-a-care', 'care_home', 'active', v_user_a),
    (v_org_b, 'Tenant B Care', 'tenant-b-care', 'care_home', 'active', v_user_b)
  on conflict (id) do nothing;

  insert into public.organisation_memberships (organisation_id, user_id, status, is_owner, joined_at)
  values
    (v_org_a, v_user_a, 'active', true, now()),
    (v_org_b, v_user_b, 'active', true, now())
  on conflict (organisation_id, user_id) do nothing;

  -- Employment fixtures owned by tenant B (created as owner, bypassing RLS).
  insert into public.job_postings (id, organisation_id, title, slug, summary, description, employment_type, status, published_at)
  values
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', v_org_b, 'Tenant B draft role', 'tenant-b-draft-role', 'Draft role used only by the RLS isolation test.', 'Draft description used only by the RLS isolation test.', 'full_time', 'draft', null),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', v_org_b, 'Tenant B published role', 'tenant-b-published-role', 'Published role used only by the RLS isolation test.', 'Published description used only by the RLS isolation test.', 'full_time', 'published', now())
  on conflict (id) do nothing;

  insert into public.internship_listings (id, organisation_id, title, slug, summary, description, slots, status)
  values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', v_org_b, 'Tenant B draft placement', 'tenant-b-draft-placement', 'Draft placement used only by the RLS isolation test.', 'Draft placement description used only by the RLS isolation test.', 1, 'draft')
  on conflict (id) do nothing;

  insert into public.job_applications (id, job_id, applicant_id, status)
  values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', v_user_b, 'submitted')
  on conflict (id) do nothing;

  insert into public.internship_applications (id, listing_id, applicant_id, status)
  values ('99999999-9999-4999-8999-999999999999', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', v_user_c, 'submitted')
  on conflict (id) do nothing;

  -- Phase 5 execution fixtures owned by tenant B.
  insert into public.internship_placements
    (id, organisation_id, listing_id, application_id, candidate_id, supervisor_id,
     status, agreement_status, start_date, end_date, safeguarding_cleared, created_by)
  values
    ('12121212-1212-4212-8212-121212121212', v_org_b, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
     '99999999-9999-4999-8999-999999999999', v_user_c, v_user_b, 'active', 'pending',
     current_date, current_date + 30, true, v_user_b)
  on conflict (id) do nothing;

  insert into public.internship_logs
    (id, placement_id, author_id, week_start, week_end, hours, summary, status)
  values
    ('13131313-1313-4313-8313-131313131313', '12121212-1212-4212-8212-121212121212',
     v_user_b, current_date - 7, current_date - 1, 20,
     'Tenant B weekly log used only by the RLS isolation test.', 'submitted')
  on conflict (id) do nothing;

  insert into public.internship_attendance
    (id, placement_id, attendance_date, status, hours, recorded_by)
  values
    ('14141414-1414-4414-8414-141414141414', '12121212-1212-4212-8212-121212121212',
     current_date, 'present', 8, v_user_b)
  on conflict (id) do nothing;

  insert into public.internship_evaluations
    (id, placement_id, evaluator_id, evaluation_date, overall_rating, recommendation, status)
  values
    ('15151515-1515-4515-8515-151515151515', '12121212-1212-4212-8212-121212121212',
     v_user_b, current_date, 4, 'pass', 'submitted')
  on conflict (id) do nothing;

  insert into public.internship_incidents
    (id, placement_id, reported_by, category, severity, description, status)
  values
    ('16161616-1616-4616-8616-161616161616', '12121212-1212-4212-8212-121212121212',
     v_user_b, 'Test incident', 'low',
     'Tenant B incident used only by the RLS isolation test.', 'open')
  on conflict (id) do nothing;

  insert into public.interviews
    (id, job_application_id, scheduled_by, scheduled_at, duration_minutes, mode, location)
  values
    ('17171717-1717-4717-8717-171717171717', 'ffffffff-ffff-4fff-8fff-ffffffffffff',
     v_user_b, now() + interval '2 days', 30, 'in_person', 'Tenant B office')
  on conflict (id) do nothing;

  insert into public.interviews
    (id, internship_application_id, scheduled_by, scheduled_at, duration_minutes, mode, location)
  values
    ('18181818-1818-4818-8818-181818181818', '99999999-9999-4999-8999-999999999999',
     v_user_b, now() + interval '3 days', 30, 'in_person', 'Tenant B office')
  on conflict (id) do nothing;

  insert into public.job_offers
    (id, application_id, offered_by, employment_type, status)
  values
    ('19191919-1919-4919-8919-191919191919', 'ffffffff-ffff-4fff-8fff-ffffffffffff',
     v_user_b, 'full_time', 'sent')
  on conflict (id) do nothing;

  insert into public.internship_offers
    (id, application_id, offered_by, status)
  values
    ('20202020-2020-4020-8020-202020202020', '99999999-9999-4999-8999-999999999999',
     v_user_b, 'sent')
  on conflict (id) do nothing;

  -- Phase 6 payment and referral fixtures. Partners are approved so the
  -- attribution function can be exercised; A is both a partner and a payer.
  insert into public.referral_partners
    (id, user_id, code, status, display_name, approved_at, approved_by)
  values
    ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', v_user_a, 'PARTNERA', 'approved',
     'Partner A', now(), v_user_a),
    ('b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', v_user_b, 'PARTNERB', 'approved',
     'Partner B', now(), v_user_b)
  on conflict (id) do nothing;

  insert into public.payment_transactions
    (id, payer_id, payer_email, purpose, amount_minor_units, currency, status,
     reconciliation_status)
  values
    ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', v_user_a, 'tenant-a@example.test',
     'course_purchase', 500000, 'NGN', 'successful', 'matched'),
    ('d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', v_user_b, 'tenant-b@example.test',
     'course_purchase', 700000, 'NGN', 'successful', 'matched')
  on conflict (id) do nothing;

  insert into public.referral_attributions
    (id, partner_id, referral_code, customer_user_id, source, expires_at)
  values
    ('a7a7a7a7-a7a7-4a7a-8a7a-a7a7a7a7a7a7',
     'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', 'PARTNERB', v_user_c, 'link',
     now() + interval '30 days'),
    ('b8b8b8b8-b8b8-4b8b-8b8b-b8b8b8b8b8b8',
     'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'PARTNERA', v_user_b, 'link',
     now() + interval '30 days')
  on conflict (id) do nothing;

  insert into public.referral_commissions
    (id, partner_id, basis, gross_amount_minor_units,
     commission_amount_minor_units, currency, status, approved_at, approved_by)
  values
    ('e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5',
     'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'course_purchase', 500000, 50000,
     'NGN', 'approved', now(), v_user_a),
    ('f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f6f6',
     'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', 'course_purchase', 700000, 70000,
     'NGN', 'approved', now(), v_user_b)
  on conflict (id) do nothing;

  -- One published policy (readable by partners) and one draft (finance only).
  insert into public.referral_commission_policies
    (id, name, commission_type, percentage_bps, eligible_purposes, is_active,
     effective_from, created_by)
  values
    ('c9c9c9c9-c9c9-4c9c-8c9c-c9c9c9c9c9c9', 'Published test policy',
     'percentage', 1000, '{course_purchase}', true, current_date, v_user_a),
    ('d0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d0d0', 'Draft test policy',
     'percentage', 500, '{course_purchase}', false, current_date, v_user_a)
  on conflict (id) do nothing;

  -- ===========================================================================
  -- Now act as an anonymous/authenticated user with the auth context of A.
  -- ===========================================================================
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- A sees exactly one organisation (their own).
  select count(*) into v_count from public.organisations;
  if v_count <> 1 then
    raise exception 'FAIL: tenant A expected 1 organisation, saw %', v_count;
  end if;

  -- A cannot see B's organisation by id.
  select count(*) into v_count from public.organisations where id = v_org_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B organisation';
  end if;

  -- A cannot see B's memberships.
  select count(*) into v_count from public.organisation_memberships where organisation_id = v_org_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B memberships';
  end if;

  -- A cannot read B's profile.
  select count(*) into v_count from public.profiles where id = v_user_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B profile';
  end if;

  -- A cannot insert themselves into B's organisation.
  begin
    insert into public.organisation_memberships (organisation_id, user_id, status)
    values (v_org_b, v_user_a, 'active');
    raise exception 'FAIL: tenant A could join tenant B organisation';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- A cannot assign a role inside B's organisation.
  begin
    insert into public.user_role_assignments (user_id, role_key, organisation_id)
    values (v_user_a, 'care_staff', v_org_b);
    raise exception 'FAIL: tenant A could assign a role in tenant B organisation';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- A cannot self-grant a privileged role even in their own org.
  begin
    insert into public.user_role_assignments (user_id, role_key, organisation_id)
    values (v_user_a, 'super_admin', v_org_a);
    raise exception 'FAIL: tenant A could self-assign super_admin';
  exception
    when insufficient_privilege then null; -- expected: WITH CHECK denied
  end;

  -- A cannot escalate their own profile to super admin.
  update public.profiles set is_super_admin = true where id = v_user_a;

  reset role;

  -- Seed a notification for B (as owner, bypassing RLS).
  insert into public.notifications (user_id, title, category)
  values (v_user_b, 'Tenant B notification', 'platform');

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- A cannot see B's notifications.
  select count(*) into v_count from public.notifications where user_id = v_user_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B notifications';
  end if;

  -- A cannot insert a notification for B.
  begin
    insert into public.notifications (user_id, title, category)
    values (v_user_b, 'Injected', 'platform');
    raise exception 'FAIL: tenant A could insert a notification for tenant B';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- ===========================================================================
  -- Phase 5 employment isolation
  -- ===========================================================================

  -- A cannot read B's draft job, but can read B's published job.
  select count(*) into v_count from public.job_postings
  where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B draft job';
  end if;

  select count(*) into v_count from public.job_postings
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  if v_count <> 1 then
    raise exception 'FAIL: tenant A cannot read a published job';
  end if;

  -- A cannot read B's draft placement.
  select count(*) into v_count from public.internship_listings
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B draft placement';
  end if;

  -- A cannot read B's applications.
  select count(*) into v_count from public.job_applications
  where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B job application';
  end if;

  select count(*) into v_count from public.internship_applications
  where id = '99999999-9999-4999-8999-999999999999';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B internship application';
  end if;

  -- A cannot modify B's job posting (RLS filters the row, so zero rows update).
  update public.job_postings
  set status = 'closed'
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A could modify a tenant B job posting';
  end if;

  -- Phase 5 execution records are invisible to the other tenant.
  select count(*) into v_count from public.internship_placements
  where id = '12121212-1212-4212-8212-121212121212';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B placement';
  end if;

  select count(*) into v_count from public.internship_logs
  where id = '13131313-1313-4313-8313-131313131313';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B weekly log';
  end if;

  select count(*) into v_count from public.internship_attendance
  where id = '14141414-1414-4414-8414-141414141414';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B attendance';
  end if;

  select count(*) into v_count from public.internship_evaluations
  where id = '15151515-1515-4515-8515-151515151515';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B evaluation';
  end if;

  select count(*) into v_count from public.internship_incidents
  where id = '16161616-1616-4616-8616-161616161616';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B incident';
  end if;

  select count(*) into v_count from public.interviews
  where id in ('17171717-1717-4717-8717-171717171717',
               '18181818-1818-4818-8818-181818181818');
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B interviews';
  end if;

  select count(*) into v_count from public.job_offers
  where id = '19191919-1919-4919-8919-191919191919';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B job offer';
  end if;

  select count(*) into v_count from public.internship_offers
  where id = '20202020-2020-4020-8020-202020202020';
  if v_count <> 0 then
    raise exception 'FAIL: tenant A can read tenant B internship offer';
  end if;

  -- ===========================================================================
  -- Phase 6 payment and referral isolation
  -- ===========================================================================

  -- A sees their own payment and commission ledger entries only.
  select count(*) into v_count from public.payment_transactions
  where id = 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3';
  if v_count <> 1 then
    raise exception 'FAIL: payer A cannot read their own payment';
  end if;

  select count(*) into v_count from public.payment_transactions
  where id = 'd4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4';
  if v_count <> 0 then
    raise exception 'FAIL: payer A can read tenant B payment';
  end if;

  select count(*) into v_count from public.referral_commissions
  where id = 'e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5';
  if v_count <> 1 then
    raise exception 'FAIL: partner A cannot read their own commission';
  end if;

  select count(*) into v_count from public.referral_commissions
  where id = 'f6f6f6f6-f6f6-4f6f-8f6f-f6f6f6f6f6f6';
  if v_count <> 0 then
    raise exception 'FAIL: partner A can read tenant B commission';
  end if;

  select count(*) into v_count from public.referral_partners
  where id = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2';
  if v_count <> 0 then
    raise exception 'FAIL: partner A can read tenant B partner profile';
  end if;

  -- A can read the currently published policy, but not a draft policy.
  select count(*) into v_count from public.referral_commission_policies
  where id = 'c9c9c9c9-c9c9-4c9c-8c9c-c9c9c9c9c9c9';
  if v_count <> 1 then
    raise exception 'FAIL: partner A cannot read the published policy';
  end if;

  select count(*) into v_count from public.referral_commission_policies
  where id = 'd0d0d0d0-d0d0-4d0d-8d0d-d0d0d0d0d0d0';
  if v_count <> 0 then
    raise exception 'FAIL: partner A can read a draft policy';
  end if;

  -- A cannot read an attribution belonging to someone else's referral.
  select count(*) into v_count from public.referral_attributions
  where id = 'a7a7a7a7-a7a7-4a7a-8a7a-a7a7a7a7a7a7';
  if v_count <> 0 then
    raise exception 'FAIL: partner A can read an unrelated attribution';
  end if;

  -- A cannot fabricate a payment or commission. Financial state is written only
  -- by the server-side service after provider verification.
  begin
    insert into public.payment_transactions
      (payer_id, payer_email, purpose, amount_minor_units)
    values (v_user_b, 'tenant-b@example.test', 'course_purchase', 100000);
    raise exception 'FAIL: tenant A could insert a payment transaction';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  begin
    insert into public.referral_commissions
      (partner_id, basis, gross_amount_minor_units,
       commission_amount_minor_units, status)
    values
      ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'course_purchase', 100000,
       10000, 'approved');
    raise exception 'FAIL: tenant A could insert a commission ledger entry';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- Self-referral is rejected by the attribution function.
  begin
    perform public.attribute_referral('PARTNERA');
    raise exception 'FAIL: self-referral was attributed';
  exception
    when others then
      if sqlerrm not like 'Self-referral%' then
        raise;
      end if;
  end;

  -- A cannot write a log into B's placement.
  begin
    insert into public.internship_logs
      (placement_id, author_id, week_start, week_end, hours, summary)
    values
      ('12121212-1212-4212-8212-121212121212', v_user_a, current_date, current_date, 8,
       'Injected log used only by the RLS isolation test.');
    raise exception 'FAIL: tenant A could write a log into tenant B placement';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- A cannot update B's placement.
  update public.internship_placements
  set status = 'terminated'
  where id = '12121212-1212-4212-8212-121212121212';
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A could modify a tenant B placement';
  end if;

  -- A cannot create a job for B without job_manage in B's organisation.
  begin
    insert into public.job_postings
      (organisation_id, title, slug, summary, description, employment_type)
    values
      (v_org_b, 'Injected role', 'tenant-b-injected-role', 'Injected summary used only by the RLS isolation test.', 'Injected description used only by the RLS isolation test.', 'full_time');
    raise exception 'FAIL: tenant A could create a job for tenant B';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- A cannot create a placement for B without internship_manage in B's org.
  begin
    insert into public.internship_listings
      (organisation_id, title, slug, summary, description, slots)
    values
      (v_org_b, 'Injected placement', 'tenant-b-injected-placement', 'Injected summary used only by the RLS isolation test.', 'Injected description used only by the RLS isolation test.', 1);
    raise exception 'FAIL: tenant A could create a placement for tenant B';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- A may apply to B's published job (marketplace behaviour) and read it back.
  insert into public.job_applications (job_id, applicant_id, status)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', v_user_a, 'submitted')
  on conflict (job_id, applicant_id) do nothing;

  select count(*) into v_count from public.job_applications
  where job_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    and applicant_id = v_user_a;
  if v_count <> 1 then
    raise exception 'FAIL: tenant A could not apply to a published job';
  end if;

  -- A cannot apply to B's draft job.
  begin
    insert into public.job_applications (job_id, applicant_id, status)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', v_user_a, 'submitted');
    raise exception 'FAIL: tenant A could apply to a draft job';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  -- Candidate C can answer the agreement but cannot otherwise change the
  -- placement (the guard resets protected columns).
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_c, 'role', 'authenticated')::text, true);

  update public.internship_placements
  set status = 'completed',
      agreement_status = 'accepted',
      start_date = current_date + 365
  where id = '12121212-1212-4212-8212-121212121212';

  select status::text, agreement_status::text, start_date
    into v_status, v_agreement, v_start
    from public.internship_placements
    where id = '12121212-1212-4212-8212-121212121212';

  if v_status <> 'active' then
    raise exception 'FAIL: candidate changed placement status to %', v_status;
  end if;
  if v_agreement <> 'accepted' then
    raise exception 'FAIL: candidate could not accept the placement agreement';
  end if;
  if v_start <> current_date then
    raise exception 'FAIL: candidate changed protected placement dates';
  end if;

  reset role;

  -- Confirm the escalation trigger reverted it (as owner, bypassing RLS).
  select is_super_admin into v_flag from public.profiles where id = v_user_a;
  if v_flag then
    raise exception 'FAIL: tenant A escalated is_super_admin';
  end if;

  raise notice 'PASS: cross-tenant isolation checks held';
end $$;

rollback;

-- Final, non-transactional confirmation the harness can assert on.
select 'RLS_ISOLATION_PASS' as result;

