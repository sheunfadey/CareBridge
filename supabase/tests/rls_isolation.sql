-- =============================================================================
-- CareBridge â€” Phase 2: cross-tenant isolation checks
-- File: supabase/tests/rls_isolation.sql
--
-- Run against a disposable database (e.g. a local Supabase instance or a
-- scratch branch) â€” NOT production. It creates throwaway auth.users rows and
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

-- =============================================================================
-- Phase 7: care operations isolation
-- =============================================================================
do $$
declare
  v_owner_a uuid := '11111111-1111-1111-1111-111111111111';
  v_owner_b uuid := '22222222-2222-2222-2222-222222222222';
  v_family  uuid := 'f7f00000-0000-4000-8000-000000000001';
  v_staff   uuid := 'f7f00000-0000-4000-8000-000000000002';
  v_med     uuid := 'f7f00000-0000-4000-8000-000000000003';
  v_org_a   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_org_b   uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_fac_a   uuid := 'f7a00000-0000-4000-8000-000000000001';
  v_fac_b   uuid := 'f7a00000-0000-4000-8000-000000000002';
  v_res_a1  uuid := 'f7b00000-0000-4000-8000-000000000001';
  v_res_a2  uuid := 'f7b00000-0000-4000-8000-000000000002';
  v_res_b1  uuid := 'f7b00000-0000-4000-8000-000000000003';
  v_count   int;
  v_rows    int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values
    (v_family, 'family-a@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
    (v_staff, 'staff-a@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
    (v_med, 'med-a@example.test', crypt('password', gen_salt('bf')), now(), now(), now())
  on conflict (id) do nothing;

  insert into public.organisation_memberships (organisation_id, user_id, status, is_owner, joined_at)
  values
    (v_org_a, v_family, 'active', false, now()),
    (v_org_a, v_staff, 'active', false, now()),
    (v_org_a, v_med, 'active', false, now())
  on conflict (organisation_id, user_id) do nothing;

  insert into public.user_role_assignments (user_id, role_key, organisation_id)
  values
    (v_owner_a, 'care_home_owner', v_org_a),
    (v_owner_b, 'care_home_owner', v_org_b),
    (v_family, 'family_member', v_org_a),
    (v_staff, 'care_staff', v_org_a),
    (v_med, 'care_medication_staff', v_org_a)
  on conflict do nothing;

  insert into public.care_facilities (id, organisation_id, name, capacity, created_by)
  values
    (v_fac_a, v_org_a, 'Tenant A House', 10, v_owner_a),
    (v_fac_b, v_org_b, 'Tenant B House', 10, v_owner_b)
  on conflict (id) do nothing;

  insert into public.residents
    (id, facility_id, reference, first_name, last_name, created_by)
  values
    (v_res_a1, v_fac_a, 'A-R1', 'Resident', 'A-One', v_owner_a),
    (v_res_a2, v_fac_a, 'A-R2', 'Resident', 'A-Two', v_owner_a),
    (v_res_b1, v_fac_b, 'B-R1', 'Resident', 'B-One', v_owner_b)
  on conflict (id) do nothing;

  insert into public.resident_relationships
    (resident_id, user_id, relationship, access_level)
  values (v_res_a1, v_family, 'Daughter', 'full')
  on conflict (resident_id, user_id) do nothing;

  insert into public.incidents
    (id, facility_id, resident_id, category, severity, occurred_at, reported_by, description)
  values
    ('f7c00000-0000-4000-8000-000000000001', v_fac_b, v_res_b1, 'fall', 'high',
     now(), v_owner_b, 'Tenant B incident used only by the RLS isolation test.')
  on conflict do nothing;

  insert into public.service_invoices
    (id, facility_id, resident_id, payer_name, due_date)
  values
    ('f7d00000-0000-4000-8000-000000000001', v_fac_b, v_res_b1,
     'Tenant B Payer', current_date + 30)
  on conflict (id) do nothing;

  insert into public.medication_records
    (id, resident_id, medication_name, dose_text, scheduled_at, recorded_by)
  values
    ('f7e00000-0000-4000-8000-000000000001', v_res_a1, 'Example medicine',
     'as prescribed', now(), v_med)
  on conflict (id) do nothing;

  -- Linked family member: only the resident they are linked to.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_family, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.residents;
  if v_count <> 1 then
    raise exception 'FAIL: family expected 1 linked resident, saw %', v_count;
  end if;

  select count(*) into v_count from public.incidents;
  if v_count <> 0 then
    raise exception 'FAIL: family could read incidents';
  end if;

  update public.residents set first_name = 'Injected' where id = v_res_a1;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'FAIL: family could edit a resident record';
  end if;

  reset role;

  -- Care staff: organisation-wide residents, but no medication, billing or B data.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_staff, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.residents;
  if v_count <> 2 then
    raise exception 'FAIL: care staff expected 2 residents, saw %', v_count;
  end if;

  select count(*) into v_count from public.residents where id = v_res_b1;
  if v_count <> 0 then
    raise exception 'FAIL: care staff could read a tenant B resident';
  end if;

  select count(*) into v_count from public.medication_records;
  if v_count <> 0 then
    raise exception 'FAIL: care staff could read medication records';
  end if;

  select count(*) into v_count from public.service_invoices;
  if v_count <> 0 then
    raise exception 'FAIL: care staff could read invoices';
  end if;

  begin
    insert into public.residents (facility_id, reference, first_name, last_name)
    values (v_fac_b, 'B-INJECTED', 'Injected', 'Resident');
    raise exception 'FAIL: care staff could create a resident in tenant B';
  exception
    when insufficient_privilege then null; -- expected: RLS denied
  end;

  reset role;

  -- Medication-authorised staff can read their organisation's records only.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_med, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.medication_records;
  if v_count <> 1 then
    raise exception 'FAIL: medication staff expected 1 medication record, saw %', v_count;
  end if;

  reset role;

  -- Tenant owner A cannot read tenant B care data.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.residents where organisation_id = v_org_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A owner could read tenant B residents';
  end if;

  select count(*) into v_count from public.care_facilities where organisation_id = v_org_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A owner could read tenant B facilities';
  end if;

  reset role;

  raise notice 'PASS: care operations isolation checks held';
end $$;

-- =============================================================================
-- Phase 8: charity, donation and scholarship isolation
-- =============================================================================
do $$
declare
  v_owner_a uuid := '11111111-1111-1111-1111-111111111111';
  v_owner_b uuid := '22222222-2222-2222-2222-222222222222';
  v_donor   uuid := '33333333-3333-4333-8333-333333333333';
  v_reviewer uuid := '44444444-4444-4444-8444-444444444444';
  v_charity_a uuid := 'c8a00000-0000-4000-8000-000000000001';
  v_charity_b uuid := 'c8a00000-0000-4000-8000-000000000002';
  v_public_campaign uuid := 'c8b00000-0000-4000-8000-000000000001';
  v_draft_campaign  uuid := 'c8b00000-0000-4000-8000-000000000002';
  v_programme uuid := 'c8c00000-0000-4000-8000-000000000001';
  v_application uuid := 'c8d00000-0000-4000-8000-000000000001';
  v_allocation uuid := 'c8e00000-0000-4000-8000-000000000001';
  v_expense uuid := 'c8e00000-0000-4000-8000-000000000002';
  v_donation_c uuid;
  v_award uuid;
  v_count int;
  v_rows int;
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  values (v_reviewer, 'reviewer@example.test', crypt('password', gen_salt('bf')), now(), now(), now())
  on conflict (id) do nothing;

  insert into public.organisations (id, name, slug, type, status, created_by)
  values
    (v_charity_a, 'Tenant A Charity', 'tenant-a-charity', 'charity', 'active', v_owner_a),
    (v_charity_b, 'Tenant B Charity', 'tenant-b-charity', 'charity', 'active', v_owner_b)
  on conflict (id) do nothing;

  insert into public.organisation_memberships (organisation_id, user_id, status, is_owner, joined_at)
  values
    (v_charity_a, v_owner_a, 'active', true, now()),
    (v_charity_b, v_owner_b, 'active', true, now()),
    (v_charity_a, v_reviewer, 'active', false, now())
  on conflict (organisation_id, user_id) do nothing;

  insert into public.user_role_assignments (user_id, role_key, organisation_id)
  values
    (v_owner_a, 'charity_admin', v_charity_a),
    (v_owner_b, 'charity_admin', v_charity_b),
    (v_reviewer, 'compliance_officer', v_charity_a)
  on conflict do nothing;

  insert into public.charity_campaigns
    (id, organisation_id, slug, title, purpose, funding_target_minor_units,
     currency, starts_on, status, is_public, created_by)
  values
    (v_public_campaign, v_charity_a, 'approved-charity-campaign', 'Approved campaign',
     'Support training access for caregivers.', 1000000, 'NGN', current_date,
     'approved', true, v_owner_a),
    (v_draft_campaign, v_charity_a, 'draft-charity-campaign', 'Draft campaign',
     'A draft campaign used only by the RLS isolation test.', 500000, 'NGN',
     current_date, 'draft', false, v_owner_a)
  on conflict (id) do nothing;

  insert into public.scholarship_programmes
    (id, organisation_id, slug, name, description, eligibility, coverage,
     max_award_minor_units, currency, opens_on, status, is_public, created_by)
  values
    (v_programme, v_charity_a, 'open-scholarship-programme', 'Open programme',
     'Used only by the RLS isolation test.', 'Applicants must demonstrate financial need for training.',
     'partial', 500000, 'NGN', current_date, 'open', true, v_owner_a)
  on conflict (id) do nothing;

  insert into public.scholarship_applications
    (id, organisation_id, programme_id, applicant_id, statement, status)
  values
    (v_application, v_charity_a, v_programme, v_donor,
     'I need financial support to complete my caregiver training and start work.',
     'submitted')
  on conflict (id) do nothing;

  -- Verified donations create donation rows through the payment trigger.
  insert into public.payment_transactions
    (id, reference, organisation_id, payer_id, payer_email, purpose, product_type,
     product_id, amount_minor_units, currency, status, metadata)
  values
    ('c8f00000-0000-4000-8000-000000000001', 'rls_phase8_donation_c', v_charity_a,
     v_donor, 'tenant-c@example.test', 'donation', 'charity_campaign', v_public_campaign,
     100000, 'NGN', 'initiated', '{"public_acknowledgement": false}'::jsonb),
    ('c8f00000-0000-4000-8000-000000000002', 'rls_phase8_donation_b', v_charity_a,
     v_owner_b, 'tenant-b@example.test', 'donation', 'charity_campaign', v_public_campaign,
     250000, 'NGN', 'initiated',
     '{"public_acknowledgement": true, "donor_display_name": "Tenant B Donor"}'::jsonb)
  on conflict (id) do nothing;

  update public.payment_transactions
  set status = 'successful', paid_at = now()
  where reference in ('rls_phase8_donation_c', 'rls_phase8_donation_b');

  select id into v_donation_c
  from public.donations
  where donor_id = v_donor
    and campaign_id = v_public_campaign
  limit 1;

  -- Donor C: public approved campaign only, own donation only.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_donor, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.charity_campaigns where organisation_id = v_charity_a;
  if v_count <> 1 then
    raise exception 'FAIL: donor expected 1 public campaign, saw %', v_count;
  end if;

  select count(*) into v_count from public.charity_campaigns where id = v_draft_campaign;
  if v_count <> 0 then
    raise exception 'FAIL: donor could read a draft campaign';
  end if;

  select count(*) into v_count from public.donations where campaign_id = v_public_campaign;
  if v_count <> 1 then
    raise exception 'FAIL: donor expected 1 own donation, saw %', v_count;
  end if;

  select count(*) into v_count from public.charity_public_campaign_progress where campaign_id = v_public_campaign;
  if v_count <> 1 then
    raise exception 'FAIL: public campaign progress view leaked or hid campaigns';
  end if;

  select count(*) into v_count from public.charity_public_donors
  where campaign_id = v_public_campaign and display_name = 'Tenant B Donor';
  if v_count <> 1 then
    raise exception 'FAIL: public donor acknowledgement missing';
  end if;

  select count(*) into v_count from public.charity_public_donors
  where campaign_id = v_public_campaign and display_name = 'Supporter';
  if v_count <> 0 then
    raise exception 'FAIL: private donation was exposed in the public donor list';
  end if;

  begin
    insert into public.charity_campaigns
      (organisation_id, slug, title, purpose, funding_target_minor_units, starts_on)
    values
      (v_charity_a, 'donor-injected-campaign', 'Injected', 'Should not be allowed.', 10000, current_date);
    raise exception 'FAIL: donor could create a campaign';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.donations set amount_minor_units = 1 where id = v_donation_c;
    raise exception 'FAIL: donor could change a donation amount';
  exception
    when others then
      if sqlerrm not like '%immutable%' then raise; end if;
  end;

  update public.donations set is_public = true where id = v_donation_c;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'FAIL: donor could not change their acknowledgement preference';
  end if;

  reset role;

  -- Charity administrator A: sees organisation data, cannot approve unaided.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.donations where organisation_id = v_charity_a;
  if v_count <> 2 then
    raise exception 'FAIL: charity admin expected 2 donations, saw %', v_count;
  end if;

  select count(*) into v_count from public.scholarship_applications where organisation_id = v_charity_a;
  if v_count <> 1 then
    raise exception 'FAIL: charity admin could not read the application';
  end if;

  update public.scholarship_applications
  set status = 'shortlisted', decision_notes = 'Shortlisted by charity admin'
  where id = v_application;

  update public.scholarship_applications
  set status = 'approved'
  where id = v_application;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'FAIL: reviewer could not approve an application';
  end if;

  insert into public.scholarship_awards
    (organisation_id, application_id, programme_id, applicant_id, amount_minor_units,
     coverage, course_id, status, awarded_by)
  values
    (v_charity_a, v_application, v_programme, v_donor, 300000,
     'partial', 'a2000000-0000-4000-8000-000000000001', 'awarded', v_owner_a)
  returning id into v_award;

  insert into public.campaign_allocations
    (id, organisation_id, campaign_id, category, amount_minor_units, allocated_by)
  values
    (v_allocation, v_charity_a, v_public_campaign, 'Scholarships', 200000, v_owner_a);

  update public.campaign_allocations
  set amount_minor_units = 1
  where id = v_allocation;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'FAIL: allocation history could be edited';
  end if;

  insert into public.campaign_expenses
    (id, organisation_id, campaign_id, category, amount_minor_units, status, recorded_by)
  values
    (v_expense, v_charity_a, v_public_campaign, 'Training fees', 100000, 'approved', v_owner_a);

  delete from public.campaign_expenses where id = v_expense;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'FAIL: campaign expense history could be deleted';
  end if;

  -- A manager cannot approve their own campaign.
  update public.charity_campaigns
  set status = 'pending_approval',
      is_public = true
  where id = v_draft_campaign;

  begin
    update public.charity_campaigns
    set status = 'approved'
    where id = v_draft_campaign;
    raise exception 'FAIL: campaign manager self-approved a campaign';
  exception
    when others then
      if sqlerrm not like '%Not authorised to approve%' then raise; end if;
  end;

  select count(*) into v_count from public.charity_campaigns where organisation_id = v_charity_b;
  if v_count <> 0 then
    raise exception 'FAIL: charity A admin could read charity B campaigns';
  end if;

  reset role;

  -- Independent reviewer approves.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_reviewer, 'role', 'authenticated')::text, true);
  set local role authenticated;

  update public.charity_campaigns
  set status = 'approved'
  where id = v_draft_campaign;

  reset role;

  -- Applicant sees the award and approved campaign.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_donor, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.scholarship_awards where organisation_id = v_charity_a;
  if v_count <> 1 then
    raise exception 'FAIL: applicant could not read their award';
  end if;

  begin
    update public.scholarship_awards set amount_minor_units = 1 where id = v_award;
    raise exception 'FAIL: applicant could change an award amount';
  exception
    when others then
      if sqlerrm not like '%immutable%' then raise; end if;
  end;

  update public.scholarship_awards set status = 'accepted' where id = v_award;

  select count(*) into v_count
  from public.course_enrolments
  where user_id = v_donor and source = 'scholarship';
  if v_count <> 1 then
    raise exception 'FAIL: accepting an award did not create a scholarship enrolment';
  end if;

  select count(*) into v_count from public.charity_campaigns where organisation_id = v_charity_a;
  if v_count <> 2 then
    raise exception 'FAIL: donor expected 2 approved campaigns, saw %', v_count;
  end if;

  reset role;

  -- The append-only guards also protect against a trusted service connection
  -- attempting to rewrite financial history.
  perform set_config('request.jwt.claims', '', true);

  begin
    update public.campaign_allocations set amount_minor_units = 1 where id = v_allocation;
    raise exception 'FAIL: allocation history could be edited by a trusted connection';
  exception
    when others then
      if sqlerrm not like '%append-only%' then raise; end if;
  end;

  begin
    delete from public.campaign_expenses where id = v_expense;
    raise exception 'FAIL: campaign expense history could be deleted by a trusted connection';
  exception
    when others then
      if sqlerrm not like '%append-only%' then raise; end if;
  end;

  raise notice 'PASS: charity isolation checks held';
