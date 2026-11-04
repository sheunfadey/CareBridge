"use server";

import { revalidatePath } from "next/cache";

import { parseMoneyToMinorUnits } from "@/lib/money";
import {
  campaignAllocationSchema,
  campaignExpenseSchema,
  campaignReviewSchema,
  campaignSchema,
  donationCheckoutSchema,
  donationPreferenceSchema,
  impactReportSchema,
  scholarshipApplicationSchema,
  scholarshipAwardSchema,
  scholarshipAwardStatusSchema,
  scholarshipOutcomeSchema,
  scholarshipProgrammeSchema,
  scholarshipReviewSchema,
} from "@/lib/validation/charity";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/server/audit/record-audit";
import { AuthorisationError } from "@/server/auth/guards";
import { getCurrentUser, requireUser } from "@/server/auth/current-user";
import type { CurrentUser } from "@/server/auth/current-user";
import {
  assertCharityPermission,
  listCharityWorkspaces,
  type CharityWorkspace,
} from "@/server/charity/access";
import { createDonationCheckout } from "@/server/charity/donations";
import type { Json } from "@/types/database";

export type CharityActionResult =
  | { ok: true; message: string; id?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]>; redirectTo?: string };

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

function invalid(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): CharityActionResult {
  return {
    ok: false,
    message: "Check the highlighted fields.",
    fieldErrors: fieldErrorsFromZod(error.issues),
  };
}

