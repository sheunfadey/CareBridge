"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { linesToArray } from "@/lib/validation/employment";
import {
  attendanceSchema,
  completePlacementSchema,
  createPlacementSchema,
  evaluationSchema,
  incidentSchema,
  interviewOutcomeSchema,
  issueCompletionRecordSchema,
  placementAgreementSchema,
  placementProviderSchema,
  respondToOfferSchema,
  reviewWeeklyLogSchema,
  scheduleInterviewSchema,
  sendInternshipOfferSchema,
  sendJobOfferSchema,
  updatePlacementSchema,
  weeklyLogSchema,
  withdrawOfferSchema,
  type AttendanceInput,
  type CompletePlacementInput,
  type CreatePlacementInput,
  type EvaluationInput,
  type IncidentInput,
  type InterviewOutcomeInput,
  type IssueCompletionRecordInput,
  type PlacementAgreementInput,
  type PlacementProviderInput,
  type RespondToOfferInput,
  type ReviewWeeklyLogInput,
  type ScheduleInterviewInput,
  type SendInternshipOfferInput,
  type SendJobOfferInput,
  type UpdatePlacementInput,
  type WeeklyLogInput,
  type WithdrawOfferInput,
} from "@/lib/validation/placement";
import { getCurrentUser, userHasPermission, type CurrentUser } from "@/server/auth/current-user";
import {
  AuthorisationError,
  assertPermission,
} from "@/server/auth/guards";
import { recordAudit } from "@/server/audit/record-audit";
import { createNotification } from "@/server/notifications/service";

export type PlacementActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

type Role = "job" | "internship";

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorisationError("Not signed in", "UNAUTHENTICATED");
  return user;
}

function toFriendlyError(error: unknown): PlacementActionResult {
  if (error instanceof AuthorisationError) {
    return {
      ok: false,
      message:
        error.code === "UNAUTHENTICATED"
          ? "Sign in to continue."
          : "You do not have permission to do that.",
    };
  }
  console.error("[placements] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

function optionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: number | undefined): number | null {
  return value === undefined ? null : value;
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function optionalIso(value: string | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

async function ensureVerified(
  user: CurrentUser,
  organisationId: string,
): Promise<string | null> {
  if (user.isSuperAdmin) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisations")
    .select("verification_status, name")
    .eq("id", organisationId)
    .maybeSingle();
  if (!data) return "Organisation not found.";
  if (data.verification_status !== "verified") {
    return `${data.name} must be verified before sending offers or creating placements. Request verification from the organisation page.`;
  }
  return null;
}

type JobApplicationContext = {
  id: string;
  status: string;
  applicantId: string;
  jobId: string;
  jobTitle: string;
  organisationId: string;
  organisationName: string;
  employmentType: string;
};

async function loadJobApplication(
  applicationId: string,
): Promise<JobApplicationContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select(
      "id, status, applicant_id, job_id, job_postings(title, organisation_id, employment_type, organisations(name))",
    )
    .eq("id", applicationId)
    .maybeSingle();
  if (!data) return null;
  const job = Array.isArray(data.job_postings)
    ? data.job_postings[0]
    : data.job_postings;
  if (!job) return null;
  const organisation = Array.isArray(job.organisations)
    ? job.organisations[0]
    : job.organisations;
  return {
    id: data.id,
    status: data.status,
    applicantId: data.applicant_id,
    jobId: data.job_id,
    jobTitle: job.title,
    organisationId: job.organisation_id,
    organisationName: organisation?.name ?? "your organisation",
    employmentType: job.employment_type,
  };
}

type InternshipApplicationContext = {
  id: string;
  status: string;
  applicantId: string;
  listingId: string;
  listingTitle: string;
  organisationId: string;
  organisationName: string;
  startDate: string | null;
  endDate: string | null;
  expectedHours: number | null;
  location: string | null;
};

async function loadInternshipApplication(
  applicationId: string,
): Promise<InternshipApplicationContext | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internship_applications")
    .select(
      "id, status, applicant_id, listing_id, internship_listings(title, organisation_id, start_date, end_date, expected_hours, location, organisations(name))",
    )
    .eq("id", applicationId)
    .maybeSingle();
  if (!data) return null;
  const listing = Array.isArray(data.internship_listings)
    ? data.internship_listings[0]
    : data.internship_listings;
  if (!listing) return null;
  const organisation = Array.isArray(listing.organisations)
    ? listing.organisations[0]
    : listing.organisations;
  return {
    id: data.id,
    status: data.status,
    applicantId: data.applicant_id,
    listingId: data.listing_id,
    listingTitle: listing.title,
    organisationId: listing.organisation_id,
    organisationName: organisation?.name ?? "your organisation",
    startDate: listing.start_date,
    endDate: listing.end_date,
    expectedHours: listing.expected_hours,
    location: listing.location,
  };
}

async function canManagePlacement(
  user: CurrentUser,
  placementId: string,
): Promise<{
  organisationId: string;
  candidateId: string;
  supervisorId: string | null;
  createdBy: string | null;
  status: string;
  agreementStatus: string;
  safeguardingCleared: boolean;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internship_placements")
    .select(
      "organisation_id, candidate_id, supervisor_id, created_by, status, agreement_status, safeguarding_cleared",
    )
    .eq("id", placementId)
    .maybeSingle();
  return data
    ? {
        organisationId: data.organisation_id,
        candidateId: data.candidate_id,
        supervisorId: data.supervisor_id,
        createdBy: data.created_by,
        status: data.status,
        agreementStatus: data.agreement_status,
        safeguardingCleared: data.safeguarding_cleared,
      }
    : null;
}

async function notifyInterestedStaff(
  organisationId: string,
  placementId: string,
  title: string,
  body: string,
): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internship_placements")
    .select("supervisor_id, created_by")
    .eq("id", placementId)
    .maybeSingle();
  const recipients = new Set(
    [data?.supervisor_id, data?.created_by].filter(
      (value): value is string => Boolean(value),
    ),
  );
  for (const userId of recipients) {
    await createNotification({
      userId,
      title,
      body,
      category: "internship",
      organisationId,
      actionUrl: `/dashboard/internships/placements/${placementId}`,
    });
  }
}