end $$;

-- =============================================================================
-- Phase 9: subscription isolation, read-only and module limits
-- =============================================================================
do $$
declare
  v_owner_a uuid := '11111111-1111-1111-1111-111111111111';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_org_b uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_facility_a uuid := 'f7a00000-0000-4000-8000-000000000001';
  v_plan_professional uuid;
  v_plan_starter uuid;
  v_count int;
  v_flag boolean;
begin
  select id into v_plan_professional from public.subscription_plans where code = 'professional';
  select id into v_plan_starter from public.subscription_plans where code = 'starter';

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.organisation_subscriptions where organisation_id = v_org_a;
  if v_count <> 1 then
    raise exception 'FAIL: owner expected 1 own subscription, saw %', v_count;
  end if;

  select count(*) into v_count
  from public.organisation_subscriptions
  where organisation_id = v_org_b;
  if v_count <> 0 then
    raise exception 'FAIL: owner could read another organisation subscription';
  end if;

  update public.organisation_subscriptions
  set plan_id = v_plan_professional,
      billing_cycle = 'annual'
  where organisation_id = v_org_a;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception 'FAIL: owner could not change their plan';
  end if;

  begin
    update public.organisation_subscriptions
    set status = 'suspended'
    where organisation_id = v_org_a;
    raise exception 'FAIL: owner could suspend their own subscription';
  exception
    when others then
      if sqlerrm not like '%Only platform billing%' then raise; end if;
  end;

  begin
    update public.organisation_subscriptions
    set current_period_end = now() + interval '10 years'
    where organisation_id = v_org_a;
    raise exception 'FAIL: owner could extend their subscription period';
  exception
    when others then
      if sqlerrm not like '%Only platform billing%' then raise; end if;
  end;

  reset role;

  -- Suspend as a trusted connection, then verify the workspace is read-only.
  perform set_config('request.jwt.claims', '', true);
  update public.organisation_subscriptions
  set status = 'suspended',
      suspended_at = now()
  where organisation_id = v_org_a;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    insert into public.residents (facility_id, reference, first_name, last_name)
    values (v_facility_a, 'P9-READONLY', 'Test', 'Resident');
    raise exception 'FAIL: suspended workspace accepted a new resident';
  exception
    when others then
      if sqlerrm not like '%read-only%' then raise; end if;
  end;

  select public.organisation_can_write(v_org_a) into v_flag;

  reset role;

  perform set_config('request.jwt.claims', '', true);
  update public.organisation_subscriptions
  set status = 'active',
      suspended_at = null,
      trial_ends_at = null,
      current_period_end = now() + interval '1 year',
      plan_id = v_plan_starter
  where organisation_id = v_org_a;

  if v_flag then
    raise exception 'FAIL: organisation_can_write returned true while suspended';
  end if;

  -- Starter excludes care: writes to care records must be rejected by the module guard.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_owner_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    insert into public.residents (facility_id, reference, first_name, last_name)
    values (v_facility_a, 'P9-MODULE', 'Test', 'Resident');
    raise exception 'FAIL: starter plan accepted a care record';
  exception
    when others then
      if sqlerrm not like '%does not include the care module%' then raise; end if;
  end;

  reset role;

  perform set_config('request.jwt.claims', '', true);
  update public.organisation_subscriptions
  set plan_id = v_plan_professional,
      status = 'active',
      current_period_end = now() + interval '1 year'
  where organisation_id = v_org_a;

  raise notice 'PASS: subscription isolation checks held';