function parseMoney(value: string): number | null {
  try {
    const minor = parseMoneyToMinorUnits(value);
    return minor > 0 ? minor : null;
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function lines(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function friendlyDbMessage(message: string): string {
  const value = message.toLowerCase();
  if (value.includes("read-only because the subscription")) {
    return "This workspace is read-only because the subscription is suspended or expired. Existing records remain readable and exportable.";
  }
  if (value.includes("does not include the")) {
    return message;
  }
  if (value.includes("user limit for this plan")) {
    return "This plan's user limit has been reached. Upgrade the plan to add more members.";
  }
  if (value.includes("facility limit for this plan")) {
    return "This plan's facility limit has been reached. Upgrade the plan to add more facilities.";
  }
  if (value.includes("duplicate key") && value.includes("slug")) {
    return "That URL slug is already in use. Choose another one.";
  }
  if (value.includes("duplicate key")) {
    return "A matching record already exists.";
  }
  if (value.includes("not authorised to approve")) {
    return "Only an authorised reviewer can approve campaigns.";
  }
  if (value.includes("illegal campaign status transition")) {
    return "That campaign status change is not allowed.";
  }
  if (value.includes("illegal scholarship application transition")) {
    return "That application status change is not allowed.";
  }
  if (value.includes("illegal scholarship award transition")) {
    return "That award status change is not allowed.";
  }
  if (value.includes("append-only")) {
    return "This record is append-only. Record a new entry instead.";
  }
  if (value.includes("can no longer be changed")) {
    return "This application can no longer be edited.";
  }
  if (value.includes("already checked out")) {
    return "That slug is already in use.";
  }
  return "The change could not be saved. Check the details and try again.";
}

function friendlyError(error: unknown): CharityActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission for this action." };
  }
  console.error("[charity] action failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return { ok: false, message: "Something went wrong. Try again shortly." };
}

function revalidateCharity() {
  revalidatePath("/dashboard/charity");
  revalidatePath("/dashboard/charity/campaigns");
  revalidatePath("/dashboard/charity/scholarships");
  revalidatePath("/dashboard/charity/donations");
  revalidatePath("/dashboard/charity/reports");
  revalidatePath("/charity");
}

async function requireCharityAction(
  organisationId: string,
  permission:
    | "charity_campaign_manage"
    | "charity_campaign_approve"
    | "donor_report_view"
    | "scholarship_manage"
    | "scholarship_review",
): Promise<{ user: CurrentUser; workspace: CharityWorkspace }> {
  const user = await requireUser();
  const workspaces = await listCharityWorkspaces(user);
  const workspace = workspaces.find(
    (item) => item.organisationId === organisationId,
  );
  if (!workspace) {
    throw new AuthorisationError("Not a charity workspace", "FORBIDDEN");
  }
  await assertCharityPermission(user, organisationId, permission);
  return { user, workspace };
}

// Campaigns --------------------------------------------------------------------

export async function saveCampaignAction(input: {
  organisationId: string;
  campaignId?: string;
  title: string;
  slug?: string;
  purpose: string;
  description?: string;
  beneficiaryCriteria?: string;
  fundingTarget: string;
  currency: string;
  startsOn: string;
  endsOn?: string;
  isPublic: boolean;
  sponsorshipOptions?: string;
  supportingDocuments?: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_manage",
    );
    const parsed = campaignSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const fundingTarget = parseMoney(data.fundingTarget);
    if (fundingTarget === null) {
      return {
        ok: false,
        message: "Enter a valid funding target.",
        fieldErrors: { fundingTarget: ["Enter a valid funding target."] },
      };
    }

    const slug = data.slug?.trim() || slugify(data.title);
    if (!slug) {
      return {
        ok: false,
        message: "Enter a URL slug.",
        fieldErrors: { slug: ["Enter a URL slug."] },
      };
    }

    const supabase = await createClient();
    const payload = {
      organisation_id: input.organisationId,
      slug,
      title: data.title,
      purpose: data.purpose,
      description: data.description || null,
      beneficiary_criteria: data.beneficiaryCriteria || null,
      funding_target_minor_units: fundingTarget,
      currency: data.currency.toUpperCase(),
      starts_on: data.startsOn,
      ends_on: data.endsOn,
      is_public: data.isPublic,
      sponsorship_options: lines(data.sponsorshipOptions),
      supporting_documents: lines(data.supportingDocuments),
      created_by: user.id,
    };

    let campaignId = data.campaignId;
    if (campaignId) {
      const { error } = await supabase
        .from("charity_campaigns")
        .update(payload)
        .eq("id", campaignId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("charity_campaigns")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      campaignId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.campaign.saved",
      entityType: "charity_campaign",
      entityId: campaignId,
      metadata: { title: data.title, slug },
    });
    revalidateCharity();
    revalidatePath(`/dashboard/charity/campaigns/${campaignId}`);
    return {
      ok: true,
      message: "Campaign saved.",
      id: campaignId,
      redirectTo: `/dashboard/charity/campaigns/${campaignId}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function submitCampaignForApprovalAction(input: {
  organisationId: string;
  campaignId: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_manage",
    );
    const supabase = await createClient();
    const { error } = await supabase
      .from("charity_campaigns")
      .update({ status: "pending_approval" })
      .eq("id", input.campaignId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.campaign.submitted",
      entityType: "charity_campaign",
      entityId: input.campaignId,
    });
    revalidateCharity();
    revalidatePath(`/dashboard/charity/campaigns/${input.campaignId}`);
    return { ok: true, message: "Campaign submitted for approval." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewCampaignAction(input: {
  organisationId: string;
  campaignId: string;
  decision: "approved" | "rejected" | "changes_requested";
  notes: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_approve",
    );
    const parsed = campaignReviewSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const nextStatus =
      data.decision === "approved"
        ? "approved"
        : data.decision === "rejected"
          ? "rejected"
          : "draft";

    const supabase = await createClient();
    const { error } = await supabase
      .from("charity_campaigns")
      .update({ status: nextStatus })
      .eq("id", data.campaignId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    const { error: reviewError } = await supabase
      .from("campaign_reviews")
      .insert({
        organisation_id: input.organisationId,
        campaign_id: data.campaignId,
        reviewer_id: user.id,
        decision: data.decision,
        notes: data.notes,
      });
    if (reviewError) {
      return { ok: false, message: friendlyDbMessage(reviewError.message) };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.campaign.reviewed",
      entityType: "charity_campaign",
      entityId: data.campaignId,
      metadata: { decision: data.decision },
    });
    revalidateCharity();
    revalidatePath(`/dashboard/charity/campaigns/${data.campaignId}`);
    return {
      ok: true,
      message:
        data.decision === "approved"
          ? "Campaign approved and published."
          : data.decision === "rejected"
            ? "Campaign rejected."
            : "Changes requested; the campaign is back in draft.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordCampaignAllocationAction(input: {
  organisationId: string;
  campaignId: string;
  allocationType: "allocation" | "release";
  category: string;
  amount: string;
  notes?: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_manage",
    );
    const parsed = campaignAllocationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("campaign_allocations").insert({
      organisation_id: input.organisationId,
      campaign_id: data.campaignId,
      allocation_type: data.allocationType,
      category: data.category,
      amount_minor_units: amount,
      notes: data.notes || null,
      allocated_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.allocation.recorded",
      entityType: "campaign_allocation",
      entityId: data.campaignId,
      metadata: { amount, type: data.allocationType },
    });
    revalidatePath(`/dashboard/charity/campaigns/${data.campaignId}`);
    revalidateCharity();
    return { ok: true, message: "Allocation recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordCampaignExpenseAction(input: {
  organisationId: string;
  campaignId: string;
  category: string;
  description?: string;
  amount: string;
  incurredOn: string;
  payee?: string;
  receiptReference?: string;
  status: "pending" | "approved" | "paid" | "void";
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_manage",
    );
    const parsed = campaignExpenseSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("campaign_expenses").insert({
      organisation_id: input.organisationId,
      campaign_id: data.campaignId,
      category: data.category,
      description: data.description || null,
      amount_minor_units: amount,
      incurred_on: data.incurredOn,
      payee: data.payee || null,
      receipt_reference: data.receiptReference || null,
      status: data.status,
      recorded_by: user.id,
    });
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.expense.recorded",
      entityType: "campaign_expense",
      entityId: data.campaignId,
      metadata: { amount, status: data.status },
    });
    revalidatePath(`/dashboard/charity/campaigns/${data.campaignId}`);
    revalidateCharity();
    return { ok: true, message: "Campaign expense recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Donations --------------------------------------------------------------------

export async function startDonationAction(input: {
  campaignId: string;
  amount: string;
  publicAcknowledgement: boolean;
  donorDisplayName?: string;
  message?: string;
}): Promise<CharityActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        ok: false,
        message: "Sign in to donate.",
        redirectTo: `/login?redirectTo=${encodeURIComponent(`/charity`)}`,
      };
    }

    const parsed = donationCheckoutSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid donation amount.",
        fieldErrors: { amount: ["Enter a valid donation amount."] },
      };
    }

    const result = await createDonationCheckout(user, {
      campaignId: data.campaignId,
      amountMinorUnits: amount,
      publicAcknowledgement: data.publicAcknowledgement,
      donorDisplayName: data.donorDisplayName,
      message: data.message,
    });

    if (!result.ok) return result;

    await recordAudit({
      actorId: user.id,
      action: "charity.donation.started",
      entityType: "charity_campaign",
      entityId: data.campaignId,
      metadata: { reference: result.reference, amount },
    });

    return {
      ok: true,
      message: "Redirecting to secure checkout…",
      redirectTo: result.authorizationUrl,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function updateDonationPreferenceAction(input: {
  donationId: string;
  publicAcknowledgement: boolean;
  donorDisplayName?: string;
  message?: string;
}): Promise<CharityActionResult> {
  try {
    const user = await requireUser();
    const parsed = donationPreferenceSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("donations")
      .update({
        is_public: data.publicAcknowledgement,
        donor_display_name: data.donorDisplayName || null,
        message: data.message || null,
      })
      .eq("id", data.donationId)
      .eq("donor_id", user.id);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      action: "charity.donation.preference_saved",
      entityType: "donation",
      entityId: data.donationId,
      metadata: { public: data.publicAcknowledgement },
    });
    revalidatePath("/dashboard/charity/donations");
    revalidateCharity();
    return { ok: true, message: "Acknowledgement preference saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Scholarships -----------------------------------------------------------------

export async function saveScholarshipProgrammeAction(input: {
  organisationId: string;
  programmeId?: string;
  name: string;
  slug?: string;
  description?: string;
  eligibility: string;
  coverage: "full" | "partial";
  maxAward: string;
  currency: string;
  courseId?: string;
  opensOn: string;
  closesOn?: string;
  status: "draft" | "open" | "closed" | "archived";
  isPublic: boolean;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "scholarship_manage",
    );
    const parsed = scholarshipProgrammeSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const maxAward = parseMoney(data.maxAward);
    if (maxAward === null) {
      return {
        ok: false,
        message: "Enter a valid maximum award.",
        fieldErrors: { maxAward: ["Enter a valid maximum award."] },
      };
    }

    const slug = data.slug?.trim() || slugify(data.name);
    if (!slug) {
      return {
        ok: false,
        message: "Enter a URL slug.",
        fieldErrors: { slug: ["Enter a URL slug."] },
      };
    }

    const supabase = await createClient();
    const payload = {
      organisation_id: input.organisationId,
      slug,
      name: data.name,
      description: data.description || null,
      eligibility: data.eligibility,
      coverage: data.coverage,
      max_award_minor_units: maxAward,
      currency: data.currency.toUpperCase(),
      course_id: data.courseId,
      opens_on: data.opensOn,
      closes_on: data.closesOn,
      status: data.status,
      is_public: data.isPublic,
      created_by: user.id,
    };

    let programmeId = data.programmeId;
    if (programmeId) {
      const { error } = await supabase
        .from("scholarship_programmes")
        .update(payload)
        .eq("id", programmeId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("scholarship_programmes")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      programmeId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.scholarship.programme_saved",
      entityType: "scholarship_programme",
      entityId: programmeId,
      metadata: { name: data.name, status: data.status },
    });
    revalidatePath("/dashboard/charity/scholarships");
    revalidatePath(`/dashboard/charity/scholarships/${programmeId}`);
    revalidateCharity();
    return {
      ok: true,
      message: "Scholarship programme saved.",
      id: programmeId,
      redirectTo: `/dashboard/charity/scholarships/${programmeId}`,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function applyToProgrammeAction(input: {
  programmeId: string;
  statement: string;
  evidenceReferences?: string;
}): Promise<CharityActionResult> {
  try {
    const user = await requireUser();
    const parsed = scholarshipApplicationSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { data: programme } = await supabase
      .from("scholarship_programmes")
      .select("id, organisation_id, status")
      .eq("id", data.programmeId)
      .maybeSingle();

    if (!programme || programme.status !== "open") {
      return { ok: false, message: "This scholarship programme is not open." };
    }

    const { data: inserted, error } = await supabase
      .from("scholarship_applications")
      .insert({
        organisation_id: programme.organisation_id,
        programme_id: data.programmeId,
        applicant_id: user.id,
        statement: data.statement,
        evidence_references: lines(data.evidenceReferences),
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    await recordAudit({
      actorId: user.id,
      action: "charity.scholarship.applied",
      entityType: "scholarship_application",
      entityId: inserted.id,
      metadata: { programmeId: data.programmeId },
    });
    revalidatePath("/dashboard/charity");
    revalidatePath("/dashboard/charity/scholarships");
    return { ok: true, message: "Scholarship application submitted." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function reviewScholarshipApplicationAction(input: {
  organisationId: string;
  applicationId: string;
  status: "under_review" | "shortlisted" | "approved" | "rejected" | "withdrawn";
  notes?: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "scholarship_review",
    );
    const parsed = scholarshipReviewSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("scholarship_applications")
      .update({
        status: data.status,
        decision_notes: data.notes || null,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.applicationId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.scholarship.reviewed",
      entityType: "scholarship_application",
      entityId: data.applicationId,
      metadata: { status: data.status },
    });
    revalidatePath("/dashboard/charity/scholarships");
    revalidateCharity();
    return { ok: true, message: `Application marked ${data.status.replaceAll("_", " ")}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function createScholarshipAwardAction(input: {
  organisationId: string;
  applicationId: string;
  amount: string;
  coverage: "full" | "partial";
  courseId?: string;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "scholarship_manage",
    );
    const parsed = scholarshipAwardSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const amount = parseMoney(data.amount);
    if (amount === null) {
      return {
        ok: false,
        message: "Enter a valid award amount.",
        fieldErrors: { amount: ["Enter a valid award amount."] },
      };
    }

    const supabase = await createClient();
    const { data: application } = await supabase
      .from("scholarship_applications")
      .select("id, programme_id, applicant_id, status")
      .eq("id", data.applicationId)
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!application) {
      return { ok: false, message: "Application not found." };
    }
    if (!["shortlisted", "approved", "under_review"].includes(application.status)) {
      return {
        ok: false,
        message: "Shortlist or approve the application before awarding it.",
      };
    }

    const { data: programme } = await supabase
      .from("scholarship_programmes")
      .select("max_award_minor_units")
      .eq("id", application.programme_id)
      .maybeSingle();

    if (
      programme &&
      amount > Number(programme.max_award_minor_units)
    ) {
      return {
        ok: false,
        message: "The award is above the programme maximum.",
        fieldErrors: { amount: ["The award is above the programme maximum."] },
      };
    }

    const { data: inserted, error } = await supabase
      .from("scholarship_awards")
      .insert({
        organisation_id: input.organisationId,
        application_id: application.id,
        programme_id: application.programme_id,
        applicant_id: application.applicant_id,
        amount_minor_units: amount,
        coverage: data.coverage,
        course_id: data.courseId,
        status: "awarded",
        awarded_by: user.id,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.scholarship.awarded",
      entityType: "scholarship_award",
      entityId: inserted.id,
      metadata: { amount, applicationId: application.id },
    });
    revalidatePath("/dashboard/charity/scholarships");
    revalidateCharity();
    return { ok: true, message: "Scholarship awarded.", id: inserted.id };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function respondToScholarshipAwardAction(input: {
  awardId: string;
  decision: "accepted" | "declined";
}): Promise<CharityActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase
      .from("scholarship_awards")
      .update({
        status: input.decision === "accepted" ? "accepted" : "withdrawn",
      })
      .eq("id", input.awardId)
      .eq("applicant_id", user.id)
      .eq("status", "awarded");
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    revalidatePath("/dashboard/charity");
    revalidatePath("/dashboard/charity/scholarships");
    return {
      ok: true,
      message:
        input.decision === "accepted"
          ? "Award accepted. Your course access will be set up."
          : "Award declined.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function updateScholarshipAwardStatusAction(input: {
  organisationId: string;
  awardId: string;
  status: "awarded" | "accepted" | "active" | "completed" | "withdrawn" | "revoked";
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "scholarship_manage",
    );
    const parsed = scholarshipAwardStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("scholarship_awards")
      .update({ status: data.status })
      .eq("id", data.awardId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.scholarship.award_status_changed",
      entityType: "scholarship_award",
      entityId: data.awardId,
      metadata: { status: data.status },
    });
    revalidatePath("/dashboard/charity/scholarships");
    revalidateCharity();
    return { ok: true, message: `Award marked ${data.status}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function recordScholarshipOutcomeAction(input: {
  organisationId: string;
  awardId: string;
  completionOutcome?: string;
  internshipOutcome?: string;
  employmentOutcome?: string;
  outcomeShareable: boolean;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "scholarship_manage",
    );
    const parsed = scholarshipOutcomeSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("scholarship_awards")
      .update({
        completion_outcome: data.completionOutcome || null,
        internship_outcome: data.internshipOutcome || null,
        employment_outcome: data.employmentOutcome || null,
        outcome_shareable: data.outcomeShareable,
      })
      .eq("id", data.awardId)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: friendlyDbMessage(error.message) };

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.scholarship.outcome_recorded",
      entityType: "scholarship_award",
      entityId: data.awardId,
    });
    revalidatePath("/dashboard/charity/scholarships");
    revalidateCharity();
    return { ok: true, message: "Scholarship outcome recorded." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Impact reports ---------------------------------------------------------------

export async function saveImpactReportAction(input: {
  organisationId: string;
  campaignId: string;
  reportId?: string;
  title: string;
  summary: string;
  metrics?: string;
  isPublished: boolean;
}): Promise<CharityActionResult> {
  try {
    const { user } = await requireCharityAction(
      input.organisationId,
      "charity_campaign_manage",
    );
    const parsed = impactReportSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const data = parsed.data;

    let metrics: Json = {};
    if (data.metrics?.trim()) {
      try {
        metrics = JSON.parse(data.metrics) as Json;
      } catch {
        metrics = { notes: data.metrics.trim() };
      }
    }

    const supabase = await createClient();
    const payload = {
      organisation_id: input.organisationId,
      campaign_id: data.campaignId,
      title: data.title,
      summary: data.summary,
      metrics,
      is_published: data.isPublished,
      created_by: user.id,
    };

    let reportId = data.reportId;
    if (reportId) {
      const { error } = await supabase
        .from("impact_reports")
        .update(payload)
        .eq("id", reportId)
        .eq("organisation_id", input.organisationId);
      if (error) return { ok: false, message: friendlyDbMessage(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("impact_reports")
        .insert(payload)
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, message: friendlyDbMessage(error?.message ?? "") };
      }
      reportId = inserted.id;
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "charity.impact.saved",
      entityType: "impact_report",
      entityId: reportId,
      metadata: { published: data.isPublished },
    });
    revalidatePath(`/dashboard/charity/campaigns/${data.campaignId}`);
    revalidatePath("/dashboard/charity/impact");
    revalidateCharity();
    return {
      ok: true,
      message: data.isPublished ? "Impact report published." : "Impact report saved as a draft.",
      id: reportId,
    };
  } catch (error) {
    return friendlyError(error);
  }
}