// Interviews -----------------------------------------------------------------

export async function scheduleInterviewAction(
  input: ScheduleInterviewInput,
): Promise<PlacementActionResult> {
  const parsed = scheduleInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    const supabase = await createClient();

    const application =
      data.applicationType === "job"
        ? await loadJobApplication(data.applicationId)
        : await loadInternshipApplication(data.applicationId);

    if (!application) {
      return { ok: false, message: "Application not found." };
    }

    await assertPermission(
      user.id,
      data.applicationType === "job" ? "job_manage" : "internship_manage",
      application.organisationId,
    );

    const { error } = await supabase.from("interviews").insert({
      job_application_id:
        data.applicationType === "job" ? data.applicationId : null,
      internship_application_id:
        data.applicationType === "internship" ? data.applicationId : null,
      scheduled_by: user.id,
      scheduled_at: toIso(data.scheduledAt),
      duration_minutes: data.durationMinutes,
      mode: data.mode,
      location: optionalString(data.location),
      meeting_link: optionalString(data.meetingLink),
    });

    if (error) {
      console.error("[placements] could not schedule interview", error);
      return { ok: false, message: "Could not schedule the interview." };
    }

    if (data.applicationType === "job" && application.status !== "offered") {
      await supabase
        .from("job_applications")
        .update({ status: "interview" })
        .eq("id", application.id)
        .in("status", ["submitted", "under_review", "shortlisted"]);
    }

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action: "interview.scheduled",
      entityType: data.applicationType === "job" ? "job_application" : "internship_application",
      entityId: application.id,
      metadata: {
        scheduledAt: toIso(data.scheduledAt),
        mode: data.mode,
      },
    });

    await createNotification({
      userId: application.applicantId,
      title: "Interview scheduled",
      body: `${application.organisationName} scheduled an interview for ${
        "jobTitle" in application ? application.jobTitle : application.listingTitle
      }.`,
      category: data.applicationType === "job" ? "employment" : "internship",
      organisationId: application.organisationId,
      actionUrl:
        data.applicationType === "job"
          ? "/dashboard/jobs/applications"
          : "/dashboard/internships/applications",
    });

    revalidatePath(
      data.applicationType === "job"
        ? `/dashboard/jobs/manage/applications/${application.id}`
        : `/dashboard/internships/manage/applications/${application.id}`,
    );
    return { ok: true, message: "Interview scheduled." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateInterviewAction(
  input: InterviewOutcomeInput,
): Promise<PlacementActionResult> {
  const parsed = interviewOutcomeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid interview update." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: interview } = await supabase
      .from("interviews")
      .select("id, job_application_id, internship_application_id")
      .eq("id", parsed.data.interviewId)
      .maybeSingle();
    if (!interview) return { ok: false, message: "Interview not found." };

    const application = interview.job_application_id
      ? await loadJobApplication(interview.job_application_id)
      : interview.internship_application_id
        ? await loadInternshipApplication(interview.internship_application_id)
        : null;
    if (!application) return { ok: false, message: "Application not found." };

    await assertPermission(
      user.id,
      interview.job_application_id ? "job_manage" : "internship_manage",
      application.organisationId,
    );

    const { error } = await supabase
      .from("interviews")
      .update({
        status: parsed.data.status,
        feedback: optionalString(parsed.data.feedback),
        rating:
          parsed.data.rating === "" || parsed.data.rating === undefined
            ? null
            : parsed.data.rating,
        completed_at:
          parsed.data.status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", interview.id);

    if (error) {
      console.error("[placements] could not update interview", error);
      return { ok: false, message: "Could not update the interview." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action: "interview.updated",
      entityType: "interview",
      entityId: interview.id,
      metadata: { status: parsed.data.status },
    });

    revalidatePath(
      interview.job_application_id
        ? `/dashboard/jobs/manage/applications/${application.id}`
        : `/dashboard/internships/manage/applications/${application.id}`,
    );
    return { ok: true, message: "Interview updated." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

// Offers ---------------------------------------------------------------------

export async function sendJobOfferAction(
  input: SendJobOfferInput,
): Promise<PlacementActionResult> {
  const parsed = sendJobOfferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    const application = await loadJobApplication(data.applicationId);
    if (!application) return { ok: false, message: "Application not found." };
    await assertPermission(user.id, "job_manage", application.organisationId);

    const blocked = await ensureVerified(user, application.organisationId);
    if (blocked) return { ok: false, message: blocked };

    const supabase = await createClient();
    const { error } = await supabase.from("job_offers").insert({
      application_id: application.id,
      offered_by: user.id,
      employment_type: data.employmentType,
      salary_minor_units: optionalNumber(data.salaryMinorUnits),
      salary_currency: data.salaryCurrency.toUpperCase(),
      start_date: optionalString(data.startDate),
      expires_at: optionalIso(data.expiresAt),
      notes: optionalString(data.notes),
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "An offer has already been sent." };
      }
      console.error("[placements] could not send job offer", error);
      return { ok: false, message: "Could not send the offer." };
    }

    await supabase
      .from("job_applications")
      .update({
        status: "offered",
        decided_at: new Date().toISOString(),
        decided_by: user.id,
      })
      .eq("id", application.id);

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action: "job.offer.sent",
      entityType: "job_application",
      entityId: application.id,
      metadata: { jobId: application.jobId },
    });

    await createNotification({
      userId: application.applicantId,
      title: "You received a job offer",
      body: `${application.organisationName} sent you an offer for ${application.jobTitle}. Review and respond from your applications page.`,
      category: "employment",
      priority: "high",
      organisationId: application.organisationId,
      actionUrl: "/dashboard/jobs/applications",
    });

    revalidatePath(`/dashboard/jobs/manage/applications/${application.id}`);
    return { ok: true, message: "Offer sent." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function sendInternshipOfferAction(
  input: SendInternshipOfferInput,
): Promise<PlacementActionResult> {
  const parsed = sendInternshipOfferSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    const application = await loadInternshipApplication(data.applicationId);
    if (!application) return { ok: false, message: "Application not found." };
    await assertPermission(
      user.id,
      "internship_manage",
      application.organisationId,
    );

    const blocked = await ensureVerified(user, application.organisationId);
    if (blocked) return { ok: false, message: blocked };

    const supabase = await createClient();
    const { error } = await supabase.from("internship_offers").insert({
      application_id: application.id,
      offered_by: user.id,
      start_date: optionalString(data.startDate),
      end_date: optionalString(data.endDate),
      expected_hours: optionalNumber(data.expectedHours),
      location: optionalString(data.location),
      expires_at: optionalIso(data.expiresAt),
      notes: optionalString(data.notes),
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "An offer has already been sent." };
      }
      console.error("[placements] could not send internship offer", error);
      return { ok: false, message: "Could not send the offer." };
    }

    await supabase
      .from("internship_applications")
      .update({
        status: "offered",
        decided_at: new Date().toISOString(),
        decided_by: user.id,
      })
      .eq("id", application.id);

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action: "internship.offer.sent",
      entityType: "internship_application",
      entityId: application.id,
      metadata: { listingId: application.listingId },
    });

    await createNotification({
      userId: application.applicantId,
      title: "You received a placement offer",
      body: `${application.organisationName} sent you an offer for ${application.listingTitle}. Review and respond from your internship applications page.`,
      category: "internship",
      priority: "high",
      organisationId: application.organisationId,
      actionUrl: "/dashboard/internships/applications",
    });

    revalidatePath(
      `/dashboard/internships/manage/applications/${application.id}`,
    );
    return { ok: true, message: "Offer sent." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

async function responderCheck(
  user: CurrentUser,
  offerType: Role,
  offerId: string,
): Promise<
  | {
      applicantId: string;
      organisationId: string;
      applicationId: string;
      title: string;
    }
  | { error: string }
> {
  const supabase = await createClient();
  if (offerType === "job") {
    const { data } = await supabase
      .from("job_offers")
      .select(
        "id, status, application_id, job_applications(applicant_id, job_postings(title, organisation_id))",
      )
      .eq("id", offerId)
      .maybeSingle();
    if (!data) return { error: "Offer not found." };
    const application = Array.isArray(data.job_applications)
      ? data.job_applications[0]
      : data.job_applications;
    const job = application
      ? Array.isArray(application.job_postings)
        ? application.job_postings[0]
        : application.job_postings
      : null;
    if (!application || !job) return { error: "Offer not found." };
    if (application.applicant_id !== user.id) {
      return { error: "Offer not found." };
    }
    return {
      applicantId: application.applicant_id,
      organisationId: job.organisation_id,
      applicationId: data.application_id,
      title: job.title,
    };
  }

  const { data } = await supabase
    .from("internship_offers")
    .select(
      "id, status, application_id, internship_applications(applicant_id, internship_listings(title, organisation_id))",
    )
    .eq("id", offerId)
    .maybeSingle();
  if (!data) return { error: "Offer not found." };
  const application = Array.isArray(data.internship_applications)
    ? data.internship_applications[0]
    : data.internship_applications;
  const listing = application
    ? Array.isArray(application.internship_listings)
      ? application.internship_listings[0]
      : application.internship_listings
    : null;
  if (!application || !listing) return { error: "Offer not found." };
  if (application.applicant_id !== user.id) {
    return { error: "Offer not found." };
  }
  return {
    applicantId: application.applicant_id,
    organisationId: listing.organisation_id,
    applicationId: data.application_id,
    title: listing.title,
  };
}

export async function respondToOfferAction(
  input: RespondToOfferInput,
): Promise<PlacementActionResult> {
  const parsed = respondToOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid offer response." };
  }

  try {
    const user = await requireUser();
    const context = await responderCheck(
      user,
      parsed.data.offerType,
      parsed.data.offerId,
    );
    if ("error" in context) return { ok: false, message: context.error };

    const supabase = await createClient();
    const table =
      parsed.data.offerType === "job" ? "job_offers" : "internship_offers";
    const { error } = await supabase
      .from(table)
      .update({
        status: parsed.data.response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.offerId)
      .eq("status", "sent");

    if (error) {
      console.error("[placements] could not respond to offer", error);
      return { ok: false, message: "Could not record your response." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: context.organisationId,
      action:
        parsed.data.offerType === "job"
          ? "job.offer.responded"
          : "internship.offer.responded",
      entityType: parsed.data.offerType === "job" ? "job_offer" : "internship_offer",
      entityId: parsed.data.offerId,
      metadata: { response: parsed.data.response },
    });

    revalidatePath(
      parsed.data.offerType === "job"
        ? "/dashboard/jobs/applications"
        : "/dashboard/internships/applications",
    );
    if (parsed.data.offerType === "internship") {
      revalidatePath("/dashboard/internships/placements");
    }
    return {
      ok: true,
      message:
        parsed.data.response === "accepted"
          ? "Offer accepted. The organisation will be in touch."
          : "Offer declined.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function withdrawOfferAction(
  input: WithdrawOfferInput,
): Promise<PlacementActionResult> {
  const parsed = withdrawOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };

  try {
    const user = await requireUser();
    const application =
      parsed.data.offerType === "job"
        ? await (async () => {
            const supabase = await createClient();
            const { data } = await supabase
              .from("job_offers")
              .select("application_id")
              .eq("id", parsed.data.offerId)
              .maybeSingle();
            return data
              ? loadJobApplication(data.application_id)
              : Promise.resolve(null);
          })()
        : await (async () => {
            const supabase = await createClient();
            const { data } = await supabase
              .from("internship_offers")
              .select("application_id")
              .eq("id", parsed.data.offerId)
              .maybeSingle();
            return data
              ? loadInternshipApplication(data.application_id)
              : Promise.resolve(null);
          })();

    if (!application) return { ok: false, message: "Offer not found." };

    await assertPermission(
      user.id,
      parsed.data.offerType === "job" ? "job_manage" : "internship_manage",
      application.organisationId,
    );

    const supabase = await createClient();
    const table =
      parsed.data.offerType === "job" ? "job_offers" : "internship_offers";
    const { error } = await supabase
      .from(table)
      .update({ status: "withdrawn" })
      .eq("id", parsed.data.offerId)
      .eq("status", "sent");

    if (error) {
      return { ok: false, message: "Could not withdraw the offer." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action:
        parsed.data.offerType === "job"
          ? "job.offer.withdrawn"
          : "internship.offer.withdrawn",
      entityType:
        parsed.data.offerType === "job" ? "job_offer" : "internship_offer",
      entityId: parsed.data.offerId,
    });

    revalidatePath(
      parsed.data.offerType === "job"
        ? `/dashboard/jobs/manage/applications/${application.id}`
        : `/dashboard/internships/manage/applications/${application.id}`,
    );
    return { ok: true, message: "Offer withdrawn." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

// Placements -----------------------------------------------------------------

export async function createPlacementAction(
  input: CreatePlacementInput,
): Promise<PlacementActionResult> {
  const parsed = createPlacementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    const application = await loadInternshipApplication(data.applicationId);
    if (!application) return { ok: false, message: "Application not found." };
    await assertPermission(
      user.id,
      "internship_manage",
      application.organisationId,
    );

    if (application.status !== "accepted") {
      return {
        ok: false,
        message: "Only accepted applications can become placements.",
      };
    }

    const blocked = await ensureVerified(user, application.organisationId);
    if (blocked) return { ok: false, message: blocked };

    if (data.supervisorId) {
      const supabase = await createClient();
      const { data: membership } = await supabase
        .from("organisation_memberships")
        .select("id")
        .eq("organisation_id", application.organisationId)
        .eq("user_id", data.supervisorId)
        .eq("status", "active")
        .maybeSingle();
      if (!membership) {
        return {
          ok: false,
          message: "The supervisor must be an active member of the organisation.",
        };
      }
    }

    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from("internship_placements")
      .insert({
        organisation_id: application.organisationId,
        listing_id: application.listingId,
        application_id: application.id,
        candidate_id: application.applicantId,
        supervisor_id: data.supervisorId || null,
        status: "pending_agreement",
        agreement_status: "pending",
        location: optionalString(data.location) ?? application.location,
        state: optionalString(data.state),
        city: optionalString(data.city),
        start_date: data.startDate,
        end_date: data.endDate,
        expected_hours: data.expectedHours ?? application.expectedHours,
        learning_objectives: linesToArray(data.learningObjectives),
        supervision_arrangements: optionalString(data.supervisionArrangements),
        safeguarding_cleared: data.safeguardingCleared,
        insurance_cleared: data.insuranceCleared,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return {
          ok: false,
          message: "A placement already exists for this application.",
        };
      }
      console.error("[placements] could not create placement", error);
      return { ok: false, message: "Could not create the placement." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: application.organisationId,
      action: "placement.created",
      entityType: "internship_placement",
      entityId: created.id,
      metadata: { applicationId: application.id },
    });

    await createNotification({
      userId: application.applicantId,
      title: "Placement created",
      body: `${application.organisationName} created your placement for ${application.listingTitle}. Please review and accept the agreement.`,
      category: "internship",
      organisationId: application.organisationId,
      actionUrl: `/dashboard/internships/placements/${created.id}`,
    });

    revalidatePath("/dashboard/internships/placements");
    revalidatePath(
      `/dashboard/internships/manage/applications/${application.id}`,
    );
    return {
      ok: true,
      message: "Placement created.",
      redirectTo: `/dashboard/internships/placements/${created.id}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updatePlacementAction(
  input: UpdatePlacementInput,
): Promise<PlacementActionResult> {
  const parsed = updatePlacementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    const current = await canManagePlacement(user, data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    await assertPermission(
      user.id,
      "internship_manage",
      current.organisationId,
    );

    if (data.status === "active" && current.agreementStatus === "pending") {
      return {
        ok: false,
        message: "Wait for the candidate to accept the placement agreement.",
      };
    }
    if (data.status === "completed") {
      return {
        ok: false,
        message: "Use the completion action to record a completed placement.",
      };
    }

    if (data.supervisorId) {
      const supabase = await createClient();
      const { data: membership } = await supabase
        .from("organisation_memberships")
        .select("id")
        .eq("organisation_id", current.organisationId)
        .eq("user_id", data.supervisorId)
        .eq("status", "active")
        .maybeSingle();
      if (!membership) {
        return {
          ok: false,
          message: "The supervisor must be an active member of the organisation.",
        };
      }
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_placements")
      .update({
        supervisor_id: data.supervisorId || null,
        status: data.status,
        start_date: data.startDate || undefined,
        end_date: data.endDate || undefined,
        expected_hours: data.expectedHours ?? undefined,
        location: data.location === undefined ? undefined : optionalString(data.location),
        learning_objectives:
          data.learningObjectives === undefined
            ? undefined
            : linesToArray(data.learningObjectives),
        supervision_arrangements:
          data.supervisionArrangements === undefined
            ? undefined
            : optionalString(data.supervisionArrangements),
        safeguarding_cleared: data.safeguardingCleared,
        insurance_cleared: data.insuranceCleared,
        started_at:
          data.status === "active" ? new Date().toISOString() : undefined,
      })
      .eq("id", data.placementId);

    if (error) {
      console.error("[placements] could not update placement", error);
      return { ok: false, message: "Could not update the placement." };
    }

    const action =
      data.status === "active"
        ? "placement.activated"
        : data.status === "terminated"
          ? "placement.terminated"
          : "placement.updated";

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action,
      entityType: "internship_placement",
      entityId: data.placementId,
      metadata: { status: data.status ?? null },
    });

    revalidatePath("/dashboard/internships/placements");
    revalidatePath(`/dashboard/internships/placements/${data.placementId}`);
    return { ok: true, message: "Placement updated." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function respondToPlacementAgreementAction(
  input: PlacementAgreementInput,
): Promise<PlacementActionResult> {
  const parsed = placementAgreementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid response." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: placement } = await supabase
      .from("internship_placements")
      .select("candidate_id, organisation_id, status, agreement_status")
      .eq("id", parsed.data.placementId)
      .maybeSingle();
    if (!placement || placement.candidate_id !== user.id) {
      return { ok: false, message: "Placement not found." };
    }
    if (placement.agreement_status !== "pending") {
      return { ok: false, message: "The agreement has already been answered." };
    }

    const { error } = await supabase
      .from("internship_placements")
      .update({ agreement_status: parsed.data.agreementStatus })
      .eq("id", parsed.data.placementId);

    if (error) {
      console.error("[placements] could not respond to agreement", error);
      return { ok: false, message: "Could not record your response." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: placement.organisation_id,
      action: "placement.agreement.responded",
      entityType: "internship_placement",
      entityId: parsed.data.placementId,
      metadata: { agreementStatus: parsed.data.agreementStatus },
    });

    await notifyInterestedStaff(
      placement.organisation_id,
      parsed.data.placementId,
      "Placement agreement updated",
      `The candidate ${parsed.data.agreementStatus} the placement agreement.`,
    );

    revalidatePath("/dashboard/internships/placements");
    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return {
      ok: true,
      message:
        parsed.data.agreementStatus === "accepted"
          ? "Agreement accepted."
          : "Agreement declined.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function completePlacementAction(
  input: CompletePlacementInput,
): Promise<PlacementActionResult> {
  const parsed = completePlacementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please add a completion summary.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    await assertPermission(user.id, "internship_manage", current.organisationId);

    if (current.status !== "active") {
      return { ok: false, message: "Only active placements can be completed." };
    }
    if (!current.safeguardingCleared) {
      return {
        ok: false,
        message:
          "Confirm safeguarding clearance before completing the placement.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_placements")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completion_summary: parsed.data.completionSummary,
      })
      .eq("id", parsed.data.placementId);

    if (error) {
      console.error("[placements] could not complete placement", error);
      return { ok: false, message: "Could not complete the placement." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "placement.completed",
      entityType: "internship_placement",
      entityId: parsed.data.placementId,
    });

    await createNotification({
      userId: current.candidateId,
      title: "Placement completed",
      body: "Your placement has been marked as completed. Your host organisation can now issue a completion record.",
      category: "internship",
      organisationId: current.organisationId,
      actionUrl: `/dashboard/internships/placements/${parsed.data.placementId}`,
    });

    revalidatePath("/dashboard/internships/placements");
    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return { ok: true, message: "Placement completed." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function issueCompletionRecordAction(
  input: IssueCompletionRecordInput,
): Promise<PlacementActionResult> {
  const parsed = issueCompletionRecordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the completion record.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    await assertPermission(user.id, "internship_manage", current.organisationId);

    if (current.status !== "completed") {
      return {
        ok: false,
        message: "Complete the placement before issuing a record.",
      };
    }

    const supabase = await createClient();
    const certificateCode = `CB-INT-${crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 10)
      .toUpperCase()}`;

    const { error } = await supabase
      .from("internship_completion_records")
      .insert({
        placement_id: parsed.data.placementId,
        candidate_id: current.candidateId,
        organisation_id: current.organisationId,
        certificate_code: certificateCode,
        hours_completed: parsed.data.hoursCompleted,
        outcome: parsed.data.outcome,
        summary: optionalString(parsed.data.summary),
        issued_by: user.id,
      });

    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          message: "A completion record has already been issued.",
        };
      }
      console.error("[placements] could not issue completion record", error);
      return { ok: false, message: "Could not issue the completion record." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.completion.issued",
      entityType: "internship_completion_record",
      entityId: parsed.data.placementId,
      metadata: { certificateCode },
    });

    await createNotification({
      userId: current.candidateId,
      title: "Completion record issued",
      body: `Your placement completion record (${certificateCode}) is ready.`,
      category: "internship",
      organisationId: current.organisationId,
      actionUrl: `/dashboard/internships/placements/${parsed.data.placementId}`,
    });

    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return { ok: true, message: "Completion record issued." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

// Logs, attendance, evaluations and incidents --------------------------------

export async function submitWeeklyLogAction(
  input: WeeklyLogInput,
): Promise<PlacementActionResult> {
  const parsed = weeklyLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    if (
      current.candidateId !== user.id &&
      current.supervisorId !== user.id
    ) {
      return { ok: false, message: "Placement not found." };
    }
    if (current.status !== "active") {
      return { ok: false, message: "Weekly logs are open on active placements." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("internship_logs").insert({
      placement_id: parsed.data.placementId,
      author_id: user.id,
      week_start: parsed.data.weekStart,
      week_end: parsed.data.weekEnd,
      hours: parsed.data.hours,
      summary: parsed.data.summary,
      challenges: optionalString(parsed.data.challenges),
      next_steps: optionalString(parsed.data.nextSteps),
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: "A log for this week already exists." };
      }
      console.error("[placements] could not submit weekly log", error);
      return { ok: false, message: "Could not submit the weekly log." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.log.submitted",
      entityType: "internship_placement",
      entityId: parsed.data.placementId,
      metadata: { weekStart: parsed.data.weekStart },
    });

    await notifyInterestedStaff(
      current.organisationId,
      parsed.data.placementId,
      "New weekly log",
      "A weekly log was submitted for a placement you supervise.",
    );

    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return { ok: true, message: "Weekly log submitted." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function reviewWeeklyLogAction(
  input: ReviewWeeklyLogInput,
): Promise<PlacementActionResult> {
  const parsed = reviewWeeklyLogSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid log review." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: log } = await supabase
      .from("internship_logs")
      .select("placement_id, author_id")
      .eq("id", parsed.data.logId)
      .maybeSingle();
    if (!log) return { ok: false, message: "Log not found." };

    const current = await canManagePlacement(user, log.placement_id);
    if (!current) return { ok: false, message: "Log not found." };
    if (
      current.supervisorId !== user.id &&
      !userHasPermission(user, "internship_manage")
    ) {
      return { ok: false, message: "You cannot review this log." };
    }

    const { error } = await supabase
      .from("internship_logs")
      .update({
        status: parsed.data.status,
        supervisor_feedback: optionalString(parsed.data.supervisorFeedback),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.logId);

    if (error) {
      console.error("[placements] could not review log", error);
      return { ok: false, message: "Could not review the log." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.log.reviewed",
      entityType: "internship_log",
      entityId: parsed.data.logId,
      metadata: { status: parsed.data.status },
    });

    await createNotification({
      userId: log.author_id,
      title:
        parsed.data.status === "approved"
          ? "Weekly log approved"
          : "Weekly log needs changes",
      body: optionalString(parsed.data.supervisorFeedback) ?? undefined,
      category: "internship",
      organisationId: current.organisationId,
      actionUrl: `/dashboard/internships/placements/${log.placement_id}`,
    });

    revalidatePath(`/dashboard/internships/placements/${log.placement_id}`);
    return { ok: true, message: "Log reviewed." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function recordAttendanceAction(
  input: AttendanceInput,
): Promise<PlacementActionResult> {
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the attendance entry.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    if (
      current.supervisorId !== user.id &&
      !userHasPermission(user, "internship_manage")
    ) {
      return { ok: false, message: "You cannot record attendance." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("internship_attendance").upsert(
      {
        placement_id: parsed.data.placementId,
        attendance_date: parsed.data.attendanceDate,
        status: parsed.data.status,
        hours: parsed.data.hours,
        notes: optionalString(parsed.data.notes),
        recorded_by: user.id,
      },
      { onConflict: "placement_id,attendance_date" },
    );

    if (error) {
      console.error("[placements] could not record attendance", error);
      return { ok: false, message: "Could not record attendance." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.attendance.recorded",
      entityType: "internship_placement",
      entityId: parsed.data.placementId,
      metadata: { date: parsed.data.attendanceDate, status: parsed.data.status },
    });

    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return { ok: true, message: "Attendance recorded." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function submitEvaluationAction(
  input: EvaluationInput,
): Promise<PlacementActionResult> {
  const parsed = evaluationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    if (
      current.supervisorId !== user.id &&
      !userHasPermission(user, "internship_manage")
    ) {
      return { ok: false, message: "You cannot evaluate this placement." };
    }

    const data = parsed.data;
    const optionalRating = (value: number | "" | undefined) =>
      value === "" || value === undefined ? null : value;

    const supabase = await createClient();
    const { error } = await supabase.from("internship_evaluations").upsert(
      {
        placement_id: data.placementId,
        evaluator_id: user.id,
        evaluation_date: data.evaluationDate,
        overall_rating: data.overallRating,
        care_practice_rating: optionalRating(data.carePracticeRating),
        communication_rating: optionalRating(data.communicationRating),
        professionalism_rating: optionalRating(data.professionalismRating),
        safeguarding_rating: optionalRating(data.safeguardingRating),
        strengths: optionalString(data.strengths),
        areas_for_improvement: optionalString(data.areasForImprovement),
        recommendation: data.recommendation,
        status: data.status,
      },
      { onConflict: "placement_id,evaluator_id" },
    );

    if (error) {
      console.error("[placements] could not submit evaluation", error);
      return { ok: false, message: "Could not save the evaluation." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.evaluation.submitted",
      entityType: "internship_placement",
      entityId: data.placementId,
      metadata: { recommendation: data.recommendation },
    });

    if (data.status === "submitted") {
      await createNotification({
        userId: current.candidateId,
        title: "Placement evaluation available",
        body: "Your supervisor submitted an evaluation for your placement.",
        category: "internship",
        organisationId: current.organisationId,
        actionUrl: `/dashboard/internships/placements/${data.placementId}`,
      });
    }

    revalidatePath(`/dashboard/internships/placements/${data.placementId}`);
    return {
      ok: true,
      message:
        data.status === "draft" ? "Evaluation saved as a draft." : "Evaluation submitted.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function reportIncidentAction(
  input: IncidentInput,
): Promise<PlacementActionResult> {
  const parsed = incidentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the incident details.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const current = await canManagePlacement(user, parsed.data.placementId);
    if (!current) return { ok: false, message: "Placement not found." };
    if (current.candidateId !== user.id && current.supervisorId !== user.id) {
      // Managers can also report; they are verified by RLS.
      const canManage = userHasPermission(user, "internship_manage");
      if (!canManage) return { ok: false, message: "Placement not found." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("internship_incidents").insert({
      placement_id: parsed.data.placementId,
      reported_by: user.id,
      occurred_at: toIso(parsed.data.occurredAt),
      category: parsed.data.category,
      severity: parsed.data.severity,
      description: parsed.data.description,
    });

    if (error) {
      console.error("[placements] could not report incident", error);
      return { ok: false, message: "Could not report the incident." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.incident.reported",
      entityType: "internship_placement",
      entityId: parsed.data.placementId,
      metadata: { severity: parsed.data.severity },
    });

    if (user.id === current.candidateId) {
      await notifyInterestedStaff(
        current.organisationId,
        parsed.data.placementId,
        "Placement incident reported",
        `A ${parsed.data.severity} severity incident was reported by the candidate.`,
      );
    } else {
      await createNotification({
        userId: current.candidateId,
        title: "Placement incident update",
        body: "An incident was recorded on your placement. Your supervisor will follow up.",
        category: "internship",
        priority: "high",
        organisationId: current.organisationId,
        actionUrl: `/dashboard/internships/placements/${parsed.data.placementId}`,
      });
    }

    revalidatePath(`/dashboard/internships/placements/${parsed.data.placementId}`);
    return { ok: true, message: "Incident reported." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateIncidentAction(input: {
  incidentId: string;
  status: "open" | "investigating" | "resolved" | "closed";
  resolution?: string;
}): Promise<PlacementActionResult> {
  if (!input.incidentId) return { ok: false, message: "Invalid incident." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: incident } = await supabase
      .from("internship_incidents")
      .select("placement_id, reported_by")
      .eq("id", input.incidentId)
      .maybeSingle();
    if (!incident) return { ok: false, message: "Incident not found." };

    const current = await canManagePlacement(user, incident.placement_id);
    if (!current) return { ok: false, message: "Incident not found." };
    if (
      current.supervisorId !== user.id &&
      !userHasPermission(user, "internship_manage")
    ) {
      return { ok: false, message: "You cannot update this incident." };
    }

    const resolved = input.status === "resolved" || input.status === "closed";
    const { error } = await supabase
      .from("internship_incidents")
      .update({
        status: input.status,
        resolution: optionalString(input.resolution),
        resolved_by: resolved ? user.id : null,
        resolved_at: resolved ? new Date().toISOString() : null,
      })
      .eq("id", input.incidentId);

    if (error) {
      console.error("[placements] could not update incident", error);
      return { ok: false, message: "Could not update the incident." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: current.organisationId,
      action: "internship.incident.updated",
      entityType: "internship_incident",
      entityId: input.incidentId,
      metadata: { status: input.status },
    });

    revalidatePath(`/dashboard/internships/placements/${incident.placement_id}`);
    return { ok: true, message: "Incident updated." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

// Provider profile -----------------------------------------------------------

export async function updatePlacementProviderAction(
  input: PlacementProviderInput,
): Promise<PlacementActionResult> {
  const parsed = placementProviderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const data = parsed.data;
    await assertPermission(user.id, "internship_manage", data.organisationId);

    const supabase = await createClient();
    const { error } = await supabase.from("placement_providers").upsert(
      {
        organisation_id: data.organisationId,
        description: optionalString(data.description),
        contact_email: optionalString(data.contactEmail),
        contact_phone: optionalString(data.contactPhone),
        address: optionalString(data.address),
        state: optionalString(data.state),
        city: optionalString(data.city),
        safeguarding_lead: optionalString(data.safeguardingLead),
        is_accepting_interns: data.isAcceptingInterns,
        created_by: user.id,
      },
      { onConflict: "organisation_id" },
    );

    if (error) {
      console.error("[placements] could not update provider", error);
      return { ok: false, message: "Could not save the provider profile." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: data.organisationId,
      action: "placement_provider.updated",
      entityType: "organisation",
      entityId: data.organisationId,
    });

    revalidatePath(`/dashboard/organisation/${data.organisationId}`);
    return { ok: true, message: "Provider profile saved." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function requestOrganisationVerificationAction(
  organisationId: string,
): Promise<PlacementActionResult> {
  if (!organisationId) return { ok: false, message: "Missing organisation." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: organisation } = await supabase
      .from("organisations")
      .select("id, name, verification_status")
      .eq("id", organisationId)
      .maybeSingle();
    if (!organisation) return { ok: false, message: "Organisation not found." };

    const membership = user.organisations.find(
      (org) => org.organisationId === organisationId,
    );
    if (!user.isSuperAdmin && !membership?.isOwner) {
      return {
        ok: false,
        message: "Only the organisation owner can request verification.",
      };
    }

    if (organisation.verification_status === "verified") {
      return { ok: false, message: "This organisation is already verified." };
    }
    if (organisation.verification_status === "pending") {
      return { ok: false, message: "Verification is already under review." };
    }

    const { error } = await supabase
      .from("organisations")
      .update({ verification_status: "pending" })
      .eq("id", organisationId);

    if (error) {
      console.error("[placements] could not request verification", error);
      return {
        ok: false,
        message: "Could not submit the verification request.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId,
      action: "organisation.verification_requested",
      entityType: "organisation",
      entityId: organisationId,
    });

    revalidatePath(`/dashboard/organisation/${organisationId}`);
    revalidatePath("/dashboard/admin/organisations");
    return {
      ok: true,
      message: "Verification requested. The platform team will review it.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}