end $$;

-- =============================================================================
-- Phase 7 completion: family summary access must not expose full records
-- =============================================================================
do $$
declare
  v_family uuid := 'f7f00000-0000-4000-8000-000000000001';
  v_summary_user uuid := '33333333-3333-4333-8333-333333333333';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_res_a1 uuid := 'f7b00000-0000-4000-8000-000000000001';
  v_res_a2 uuid := 'f7b00000-0000-4000-8000-000000000002';
  v_count int;
begin
  insert into public.resident_contacts
    (organisation_id, resident_id, name, relationship, is_emergency)
  values (v_org_a, v_res_a1, 'Full Access Contact', 'Daughter', true)
  on conflict do nothing;

  insert into public.resident_relationships
    (resident_id, user_id, relationship, access_level)
  values (v_res_a2, v_summary_user, 'Nephew', 'summary')
  on conflict (resident_id, user_id) do nothing;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_summary_user, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.residents;
  if v_count <> 0 then
    raise exception 'FAIL: summary family account could read full resident rows';
  end if;

  select count(*) into v_count from public.family_resident_summaries();
  if v_count <> 1 then
    raise exception 'FAIL: summary family account expected 1 portal summary, saw %', v_count;
  end if;

  select count(*) into v_count
  from public.resident_contacts
  where resident_id = v_res_a2;
  if v_count <> 0 then
    raise exception 'FAIL: summary family account could read resident contacts';
  end if;

  reset role;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_family, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count from public.residents;
  if v_count <> 1 then
    raise exception 'FAIL: full family account expected 1 resident row, saw %', v_count;
  end if;

  select count(*) into v_count from public.family_resident_summaries();
  if v_count <> 1 then
    raise exception 'FAIL: full family account expected 1 portal summary, saw %', v_count;
  end if;

  select count(*) into v_count
  from public.resident_contacts
  where resident_id = v_res_a1;
  if v_count <> 1 then
    raise exception 'FAIL: full family account could not read linked resident contacts';
  end if;

  reset role;
  raise notice 'PASS: family portal access checks held';
