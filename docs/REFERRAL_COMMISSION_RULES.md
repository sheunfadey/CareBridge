# Referral commission rules

Referral rates are configuration, never hard-coded. No commission exists without
an active policy that covers the payment purpose.

## Partner lifecycle

1. A signed-in user applies through `/dashboard/referrals`.
2. Finance reviews the application with `referral_rules_manage`.
3. Approved partners receive a generated code and referral link.
4. Partners can be suspended or rejected with a recorded reason.

Partners see their own record, attribution activity, commission ledger, payout
history and the currently published policy.

## Attribution

- `/r/[code]` records the referral code and redirects to the intended page.
- `attribute_referral` rejects self-referral and duplicate attribution.
- One customer can be attributed to one partner only.
- Attribution expires after the policy's `attribution_window_days`.

## Policies

Finance publishes policies with:

- percentage (`percentage_bps`) or fixed amount;
- eligible payment purposes;
- attribution window;
- payout delay;
- minimum payout;
- refund policy text;
- effective dates and active flag.

Only published active policies are readable by partners; drafts and expired
policies remain finance-only.

## Commission calculation

On a verified payment:

- the payment must be attributed to an approved partner;
- attribution must be active and unexpired;
- a policy must cover the payment purpose and be effective on the payment date;
- percentage: `floor(amount * bps / 10000)`;
- fixed: `min(fixed_amount, payment_amount)`;
- zero or negative results create no commission.

The ledger records the gross amount, commission, currency, basis, policy,
attribution and payment. A payment can create at most one earning commission.

## Ledger statuses

`pending → eligible → approved → processing → paid`, with guarded transitions to
`rejected`, `reversed` or `failed` where documented. `on_hold` is used while a
payout is under review.

- Financial fields are immutable.
- Every status change is recorded in `referral_commission_events`.
- Refunding a payment reverses unpaid commissions or creates a linked reversal
  entry for paid commissions.

## Payouts

1. Partner adds beneficiary details (bank, account name/number).
2. Finance verifies the beneficiary before it can be used.
3. Partner requests a payout subject to the minimum and available approved
   balance.
4. Requested commissions move to `on_hold`; a payout request is created.
5. Finance approves or rejects. Approval does not move money.
6. `attemptPayoutTransfer` sends the provider transfer only when:
   - the partner is approved;
   - the beneficiary is verified;
   - `PAYSTACK_TRANSFERS_ENABLED=true`;
   - the request is approved.
7. The transfer reference is reused on retries; an ambiguous result is verified
   before retrying. A paid transfer is confirmed by provider verification or a
   signed webhook.

Provider transfers are disabled by default. Business approval is required before
enabling them.

## Refunds and reversals

- Refunded payments do not earn commission.
- A refund before payout reverses the commission.
- A refund after payout creates a linked reversal entry rather than editing the
  paid commission.
- A payout linked to a refunded payment is cancelled automatically if not yet
  sent.

## Reporting

Finance can review partner performance, commission liabilities and payout
status in `/dashboard/admin/referrals`, and export referral/finance reports from
`/dashboard/reports` where permitted. Referral and payout payments are separate
from training purchases, donations and subscription billing.
