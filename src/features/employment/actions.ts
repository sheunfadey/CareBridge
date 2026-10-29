"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  applyToInternshipSchema,
  applyToJobSchema,
  createInternshipListingSchema,
  createJobPostingSchema,
  linesToArray,
  slugify,
  updateApplicationStatusSchema,
  updateInternshipApplicationStatusSchema,
  updateInternshipStatusSchema,
  updateJobStatusSchema,
  type ApplyToInternshipInput,
  type ApplyToJobInput,
  type CreateInternshipListingInput,
  type CreateJobPostingInput,
  type UpdateApplicationStatusInput,
  type UpdateInternshipApplicationStatusInput,
  type UpdateInternshipStatusInput,
  type UpdateJobStatusInput,
} from "@/lib/validation/employment";
import { getCurrentUser, type CurrentUser } from "@/server/auth/current-user";
import {
  AuthorisationError,
  assertPermission,
} from "@/server/auth/guards";
import { recordAudit } from "@/server/audit/record-audit";

export type EmploymentActionResult =
  | {
      ok: true;
      message?: string;
      redirectTo?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

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
  if (!user) {
    throw new AuthorisationError("Not signed in", "UNAUTHENTICATED");
  }
  return user;
}

function toFriendlyError(error: unknown): EmploymentActionResult {
  if (error instanceof AuthorisationError) {
    return {
      ok: false,
      message:
        error.code === "UNAUTHENTICATED"
          ? "Sign in to continue."
          : "You do not have permission to do that.",
    };
  }
  console.error("[employment] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

async function uniqueSlug(
  table: "job_postings" | "internship_listings",
  title: string,
): Promise<string> {
  const supabase = await createClient();
  const base = slugify(title) || "listing";
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("slug", base)
    .maybeSingle();

  if (!data) return base;
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

function optionalNumber(value: number | undefined): number | null {
  return value === undefined ? null : value;
}

function optionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createJobPostingAction(
  input: CreateJobPostingInput,
): Promise<EmploymentActionResult> {
  const parsed = createJobPostingSchema.safeParse(input);
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
    await assertPermission(user.id, "job_manage", data.organisationId);

    const supabase = await createClient();
    const slug = await uniqueSlug("job_postings", data.title);
    const { data: created, error } = await supabase
      .from("job_postings")
      .insert({
        organisation_id: data.organisationId,
        title: data.title,
        slug,
        summary: data.summary,
        description: data.description,
        duties: linesToArray(data.duties),
        employment_type: data.employmentType,
        work_location: optionalString(data.workLocation),
        state: optionalString(data.state),
        city: optionalString(data.city),
        shift_requirements: optionalString(data.shiftRequirements),
        experience_requirements: optionalString(data.experienceRequirements),
        qualifications: linesToArray(data.qualifications),
        skills: linesToArray(data.skills),
        salary_min_minor_units: optionalNumber(data.salaryMinMinorUnits),
        salary_max_minor_units: optionalNumber(data.salaryMaxMinorUnits),
        is_salary_disclosed: data.isSalaryDisclosed,
        safeguarding_requirements: optionalString(
          data.safeguardingRequirements,
        ),
        application_deadline: optionalString(data.applicationDeadline),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return {
          ok: false,
          message: "A posting with this title already exists. Try a different title.",
        };
      }
      console.error("[employment] could not create job", error);
      return { ok: false, message: "Could not create the job posting." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: data.organisationId,
      action: "job.created",
      entityType: "job_posting",
      entityId: created.id,
      metadata: { title: data.title },
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/manage");
    return {
      ok: true,
      message: "Job posting saved as a draft.",
      redirectTo: "/dashboard/jobs/manage",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateJobStatusAction(
  input: UpdateJobStatusInput,
): Promise<EmploymentActionResult> {
  const parsed = updateJobStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid status update." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: job, error: loadError } = await supabase
      .from("job_postings")
      .select("id, organisation_id, title, status")
      .eq("id", parsed.data.jobId)
      .maybeSingle();

    if (loadError || !job) {
      return { ok: false, message: "Job posting not found." };
    }

    await assertPermission(user.id, "job_manage", job.organisation_id);

    const publishing = parsed.data.status === "published";
    if (publishing && !user.isSuperAdmin) {
      const { data: organisation } = await supabase
        .from("organisations")
        .select("verification_status")
        .eq("id", job.organisation_id)
        .maybeSingle();
      if (organisation?.verification_status !== "verified") {
        return {
          ok: false,
          message:
            "Your organisation must be verified before publishing jobs. Request verification from the organisation page.",
        };
      }
    }
    const update: {
      status: typeof parsed.data.status;
      published_at?: string;
    } = { status: parsed.data.status };
    if (publishing) update.published_at = new Date().toISOString();

    const { error } = await supabase
      .from("job_postings")
      .update(update)
      .eq("id", job.id);

    if (error) {
      console.error("[employment] could not update job status", error);
      return { ok: false, message: "Could not update the job posting." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: job.organisation_id,
      action: publishing ? "job.published" : "job.updated",
      entityType: "job_posting",
      entityId: job.id,
      metadata: { status: parsed.data.status },
    });

    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/manage");
    revalidatePath(`/dashboard/jobs/manage/${job.id}`);
    return { ok: true, message: `Job marked as ${parsed.data.status}.` };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function createInternshipListingAction(
  input: CreateInternshipListingInput,
): Promise<EmploymentActionResult> {
  const parsed = createInternshipListingSchema.safeParse(input);
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
    const slug = await uniqueSlug("internship_listings", data.title);
    const { data: created, error } = await supabase
      .from("internship_listings")
      .insert({
        organisation_id: data.organisationId,
        title: data.title,
        slug,
        summary: data.summary,
        description: data.description,
        state: optionalString(data.state),
        city: optionalString(data.city),
        location: optionalString(data.location),
        start_date: optionalString(data.startDate),
        end_date: optionalString(data.endDate),
        expected_hours: optionalNumber(data.expectedHours),
        slots: data.slots,
        requirements: linesToArray(data.requirements),
        learning_objectives: linesToArray(data.learningObjectives),
        application_deadline: optionalString(data.applicationDeadline),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return {
          ok: false,
          message: "A placement with this title already exists. Try a different title.",
        };
      }
      console.error("[employment] could not create internship", error);
      return { ok: false, message: "Could not create the placement listing." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: data.organisationId,
      action: "internship.created",
      entityType: "internship_listing",
      entityId: created.id,
      metadata: { title: data.title },
    });

    revalidatePath("/dashboard/internships");
    revalidatePath("/dashboard/internships/manage");
    return {
      ok: true,
      message: "Placement listing saved as a draft.",
      redirectTo: "/dashboard/internships/manage",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateInternshipStatusAction(
  input: UpdateInternshipStatusInput,
): Promise<EmploymentActionResult> {
  const parsed = updateInternshipStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid status update." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: listing, error: loadError } = await supabase
      .from("internship_listings")
      .select("id, organisation_id, title, status")
      .eq("id", parsed.data.listingId)
      .maybeSingle();

    if (loadError || !listing) {
      return { ok: false, message: "Placement listing not found." };
    }

    await assertPermission(user.id, "internship_manage", listing.organisation_id);

    const opening = parsed.data.status === "open";
    if (opening && !user.isSuperAdmin) {
      const { data: organisation } = await supabase
        .from("organisations")
        .select("verification_status")
        .eq("id", listing.organisation_id)
        .maybeSingle();
      if (organisation?.verification_status !== "verified") {
        return {
          ok: false,
          message:
            "Your organisation must be verified before opening placements. Request verification from the organisation page.",
        };
      }
    }
    const { error } = await supabase
      .from("internship_listings")
      .update({
        status: parsed.data.status,
        published_at: opening ? new Date().toISOString() : undefined,
      })
      .eq("id", listing.id);

    if (error) {
      console.error("[employment] could not update internship status", error);
      return { ok: false, message: "Could not update the placement listing." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: listing.organisation_id,
      action: opening ? "internship.opened" : "internship.updated",
      entityType: "internship_listing",
      entityId: listing.id,
      metadata: { status: parsed.data.status },
    });

    revalidatePath("/dashboard/internships");
    revalidatePath("/dashboard/internships/manage");
    revalidatePath(`/dashboard/internships/manage/${listing.id}`);
    return { ok: true, message: `Placement marked as ${parsed.data.status}.` };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function applyToJobAction(
  input: ApplyToJobInput,
): Promise<EmploymentActionResult> {
  const parsed = applyToJobSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your application.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("id, organisation_id, title, status")
      .eq("id", parsed.data.jobId)
      .maybeSingle();

    if (jobError || !job || job.status !== "published") {
      return {
        ok: false,
        message: "This job is no longer accepting applications.",
      };
    }

    const { data: created, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: optionalString(parsed.data.coverLetter),
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return { ok: false, message: "You have already applied to this job." };
      }
      console.error("[employment] could not submit job application", error);
      return { ok: false, message: "Could not submit your application." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: job.organisation_id,
      action: "job.application.submitted",
      entityType: "job_application",
      entityId: created.id,
      metadata: { jobId: job.id, title: job.title },
    });

    revalidatePath(`/dashboard/jobs/${job.id}`);
    revalidatePath("/dashboard/jobs");
    revalidatePath("/dashboard/jobs/applications");
    return { ok: true, message: "Application submitted." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function withdrawJobApplicationAction(
  applicationId: string,
): Promise<EmploymentActionResult> {
  if (!applicationId) return { ok: false, message: "Missing application." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase
      .from("job_applications")
      .update({ status: "withdrawn" })
      .eq("id", applicationId)
      .eq("applicant_id", user.id);

    if (error) {
      console.error("[employment] could not withdraw application", error);
      return { ok: false, message: "Could not withdraw the application." };
    }

    revalidatePath("/dashboard/jobs/applications");
    return { ok: true, message: "Application withdrawn." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateJobApplicationStatusAction(
  input: UpdateApplicationStatusInput,
): Promise<EmploymentActionResult> {
  const parsed = updateApplicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid status update." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: application, error: loadError } = await supabase
      .from("job_applications")
      .select("id, job_id, job_postings(organisation_id, title)")
      .eq("id", parsed.data.applicationId)
      .maybeSingle();

    if (loadError || !application) {
      return { ok: false, message: "Application not found." };
    }

    const job = Array.isArray(application.job_postings)
      ? application.job_postings[0]
      : application.job_postings;

    if (!job) return { ok: false, message: "Application not found." };

    await assertPermission(user.id, "job_manage", job.organisation_id);

    const decided = ["offered", "hired", "rejected"].includes(
      parsed.data.status,
    );

    const { error } = await supabase
      .from("job_applications")
      .update({
        status: parsed.data.status,
        decided_at: decided ? new Date().toISOString() : null,
        decided_by: decided ? user.id : null,
      })
      .eq("id", application.id);

    if (error) {
      console.error("[employment] could not update application status", error);
      return { ok: false, message: "Could not update the application." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: job.organisation_id,
      action: "job.application.status_changed",
      entityType: "job_application",
      entityId: application.id,
      metadata: { status: parsed.data.status, jobId: application.job_id },
    });

    revalidatePath(`/dashboard/jobs/manage/${application.job_id}`);
    revalidatePath("/dashboard/jobs/manage");
    return { ok: true, message: "Application updated." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function applyToInternshipAction(
  input: ApplyToInternshipInput,
): Promise<EmploymentActionResult> {
  const parsed = applyToInternshipSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check your application.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: listing, error: listingError } = await supabase
      .from("internship_listings")
      .select("id, organisation_id, title, status")
      .eq("id", parsed.data.listingId)
      .maybeSingle();

    if (listingError || !listing || listing.status !== "open") {
      return {
        ok: false,
        message: "This placement is no longer accepting applications.",
      };
    }

    const { data: created, error } = await supabase
      .from("internship_applications")
      .insert({
        listing_id: listing.id,
        applicant_id: user.id,
        cover_note: optionalString(parsed.data.coverNote),
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return {
          ok: false,
          message: "You have already applied to this placement.",
        };
      }
      console.error("[employment] could not submit internship application", error);
      return { ok: false, message: "Could not submit your application." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: listing.organisation_id,
      action: "internship.application.submitted",
      entityType: "internship_application",
      entityId: created.id,
      metadata: { listingId: listing.id, title: listing.title },
    });

    revalidatePath(`/dashboard/internships/${listing.id}`);
    revalidatePath("/dashboard/internships");
    return { ok: true, message: "Placement application submitted." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function withdrawInternshipApplicationAction(
  applicationId: string,
): Promise<EmploymentActionResult> {
  if (!applicationId) return { ok: false, message: "Missing application." };

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase
      .from("internship_applications")
      .update({ status: "withdrawn" })
      .eq("id", applicationId)
      .eq("applicant_id", user.id);

    if (error) {
      console.error("[employment] could not withdraw application", error);
      return { ok: false, message: "Could not withdraw the application." };
    }

    revalidatePath("/dashboard/internships");
    return { ok: true, message: "Application withdrawn." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateInternshipApplicationStatusAction(
  input: UpdateInternshipApplicationStatusInput,
): Promise<EmploymentActionResult> {
  const parsed = updateInternshipApplicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid status update." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: application, error: loadError } = await supabase
      .from("internship_applications")
      .select("id, listing_id, internship_listings(organisation_id, title)")
      .eq("id", parsed.data.applicationId)
      .maybeSingle();

    if (loadError || !application) {
      return { ok: false, message: "Application not found." };
    }

    const listing = Array.isArray(application.internship_listings)
      ? application.internship_listings[0]
      : application.internship_listings;

    if (!listing) return { ok: false, message: "Application not found." };

    await assertPermission(
      user.id,
      "internship_manage",
      listing.organisation_id,
    );

    const decided = ["offered", "accepted", "rejected"].includes(
      parsed.data.status,
    );

    const { error } = await supabase
      .from("internship_applications")
      .update({
        status: parsed.data.status,
        decided_at: decided ? new Date().toISOString() : null,
        decided_by: decided ? user.id : null,
      })
      .eq("id", application.id);

    if (error) {
      console.error(
        "[employment] could not update internship application status",
        error,
      );
      return { ok: false, message: "Could not update the application." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: listing.organisation_id,
      action: "internship.application.status_changed",
      entityType: "internship_application",
      entityId: application.id,
      metadata: { status: parsed.data.status, listingId: application.listing_id },
    });

    revalidatePath(`/dashboard/internships/manage/${application.listing_id}`);
    revalidatePath("/dashboard/internships/manage");
    return { ok: true, message: "Application updated." };
  } catch (error) {
    return toFriendlyError(error);
  }
}