end $$;

-- =============================================================================
-- Academy assessment engine: answer keys and attempts stay private
-- =============================================================================
do $$
declare
  v_owner_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_learner uuid := '33333333-3333-4333-8333-333333333333';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_programme uuid := 'a3100000-0000-4000-8000-000000000001';
  v_course uuid := 'a3100000-0000-4000-8000-000000000002';
  v_enrolment uuid := 'a3100000-0000-4000-8000-000000000003';
  v_assessment uuid := 'a3100000-0000-4000-8000-000000000004';
  v_question uuid := 'a3100000-0000-4000-8000-000000000005';
  v_attempt uuid;
  v_result jsonb;
  v_count int;
begin
  insert into public.programmes (id, organisation_id, title, slug, status, created_by)
  values (v_programme, v_org_a, 'Assessment test programme', 'assessment-test-programme', 'active', v_owner_a)
  on conflict (id) do nothing;

  insert into public.courses (
    id, programme_id, organisation_id, title, slug, summary, status,
    is_public, certificate_enabled, version, created_by
  )
  values (
    v_course, v_programme, v_org_a, 'Assessment test course',
    'assessment-test-course', 'Draft course used by the RLS assessment test.',
    'draft', true, true, 1, v_owner_a
  )
  on conflict (id) do nothing;

  insert into public.assessments (
    id, course_id, title, kind, pass_mark_percent, max_attempts,
    is_required, status, published_at, created_by
  )
  values (
    v_assessment, v_course, 'Assessment answer-key test', 'quiz', 70, 3,
    true, 'published', now(), v_owner_a
  )
  on conflict (id) do nothing;

  insert into public.assessment_questions (
    id, assessment_id, prompt, question_type, options, correct_answer,
    points, explanation, position
  )
  values (
    v_question, v_assessment, 'Which option is correct?', 'single_choice',
    '[{"id":"a","label":"Correct option"},{"id":"b","label":"Wrong option"}]'::jsonb,
    '["a"]'::jsonb, 5, 'Option A is correct.', 1
  )
  on conflict (id) do nothing;

  insert into public.course_enrolments (
    id, course_id, user_id, organisation_id, status, source
  )
  values (v_enrolment, v_course, v_learner, v_org_a, 'active', 'self')
  on conflict (id) do nothing;

  -- An enrolled learner can read the assessment metadata, but never the answer
  -- key. Use a non-manager learner so course-management permissions do not
  -- accidentally make the answer key readable.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_learner, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count
  from public.assessments
  where id = v_assessment;
  if v_count <> 1 then
    raise exception 'FAIL: enrolled learner could not read the assessment';
  end if;

  select count(*) into v_count
  from public.assessment_questions
  where assessment_id = v_assessment;
  if v_count <> 0 then
    raise exception 'FAIL: learner could read assessment answer keys';
  end if;

  v_result := public.start_assessment_attempt(v_assessment);
  v_attempt := (v_result->>'attemptId')::uuid;

  if v_attempt is null then
    raise exception 'FAIL: learner could not start an assessment attempt';
  end if;

  if v_result::text like '%correctOption%'
     or v_result::text like '%correct_answer%'
     or v_result::text like '%Option A is correct%' then
    raise exception 'FAIL: assessment start response leaked the answer key';
  end if;

  v_result := public.submit_assessment_attempt(
    v_attempt,
    jsonb_build_object(v_question::text, jsonb_build_array('a'))
  );

  if (v_result->>'passed')::boolean is not true then
    raise exception 'FAIL: correct assessment answers did not pass';
  end if;

  if (v_result->>'courseCompleted')::boolean is not true then
    raise exception 'FAIL: passing a required assessment did not complete the course';
  end if;

  select count(*) into v_count
  from public.assessment_attempts
  where id = v_attempt
    and status = 'submitted'
    and passed;
  if v_count <> 1 then
    raise exception 'FAIL: submitted assessment attempt was not recorded';
  end if;

  select count(*) into v_count
  from public.assessment_attempt_answers
  where attempt_id = v_attempt
    and is_correct;
  if v_count <> 1 then
    raise exception 'FAIL: graded assessment answer was not recorded';
  end if;

  select count(*) into v_count
  from public.certificates
  where user_id = v_learner
    and course_id = v_course;
  if v_count <> 1 then
    raise exception 'FAIL: passing the required assessment did not issue a certificate';
  end if;

  reset role;

  -- Submitted attempts are immutable even for trusted connections.
  perform set_config('request.jwt.claims', '', true);
  begin
    update public.assessment_attempts
    set passed = false
    where id = v_attempt;
    raise exception 'FAIL: submitted assessment attempt could be changed';
  exception
    when others then
      if sqlerrm not like '%immutable%' then raise; end if;
  end;

  -- Learner B is not enrolled and must not see the draft course assessment.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count
  from public.assessments
  where id = v_assessment;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated learner could read a draft course assessment';
  end if;

  select count(*) into v_count
  from public.assessment_attempts
  where assessment_id = v_assessment;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated learner could read assessment attempts';
  end if;

  begin
    perform public.start_assessment_attempt(v_assessment);
    raise exception 'FAIL: unrelated learner could start an assessment';
  exception
    when others then
      if sqlerrm not like '%Enrol in this course%' then raise; end if;
  end;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  raise notice 'PASS: academy assessment checks held';
