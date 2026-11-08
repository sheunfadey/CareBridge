# Phase 8 — Charity, donations and scholarships

Source: `HillCrest_Plan.txt` §17 and the data-model list.

## Tenancy

- A charity workspace is an existing `organisations` row of type `charity`.
- Campaigns, donations, allocations, expenses, programmes, applications, awards
  and impact reports carry `organisation_id`.
- Donors and scholarship applicants are auth users, not organisation members.
  Their access is scoped by `donor_id` / `applicant_id` in RLS.

## Tables

### Campaigns
- `charity_campaigns` — slug, title, purpose, description, beneficiary criteria,
  funding target, currency, dates, status, public flag, sponsorship options,
  supporting document references, approval metadata.
- `campaign_reviews` — append-only review decisions with notes and reviewer.

Status workflow: `draft → pending_approval → approved | rejected`, then
`approved → completed → archived`. Approval requires
`charity_campaign_approve`; the manager cannot self-approve.

### Donations
- `donations` — campaign, donor, payment transaction, amount, refunded amount,
  currency, status, public acknowledgement, display name, message, receipt
  reference.
- Donations are **created only** by `sync_donation_from_payment`, triggered by a
  verified `payment_transactions` row with purpose `donation` and product type
  `charity_campaign`.
- Financial fields are immutable to donors; they may change only their
  acknowledgement preference, display name and message.

### Fund allocation and expenses
- `campaign_allocations` — allocation or release, category, amount, notes.
  Append-only.
- `campaign_expenses` — category, description, amount, payee, receipt, status.
  Append-only.

`charity_campaign_finance` reports received (net of refunds), committed and
disbursed amounts separately from commercial revenue.

### Scholarships
- `scholarship_programmes` — name, eligibility, coverage (full/partial), maximum
  award, optional course, application window, public flag.
- `scholarship_applications` — applicant statement, evidence references, status,
  reviewer, decision notes. Applicants may edit only before a decision and may
  only withdraw; reviewers control decisions.
- `scholarship_awards` — application, amount, coverage, course, status, outcome
  fields and shareable flag. Accepting an award with a course creates a
  `course_enrolments` row with `source = 'scholarship'`.

Application workflow: `submitted → under_review → shortlisted → approved |
rejected`, with `withdrawn` available to the applicant.

Award workflow: `awarded → accepted → active → completed`, with `withdrawn` or
`revoked` where appropriate.

### Impact
- `impact_reports` — campaign, title, summary, metrics JSON, published flag.
  Published reports appear on the public campaign page.

## Public views

- `charity_public_campaign_progress` — aggregate funding progress for approved
  public campaigns. No donor identities.
- `charity_public_donors` — only donations explicitly marked public; display name
  and amount only.
- `charity_campaign_finance` — organisation-scoped, `security_invoker`.
- `charity_scholarship_outcomes` — organisation-scoped, `security_invoker`.

## Permissions

New: `scholarship_manage`, `scholarship_review`.
Existing: `charity_campaign_manage`, `charity_campaign_approve`,
`donor_report_view`.

- `charity_admin` — campaign management, donor reporting, scholarship management
  and review. No campaign approval (separation of duties).
- `compliance_officer` — campaign approval and scholarship review.
- `super_admin` — all permissions.

## Invariants

1. Campaigns cannot be approved by their manager or through an illegal status
   transition.
2. Donations are never created from a browser redirect; only a verified payment
   transaction creates one.
3. Donation financial fields are immutable; refunds update status/amounts through
   the payment trigger.
4. Allocations and expenses are append-only.
5. Public views never expose donor contact details or non-public donations.
6. Scholarship applicants cannot approve themselves or change an award amount.
7. Accepting an award creates a scholarship enrolment at most once.
8. Outcomes are only reported as shareable when explicitly marked.

## Remaining polish

Recurring/offline donations, PDF receipts, a campaign-expense approval workflow,
file uploads for evidence/documents, decision notifications and reviewer workload
assignment. See `docs/KNOWN_LIMITATIONS.md`.
