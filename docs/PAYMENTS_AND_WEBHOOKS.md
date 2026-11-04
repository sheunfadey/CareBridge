# Payments and webhooks

Online payments are implemented behind a provider abstraction. Paystack is the
only adapter. Provider credentials are not configured in this deployment, so live
checkout, refunds and transfers have not been exercised.

## Architecture

- `src/lib/payments/types.ts` — provider interface.
- `src/lib/payments/provider.ts` — selects and configures the provider.
- `src/lib/payments/providers/paystack.ts` — HTTP adapter.
- `src/server/payments/service.ts` — checkout, verification and webhook
  processing.
- `src/server/charity/donations.ts` — donation checkout using the same provider.
- Database RPCs apply verified outcomes:
  - `apply_payment_success`
  - `apply_payment_failure`
  - `apply_payment_refund`

The browser is never trusted to mark a payment successful.

## Checkout (courses)

1. Server loads the published paid course and its price.
2. Creates a `payment_transactions` row (`initiated`) with a unique reference and
   the server-side amount/currency.
3. Calls the provider and stores the provider reference and hosted checkout URL.
4. Returns the hosted URL to the browser.

A recent pending checkout is reused to avoid duplicate transactions.

## Checkout (donations)

1. Server validates the campaign, public/approved state, dates, currency and
   amount bounds (minimum ₦100, maximum ₦500,000 online).
2. Creates a donation payment transaction with product type
   `charity_campaign`.
3. Provider checkout is started.
4. A `donations` row is created only by the
   `sync_donation_from_payment` trigger when the payment is verified.
5. Refunds and partial refunds update the donation through the same trigger.

## Verification

- Callback/return routes call `verifyPaymentByReference`, which asks the provider
  directly and compares amount, currency and state.
- The service-role-only RPC applies the result idempotently.
- A mismatch is stored as `reconciliation_status = 'mismatch'` for finance
  review; it does not grant access.

## Webhooks

Endpoint: `POST /api/payments/webhook/paystack`

- Reads the raw body.
- Verifies the HMAC SHA-512 signature against `PAYSTACK_WEBHOOK_SECRET`.
- Rejects missing/invalid signatures with 401.
- Stores each event by unique provider event id and processes idempotently.
- Duplicate processed events return 200 without side effects.
- Failures return 500 so Paystack retries.

Handled events:

- `charge.success` — re-verifies the transaction, then applies success.
- `transfer.success` / `transfer.failed` — update payout status through guarded
  RPCs.
- `transfer.reversed` — ignored for automatic state; requires manual
  reconciliation.
- `refund.processed` — applies the refund through the guarded RPC.

## Refunds

- Refunds are recorded as new rows and sent to the provider.
- The transaction's refunded amount and commission reversal are new ledger
  entries.
- A paid commission that is refunded receives a linked reversal entry, never an
  edit.
- Over-refunds are rejected in the database.

## Subscriptions

Subscription billing is deliberately separate:

- `subscription_payments` is an append-only ledger for plan billing.
- No training purchase, donation or referral payout shares that ledger.
- Payments are recorded manually by platform billing staff until a subscription
  checkout flow is implemented.
- Suspended/expired subscriptions make the workspace read-only; records remain
  readable and exportable.

## Environment

```env
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
PAYSTACK_MODE=sandbox
PAYSTACK_TRANSFERS_ENABLED=false
```

- Keep `PAYSTACK_MODE=sandbox` until live approval.
- Keep transfers disabled until the business approves the payout arrangement.

## Setup checklist (when credentials are available)

1. Add sandbox keys to the environment.
2. Register the webhook URL in the Paystack dashboard with the same secret.
3. Run a sandbox checkout, verify server-side, and confirm the payment and
   enrolment/donation in the database.
4. Send a signed webhook and confirm idempotency by replaying it.
5. Process a sandbox refund and confirm the ledger/reversal.
6. Reconcile the payment against the provider dashboard.
7. Only then consider live mode and, separately, transfers.

## What must not be done

- Do not trust `?reference=` or any browser-supplied status.
- Do not credit a payment twice.
- Do not create duplicate commissions from repeated events.
- Do not simulate live transactions or claim they occurred.
- Do not enable transfers without explicit approval and configuration.