end $$;

-- =============================================================================
-- Direct messaging: participants only, same-tenant recipients
-- =============================================================================
do $$
declare
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_user_c uuid := '33333333-3333-4333-8333-333333333333';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_conversation uuid;
  v_first_message uuid;
  v_count int;
  v_read_at timestamptz;
begin
  insert into public.organisation_memberships
    (organisation_id, user_id, status, is_owner)
  values (v_org_a, v_user_b, 'active', false)
  on conflict (organisation_id, user_id) do nothing;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  v_conversation := public.start_conversation(
    v_org_a,
    array[v_user_b],
    'Messaging isolation check',
    'Hello from tenant A'
  );

  if v_conversation is null then
    raise exception 'FAIL: participant could not start a conversation';
  end if;

  select count(*) into v_count
  from public.conversations
  where id = v_conversation;
  if v_count <> 1 then
    raise exception 'FAIL: creator could not read their conversation';
  end if;

  select count(*) into v_count
  from public.conversation_participants
  where conversation_id = v_conversation;
  if v_count <> 2 then
    raise exception 'FAIL: expected two conversation participants, saw %', v_count;
  end if;

  select id into v_first_message
  from public.messages
  where conversation_id = v_conversation
  limit 1;

  if v_first_message is null then
    raise exception 'FAIL: starting a conversation did not create the first message';
  end if;

  reset role;

  -- A user outside the organisation cannot read the conversation or start one.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_c, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count
  from public.conversations
  where id = v_conversation;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated user could read another tenant conversation';
  end if;

  select count(*) into v_count
  from public.messages
  where conversation_id = v_conversation;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated user could read another tenant messages';
  end if;

  begin
    perform public.send_message(v_conversation, 'Unauthorised reply');
    raise exception 'FAIL: unrelated user could send a message';
  exception
    when others then
      if sqlerrm not like '%not found%' then raise; end if;
  end;

  begin
    perform public.start_conversation(
      v_org_a,
      array[v_user_b],
      'Unauthorised conversation',
      'This should not be allowed'
    );
    raise exception 'FAIL: non-member could start a conversation';
  exception
    when others then
      if sqlerrm not like '%not a member%' then raise; end if;
  end;

  reset role;

  -- A participant cannot add somebody outside the organisation.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    perform public.start_conversation(
      v_org_a,
      array[v_user_c],
      'Cross-tenant conversation',
      'This should not be allowed'
    );
    raise exception 'FAIL: participant could add a user outside the organisation';
  exception
    when others then
      if sqlerrm not like '%active member%' then raise; end if;
  end;

  reset role;

  select count(*) into v_count
  from public.notifications
  where user_id = v_user_b
    and category = 'message'
    and metadata->>'conversationId' = v_conversation::text;

  if v_count <> 1 then
    raise exception 'FAIL: new-message notification was not created';
  end if;

  -- The recipient can read and reply.
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.send_message(v_conversation, 'Reply from tenant A member');

  select count(*) into v_count
  from public.messages
  where conversation_id = v_conversation;
  if v_count <> 2 then
    raise exception 'FAIL: participant reply was not recorded';
  end if;

  select count(*) into v_count
  from public.conversations
  where id = v_conversation
    and last_message_preview = 'Reply from tenant A member';
  if v_count <> 1 then
    raise exception 'FAIL: conversation preview was not updated';
  end if;

  reset role;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count
  from public.notifications
  where user_id = v_user_a
    and category = 'message'
    and metadata->>'conversationId' = v_conversation::text;
  if v_count <> 1 then
    raise exception 'FAIL: reply notification was not created';
  end if;

  perform public.mark_conversation_read(v_conversation);
  reset role;

  select last_read_at into v_read_at
  from public.conversation_participants
  where conversation_id = v_conversation
    and user_id = v_user_a;
  if v_read_at is null then
    raise exception 'FAIL: read receipt was not recorded';
  end if;

  -- Messages are append-only even for trusted connections.
  perform set_config('request.jwt.claims', '', true);
  begin
    update public.messages
    set body = 'Changed history'
    where id = v_first_message;
    raise exception 'FAIL: message history could be changed';
  exception
    when others then
      if sqlerrm not like '%append-only%' then raise; end if;
  end;

  raise notice 'PASS: direct messaging checks held';
