# Internship and employment workflows

## Placement providers

- An organisation of type `training_provider`, `care_home`, `home_care_agency` or
  similar creates a placement-provider profile.
- Verification status is controlled separately by platform review.
- Providers create internship listings with description, location, dates, hours,
  slots, requirements, learning objectives and deadline.

## Internship applications

1. A signed-in candidate browses open listings.
2. Applying creates an application owned by the candidate.
3. Providers can review applications for their own listings only.
4. Statuses: submitted, under review, shortlisted, offered, accepted, rejected,
   withdrawn.
5. A candidate can withdraw; provider staff change review status.

## Placements

- An accepted application becomes a placement with supervisor, dates, location,
  learning objectives, supervision arrangements and safeguarding/insurance
  checks.
- Placement statuses cover pending agreement, active, completed and terminated.
- The candidate accepts the placement agreement; protected placement fields
  cannot be changed by the candidate.

## Weekly logs and attendance

- Candidates submit weekly logs with week start/end, hours and summary.
- Supervisors review logs and record attendance (present, absent, late, etc.).
- Attendance and logs are scoped to the placement and organisation.

## Evaluations and completion

- Supervisors submit evaluations with ratings and recommendations.
- Completion records capture the outcome and completion summary.
- Certificates are issued through the academy flow where applicable; a placement
  completion is not itself a professional qualification.

## Incidents

- Internship incidents record category, severity, description and status.
- They are visible to the candidate, placement staff and authorised compliance
  users; they are not public.
- Safeguarding concerns follow the organisation's escalation procedure.

## Employment (jobs)

- Employers create job postings as drafts, publish, close or archive them.
- Published jobs are publicly browsable; signed-in users can apply.
- Applications capture a cover letter and status.
- Employers review applicants, schedule interviews and send offers.
- Offer statuses track sent, accepted, declined and withdrawn.
- Employment outcomes report hires where recorded.

## Permissions and tenancy

- `internship_manage`, `internship_supervise`, `job_manage`, `job_apply`,
  `candidate_view`.
- Providers/employers only see applications for their own listings.
- Candidates only see their own applications, placements and logs.
- Cross-tenant access is blocked by RLS and covered by the isolation suite.

## Known gaps

- No structured candidate profile or CV upload; applications use a cover letter.
- No file uploads for evidence.
- No automated interview reminders.
- Employment outcomes rely on recorded application/offer status, not an external
  payroll feed.
