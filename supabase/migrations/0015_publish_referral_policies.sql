-- Published referral policy ---------------------------------------------------
--
-- Partners need to read the currently published commission policy so the
-- dashboard can show the terms, attribution window and payout minimum without
-- using the service role. The existing policy only allowed finance staff to
-- select rows, which left partners unable to see the published terms.
--
-- This policy is intentionally narrow: only active policies whose effective
-- dates cover today are readable by signed-in users. Draft, future and expired
-- policies remain visible to finance only.

create policy referral_policies_select_published
  on public.referral_commission_policies
  for select
  to authenticated
  using (
    is_active
    and effective_from <= current_date
    and (effective_to is null or effective_to >= current_date)
  );