end $$;

-- =============================================================================
-- Academy course management for organisation owners and instructors
-- =============================================================================
do $$
declare
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_b uuid := '22222222-2222-2222-2222-222222222222';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_programme uuid := 'a1000000-0000-4000-8000-000000000001';
  v_course uuid;
begin
  insert into public.user_role_assignments (user_id, role_key, organisation_id)
  values (v_user_b, 'instructor', v_org_a)
  on conflict do nothing;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  if not public.has_permission('course_manage', v_org_a)
     or not public.has_permission('course_publish', v_org_a) then
    raise exception 'FAIL: organisation owner lacks course management permissions';
  end if;

  insert into public.courses
    (programme_id, organisation_id, title, slug, status, certificate_enabled, version, created_by)
  values
    (v_programme, v_org_a, 'Owner course permission test', 'owner-course-permission-test', 'draft', true, 1, v_user_a)
  returning id into v_course;

  if v_course is null then
    raise exception 'FAIL: organisation owner could not create a course';
  end if;

  reset role;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_b, 'role', 'authenticated')::text, true);
  set local role authenticated;

  if not public.has_permission('course_manage', v_org_a)
     or not public.has_permission('course_publish', v_org_a) then
    raise exception 'FAIL: instructor lacks course management permissions';
  end if;

  insert into public.courses
    (programme_id, organisation_id, title, slug, status, certificate_enabled, version, created_by)
  values
    (v_programme, v_org_a, 'Trainer course permission test', 'trainer-course-permission-test', 'draft', true, 1, v_user_b)
  returning id into v_course;

  if v_course is null then
    raise exception 'FAIL: instructor could not create a course';
  end if;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  raise notice 'PASS: academy course management checks held';
end $$;

-- =============================================================================
-- Course categories and typed learning resources
-- =============================================================================
do $$
declare
  v_user_a uuid := '11111111-1111-1111-1111-111111111111';
  v_user_c uuid := '33333333-3333-4333-8333-333333333333';
  v_org_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_category uuid;
  v_course uuid;
  v_resource uuid;
  v_count int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.course_categories
    (organisation_id, name, slug, is_active, created_by)
  values
    (v_org_a, 'Private category test', 'private-category-test', false, v_user_a)
  returning id into v_category;

  if v_category is null then
    raise exception 'FAIL: course manager could not create a category';
  end if;

  select id into v_course
  from public.courses
  where slug = 'owner-course-permission-test';

  insert into public.learning_resources
    (course_id, title, kind, external_url, is_private, created_by)
  values
    (v_course, 'Assessment PDF handout', 'pdf',
     'https://example.com/handout.pdf', true, v_user_a)
  returning id into v_resource;

  if v_resource is null then
    raise exception 'FAIL: course manager could not add a learning resource';
  end if;

  reset role;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_user_c, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_count
  from public.course_categories
  where id = v_category;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated user could read an inactive organisation category';
  end if;

  select count(*) into v_count
  from public.learning_resources
  where id = v_resource;
  if v_count <> 0 then
    raise exception 'FAIL: unrelated user could read a private draft-course resource';
  end if;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  raise notice 'PASS: course category and resource checks held';
end $$;

rollback;

-- Final, non-transactional confirmation the harness can assert on.
select 'RLS_ISOLATION_PASS' as result;



