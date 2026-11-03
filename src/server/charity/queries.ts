import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CharityWorkspace } from "@/server/charity/access";
import type {
  CampaignAllocationType,
  CampaignExpenseStatus,
  CampaignReviewDecision,
  CharityCampaignStatus,
  DonationStatus,
  ScholarshipApplicationStatus,
  ScholarshipAwardStatus,
  ScholarshipCoverage,
  ScholarshipProgrammeStatus,
} from "@/types/database";

export type PublicCampaign = {
  campaignId: string;
  slug: string;
  title: string;
  purpose: string;
  description: string | null;
  fundingTargetMinorUnits: number;
  currency: string;
  startsOn: string;
  endsOn: string | null;
  receivedMinorUnits: number;
  donationCount: number;
  progressPercent: number;
};

function mapPublicCampaign(row: {
  campaign_id: string | null;
  slug: string | null;
  title: string | null;
  purpose: string | null;
  description: string | null;
  funding_target_minor_units: number | null;
  currency: string | null;
  starts_on: string | null;
  ends_on: string | null;
  received_minor_units: number | null;
  donation_count: number | null;
  progress_percent: number | null;
}): PublicCampaign {
  return {
    campaignId: row.campaign_id ?? "",
    slug: row.slug ?? "",
    title: row.title ?? "Campaign",
    purpose: row.purpose ?? "",
    description: row.description,
    fundingTargetMinorUnits: Number(row.funding_target_minor_units ?? 0),
    currency: row.currency ?? "NGN",
    startsOn: row.starts_on ?? "",
    endsOn: row.ends_on,
    receivedMinorUnits: Number(row.received_minor_units ?? 0),
    donationCount: Number(row.donation_count ?? 0),
    progressPercent: Number(row.progress_percent ?? 0),
  };
}

export async function listPublicCampaigns(limit = 12): Promise<PublicCampaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charity_public_campaign_progress")
    .select(
      "campaign_id, slug, title, purpose, description, funding_target_minor_units, currency, starts_on, ends_on, received_minor_units, donation_count, progress_percent",
    )
    .order("starts_on", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapPublicCampaign);
}

export type PublicCampaignDetail = {
  campaign: PublicCampaign;
  donors: {
    displayName: string;
    amountMinorUnits: number;
    createdAt: string;
  }[];
  impactReports: {
    id: string;
    title: string;
    summary: string | null;
    metrics: Record<string, unknown>;
    publishedAt: string | null;
  }[];
};

export async function getPublicCampaign(
  slug: string,
): Promise<PublicCampaignDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charity_public_campaign_progress")
    .select(
      "campaign_id, slug, title, purpose, description, funding_target_minor_units, currency, starts_on, ends_on, received_minor_units, donation_count, progress_percent",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const campaign = mapPublicCampaign(data);
  const [donors, reports] = await Promise.all([
    supabase
      .from("charity_public_donors")
      .select("display_name, amount_minor_units, created_at")
      .eq("campaign_id", campaign.campaignId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("impact_reports")
      .select("id, title, summary, metrics, published_at")
      .eq("campaign_id", campaign.campaignId)
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
  ]);

  return {
    campaign,
    donors: (donors.data ?? []).map((row) => ({
      displayName: row.display_name ?? "Supporter",
      amountMinorUnits: Number(row.amount_minor_units ?? 0),
      createdAt: row.created_at ?? "",
    })),
    impactReports: (reports.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      metrics: (row.metrics ?? {}) as Record<string, unknown>,
      publishedAt: row.published_at,
    })),
  };
}

// Donor data -------------------------------------------------------------------

export type MyDonation = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignSlug: string | null;
  amountMinorUnits: number;
  refundedAmountMinorUnits: number;
  currency: string;
  status: DonationStatus;
  isPublic: boolean;
  donorDisplayName: string | null;
  message: string | null;
  receiptReference: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function listMyDonations(userId: string): Promise<MyDonation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, campaign_id, amount_minor_units, refunded_amount_minor_units, currency, status, is_public, donor_display_name, message, receipt_reference, created_at, paid_at",
    )
    .eq("donor_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const campaignIds = Array.from(new Set(data.map((row) => row.campaign_id)));
  const { data: campaigns } = await supabase
    .from("charity_campaigns")
    .select("id, title, slug")
    .in("id", campaignIds);
  const campaignMap = new Map((campaigns ?? []).map((row) => [row.id, row]));

  return data.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    campaignTitle: campaignMap.get(row.campaign_id)?.title ?? "Campaign",
    campaignSlug: campaignMap.get(row.campaign_id)?.slug ?? null,
    amountMinorUnits: Number(row.amount_minor_units),
    refundedAmountMinorUnits: Number(row.refunded_amount_minor_units),
    currency: row.currency,
    status: row.status as DonationStatus,
    isPublic: row.is_public,
    donorDisplayName: row.donor_display_name,
    message: row.message,
    receiptReference: row.receipt_reference,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }));
}

export type MyScholarshipApplication = {
  id: string;
  programmeId: string;
  programmeName: string;
  status: ScholarshipApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  decisionNotes: string | null;
};

export type MyScholarshipAward = {
  id: string;
  programmeId: string;
  programmeName: string;
  amountMinorUnits: number;
  currency: string;
  coverage: ScholarshipCoverage;
  status: ScholarshipAwardStatus;
  courseId: string | null;
  awardedAt: string;
  completionOutcome: string | null;
};

export async function listMyScholarships(userId: string): Promise<{
  applications: MyScholarshipApplication[];
  awards: MyScholarshipAward[];
}> {
  const supabase = await createClient();
  const [{ data: applications }, { data: awards }] = await Promise.all([
    supabase
      .from("scholarship_applications")
      .select(
        "id, programme_id, status, created_at, reviewed_at, decision_notes",
      )
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("scholarship_awards")
      .select(
        "id, programme_id, amount_minor_units, currency, coverage, status, course_id, awarded_at, completion_outcome",
      )
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const programmeIds = Array.from(
    new Set([
      ...(applications ?? []).map((row) => row.programme_id),
      ...(awards ?? []).map((row) => row.programme_id),
    ]),
  );
  const { data: programmes } = programmeIds.length
    ? await supabase
        .from("scholarship_programmes")
        .select("id, name")
        .in("id", programmeIds)
    : { data: [] as { id: string; name: string }[] };
  const nameMap = new Map((programmes ?? []).map((row) => [row.id, row.name]));

  return {
    applications: (applications ?? []).map((row) => ({
      id: row.id,
      programmeId: row.programme_id,
      programmeName: nameMap.get(row.programme_id) ?? "Programme",
      status: row.status as ScholarshipApplicationStatus,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      decisionNotes: row.decision_notes,
    })),
    awards: (awards ?? []).map((row) => ({
      id: row.id,
      programmeId: row.programme_id,
      programmeName: nameMap.get(row.programme_id) ?? "Programme",
      amountMinorUnits: Number(row.amount_minor_units),
      currency: row.currency,
      coverage: row.coverage as ScholarshipCoverage,
      status: row.status as ScholarshipAwardStatus,
      courseId: row.course_id,
      awardedAt: row.awarded_at,
      completionOutcome: row.completion_outcome,
    })),
  };
}

export async function listOpenScholarshipProgrammes(): Promise<
  {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    eligibility: string | null;
    coverage: ScholarshipCoverage;
    maxAwardMinorUnits: number;
    currency: string;
    closesOn: string | null;
    courseId: string | null;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scholarship_programmes")
    .select(
      "id, name, slug, description, eligibility, coverage, max_award_minor_units, currency, closes_on, course_id",
    )
    .eq("status", "open")
    .eq("is_public", true)
    .order("closes_on", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    eligibility: row.eligibility,
    coverage: row.coverage as ScholarshipCoverage,
    maxAwardMinorUnits: Number(row.max_award_minor_units),
    currency: row.currency,
    closesOn: row.closes_on,
    courseId: row.course_id,
  }));
}

// Admin data -------------------------------------------------------------------

export type CampaignListItem = {
  id: string;
  slug: string;
  title: string;
  purpose: string;
  status: CharityCampaignStatus;
  fundingTargetMinorUnits: number;
  currency: string;
  receivedMinorUnits: number;
  committedMinorUnits: number;
  disbursedMinorUnits: number;
  startsOn: string;
  endsOn: string | null;
  isPublic: boolean;
  createdAt: string;
};

export async function listCampaigns(
  workspace: CharityWorkspace,
): Promise<CampaignListItem[]> {
  const supabase = await createClient();
  const [{ data: campaigns, error }, { data: finance }] = await Promise.all([
    supabase
      .from("charity_campaigns")
      .select(
        "id, slug, title, purpose, status, funding_target_minor_units, currency, starts_on, ends_on, is_public, created_at",
      )
      .eq("organisation_id", workspace.organisationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("charity_campaign_finance")
      .select(
        "campaign_id, received_minor_units, committed_minor_units, disbursed_minor_units",
      )
      .eq("organisation_id", workspace.organisationId),
  ]);

  if (error || !campaigns) return [];
  const financeMap = new Map((finance ?? []).map((row) => [row.campaign_id, row]));

  return campaigns.map((row) => {
    const money = financeMap.get(row.id);
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      purpose: row.purpose,
      status: row.status as CharityCampaignStatus,
      fundingTargetMinorUnits: Number(row.funding_target_minor_units),
      currency: row.currency,
      receivedMinorUnits: Number(money?.received_minor_units ?? 0),
      committedMinorUnits: Number(money?.committed_minor_units ?? 0),
      disbursedMinorUnits: Number(money?.disbursed_minor_units ?? 0),
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      isPublic: row.is_public,
      createdAt: row.created_at,
    };
  });
}

export type CampaignDetail = {
  campaign: CampaignListItem & {
    description: string | null;
    beneficiaryCriteria: string | null;
    currency: string;
    sponsorshipOptions: unknown;
    supportingDocuments: unknown;
    publishedAt: string | null;
    approvedAt: string | null;
  };
  reviews: {
    id: string;
    decision: CampaignReviewDecision;
    notes: string | null;
    createdAt: string;
  }[];
  donations: {
    id: string;
    donorLabel: string;
    amountMinorUnits: number;
    refundedAmountMinorUnits: number;
    status: DonationStatus;
    isPublic: boolean;
    receiptReference: string | null;
    createdAt: string;
  }[];
  allocations: {
    id: string;
    allocationType: CampaignAllocationType;
    category: string;
    amountMinorUnits: number;
    notes: string | null;
    createdAt: string;
  }[];
  expenses: {
    id: string;
    category: string;
    description: string | null;
    amountMinorUnits: number;
    incurredOn: string;
    payee: string | null;
    status: CampaignExpenseStatus;
    receiptReference: string | null;
  }[];
  impactReports: {
    id: string;
    title: string;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
  }[];
};

export async function getCampaignDetail(
  workspace: CharityWorkspace,
  campaignId: string,
): Promise<CampaignDetail | null> {
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("charity_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !campaign) return null;

  const [finance, reviews, donations, allocations, expenses, reports] =
    await Promise.all([
      supabase
        .from("charity_campaign_finance")
        .select("received_minor_units, committed_minor_units, disbursed_minor_units")
        .eq("campaign_id", campaignId)
        .maybeSingle(),
      supabase
        .from("campaign_reviews")
        .select("id, decision, notes, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false }),
      supabase
        .from("donations")
        .select(
          "id, donor_display_name, amount_minor_units, refunded_amount_minor_units, status, is_public, receipt_reference, created_at",
        )
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("campaign_allocations")
        .select("id, allocation_type, category, amount_minor_units, notes, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false }),
      supabase
        .from("campaign_expenses")
        .select(
          "id, category, description, amount_minor_units, incurred_on, payee, status, receipt_reference",
        )
        .eq("campaign_id", campaignId)
        .order("incurred_on", { ascending: false }),
      supabase
        .from("impact_reports")
        .select("id, title, is_published, published_at, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      purpose: campaign.purpose,
      status: campaign.status as CharityCampaignStatus,
      fundingTargetMinorUnits: Number(campaign.funding_target_minor_units),
      receivedMinorUnits: Number(finance.data?.received_minor_units ?? 0),
      committedMinorUnits: Number(finance.data?.committed_minor_units ?? 0),
      disbursedMinorUnits: Number(finance.data?.disbursed_minor_units ?? 0),
      startsOn: campaign.starts_on,
      endsOn: campaign.ends_on,
      isPublic: campaign.is_public,
      createdAt: campaign.created_at,
      description: campaign.description,
      beneficiaryCriteria: campaign.beneficiary_criteria,
      currency: campaign.currency,
      sponsorshipOptions: campaign.sponsorship_options,
      supportingDocuments: campaign.supporting_documents,
      publishedAt: campaign.published_at,
      approvedAt: campaign.approved_at,
    },
    reviews: (reviews.data ?? []).map((row) => ({
      id: row.id,
      decision: row.decision as CampaignReviewDecision,
      notes: row.notes,
      createdAt: row.created_at,
    })),
    donations: (donations.data ?? []).map((row) => ({
      id: row.id,
      donorLabel: row.donor_display_name ?? "Supporter",
      amountMinorUnits: Number(row.amount_minor_units),
      refundedAmountMinorUnits: Number(row.refunded_amount_minor_units),
      status: row.status as DonationStatus,
      isPublic: row.is_public,
      receiptReference: row.receipt_reference,
      createdAt: row.created_at,
    })),
    allocations: (allocations.data ?? []).map((row) => ({
      id: row.id,
      allocationType: row.allocation_type as CampaignAllocationType,
      category: row.category,
      amountMinorUnits: Number(row.amount_minor_units),
      notes: row.notes,
      createdAt: row.created_at,
    })),
    expenses: (expenses.data ?? []).map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      amountMinorUnits: Number(row.amount_minor_units),
      incurredOn: row.incurred_on,
      payee: row.payee,
      status: row.status as CampaignExpenseStatus,
      receiptReference: row.receipt_reference,
    })),
    impactReports: (reports.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      isPublished: row.is_published,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    })),
  };
}

export type ProgrammeListItem = {
  id: string;
  name: string;
  slug: string;
  status: ScholarshipProgrammeStatus;
  coverage: ScholarshipCoverage;
  maxAwardMinorUnits: number;
  currency: string;
  opensOn: string;
  closesOn: string | null;
  applicantCount: number;
  awardedCount: number;
  awardedMinorUnits: number;
};

export async function listProgrammes(
  workspace: CharityWorkspace,
): Promise<ProgrammeListItem[]> {
  const supabase = await createClient();
  const [{ data: programmes, error }, { data: applications }, { data: awards }] =
    await Promise.all([
      supabase
        .from("scholarship_programmes")
        .select(
          "id, name, slug, status, coverage, max_award_minor_units, currency, opens_on, closes_on",
        )
        .eq("organisation_id", workspace.organisationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("scholarship_applications")
        .select("programme_id")
        .eq("organisation_id", workspace.organisationId),
      supabase
        .from("scholarship_awards")
        .select("programme_id, amount_minor_units")
        .eq("organisation_id", workspace.organisationId),
    ]);

  if (error || !programmes) return [];

  return programmes.map((programme) => {
    const programmeAwards = (awards ?? []).filter(
      (row) => row.programme_id === programme.id,
    );
    return {
      id: programme.id,
      name: programme.name,
      slug: programme.slug,
      status: programme.status as ScholarshipProgrammeStatus,
      coverage: programme.coverage as ScholarshipCoverage,
      maxAwardMinorUnits: Number(programme.max_award_minor_units),
      currency: programme.currency,
      opensOn: programme.opens_on,
      closesOn: programme.closes_on,
      applicantCount: (applications ?? []).filter(
        (row) => row.programme_id === programme.id,
      ).length,
      awardedCount: programmeAwards.length,
      awardedMinorUnits: programmeAwards.reduce(
        (sum, row) => sum + Number(row.amount_minor_units),
        0,
      ),
    };
  });
}

export type ProgrammeDetail = {
  programme: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    eligibility: string;
    coverage: ScholarshipCoverage;
    maxAwardMinorUnits: number;
    currency: string;
    courseId: string | null;
    opensOn: string;
    closesOn: string | null;
    status: ScholarshipProgrammeStatus;
    isPublic: boolean;
  };
  applications: {
    id: string;
    applicantId: string;
    applicantName: string | null;
    applicantEmail: string | null;
    statement: string;
    evidenceReferences: unknown;
    status: ScholarshipApplicationStatus;
    createdAt: string;
    reviewedAt: string | null;
    decisionNotes: string | null;
    award: {
      id: string;
      amountMinorUnits: number;
      status: ScholarshipAwardStatus;
      courseId: string | null;
    } | null;
  }[];
  awards: {
    id: string;
    applicationId: string;
    applicantId: string;
    applicantName: string | null;
    amountMinorUnits: number;
    currency: string;
    coverage: ScholarshipCoverage;
    status: ScholarshipAwardStatus;
    courseId: string | null;
    awardedAt: string;
    acceptedAt: string | null;
    completionOutcome: string | null;
    internshipOutcome: string | null;
    employmentOutcome: string | null;
    outcomeShareable: boolean;
  }[];
};

export async function getProgrammeDetail(
  workspace: CharityWorkspace,
  programmeId: string,
): Promise<ProgrammeDetail | null> {
  const supabase = await createClient();
  const { data: programme, error } = await supabase
    .from("scholarship_programmes")
    .select("*")
    .eq("id", programmeId)
    .eq("organisation_id", workspace.organisationId)
    .maybeSingle();

  if (error || !programme) return null;

  const [{ data: applications }, { data: awards }] = await Promise.all([
    supabase
      .from("scholarship_applications")
      .select(
        "id, applicant_id, statement, evidence_references, status, created_at, reviewed_at, decision_notes",
      )
      .eq("programme_id", programmeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("scholarship_awards")
      .select(
        "id, application_id, applicant_id, amount_minor_units, currency, coverage, status, course_id, awarded_at, accepted_at, completion_outcome, internship_outcome, employment_outcome, outcome_shareable",
      )
      .eq("programme_id", programmeId)
      .order("created_at", { ascending: false }),
  ]);

  const applicantIds = Array.from(
    new Set([
      ...(applications ?? []).map((row) => row.applicant_id),
      ...(awards ?? []).map((row) => row.applicant_id),
    ]),
  );

  // Applicants are usually not members of the charity workspace, so their
  // profiles are resolved with the service-role client. This function is only
  // called from university pages guarded by scholarship_review/manage.
  const admin = createAdminClient();
  const { data: profiles } = admin && applicantIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", applicantIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row]));

  const awardByApplication = new Map(
    (awards ?? []).map((row) => [row.application_id, row]),
  );

  return {
    programme: {
      id: programme.id,
      name: programme.name,
      slug: programme.slug,
      description: programme.description,
      eligibility: programme.eligibility ?? "",
      coverage: programme.coverage as ScholarshipCoverage,
      maxAwardMinorUnits: Number(programme.max_award_minor_units),
      currency: programme.currency,
      courseId: programme.course_id,
      opensOn: programme.opens_on,
      closesOn: programme.closes_on,
      status: programme.status as ScholarshipProgrammeStatus,
      isPublic: programme.is_public,
    },
    applications: (applications ?? []).map((row) => {
      const profile = profileMap.get(row.applicant_id);
      const award = awardByApplication.get(row.id);
      return {
        id: row.id,
        applicantId: row.applicant_id,
        applicantName: profile?.full_name ?? null,
        applicantEmail: profile?.email ?? null,
        statement: row.statement,
        evidenceReferences: row.evidence_references,
        status: row.status as ScholarshipApplicationStatus,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        decisionNotes: row.decision_notes,
        award: award
          ? {
              id: award.id,
              amountMinorUnits: Number(award.amount_minor_units),
              status: award.status as ScholarshipAwardStatus,
              courseId: award.course_id,
            }
          : null,
      };
    }),
    awards: (awards ?? []).map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      applicantId: row.applicant_id,
      applicantName: profileMap.get(row.applicant_id)?.full_name ?? null,
      amountMinorUnits: Number(row.amount_minor_units),
      currency: row.currency,
      coverage: row.coverage as ScholarshipCoverage,
      status: row.status as ScholarshipAwardStatus,
      courseId: row.course_id,
      awardedAt: row.awarded_at,
      acceptedAt: row.accepted_at,
      completionOutcome: row.completion_outcome,
      internshipOutcome: row.internship_outcome,
      employmentOutcome: row.employment_outcome,
      outcomeShareable: row.outcome_shareable,
    })),
  };
}

export type CharityAdminSummary = {
  activeCampaigns: number;
  pendingApprovals: number;
  fundingTargetMinorUnits: number;
  receivedMinorUnits: number;
  committedMinorUnits: number;
  disbursedMinorUnits: number;
  awardedMinorUnits: number;
  awardsCount: number;
  studentsSponsored: number;
  completedScholarships: number;
  pendingImpactReports: number;
  recentDonations: {
    id: string;
    campaignTitle: string;
    donorLabel: string;
    amountMinorUnits: number;
    status: DonationStatus;
    createdAt: string;
  }[];
};

export async function getCharityAdminSummary(
  workspace: CharityWorkspace,
): Promise<CharityAdminSummary> {
  const supabase = await createClient();
  const [campaigns, finance, awards, reports, donations] = await Promise.all([
    supabase
      .from("charity_campaigns")
      .select("id, status, funding_target_minor_units, title")
      .eq("organisation_id", workspace.organisationId),
    supabase
      .from("charity_campaign_finance")
      .select("received_minor_units, committed_minor_units, disbursed_minor_units")
      .eq("organisation_id", workspace.organisationId),
    supabase
      .from("scholarship_awards")
      .select("applicant_id, amount_minor_units, status")
      .eq("organisation_id", workspace.organisationId),
    supabase
      .from("impact_reports")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", workspace.organisationId)
      .eq("is_published", false),
    supabase
      .from("donations")
      .select("id, campaign_id, donor_display_name, amount_minor_units, status, created_at")
      .eq("organisation_id", workspace.organisationId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const campaignTitles = new Map(
    (campaigns.data ?? []).map((row) => [row.id, row.title]),
  );
  const awardRows = awards.data ?? [];

  return {
    activeCampaigns: (campaigns.data ?? []).filter(
      (row) => row.status === "approved",
    ).length,
    pendingApprovals: (campaigns.data ?? []).filter(
      (row) => row.status === "pending_approval",
    ).length,
    fundingTargetMinorUnits: (campaigns.data ?? []).reduce(
      (sum, row) => sum + Number(row.funding_target_minor_units),
      0,
    ),
    receivedMinorUnits: (finance.data ?? []).reduce(
      (sum, row) => sum + Number(row.received_minor_units ?? 0),
      0,
    ),
    committedMinorUnits: (finance.data ?? []).reduce(
      (sum, row) => sum + Number(row.committed_minor_units ?? 0),
      0,
    ),
    disbursedMinorUnits: (finance.data ?? []).reduce(
      (sum, row) => sum + Number(row.disbursed_minor_units ?? 0),
      0,
    ),
    awardedMinorUnits: awardRows.reduce(
      (sum, row) => sum + Number(row.amount_minor_units),
      0,
    ),
    awardsCount: awardRows.length,
    studentsSponsored: new Set(awardRows.map((row) => row.applicant_id)).size,
    completedScholarships: awardRows.filter((row) => row.status === "completed")
      .length,
    pendingImpactReports: reports.count ?? 0,
    recentDonations: (donations.data ?? []).map((row) => ({
      id: row.id,
      campaignTitle: campaignTitles.get(row.campaign_id) ?? "Campaign",
      donorLabel: row.donor_display_name ?? "Supporter",
      amountMinorUnits: Number(row.amount_minor_units),
      status: row.status as DonationStatus,
      createdAt: row.created_at,
    })),
  };
}

export type CharityDonationRow = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorLabel: string;
  amountMinorUnits: number;
  refundedAmountMinorUnits: number;
  currency: string;
  status: DonationStatus;
  isPublic: boolean;
  receiptReference: string | null;
  createdAt: string;
};

export async function listCharityDonations(
  workspace: CharityWorkspace,
): Promise<CharityDonationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, campaign_id, donor_display_name, amount_minor_units, refunded_amount_minor_units, currency, status, is_public, receipt_reference, created_at",
    )
    .eq("organisation_id", workspace.organisationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  const campaignIds = Array.from(new Set(data.map((row) => row.campaign_id)));
  const { data: campaigns } = campaignIds.length
    ? await supabase
        .from("charity_campaigns")
        .select("id, title")
        .in("id", campaignIds)
    : { data: [] as { id: string; title: string }[] };
  const titleMap = new Map((campaigns ?? []).map((row) => [row.id, row.title]));

  return data.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    campaignTitle: titleMap.get(row.campaign_id) ?? "Campaign",
    donorLabel: row.donor_display_name ?? "Supporter",
    amountMinorUnits: Number(row.amount_minor_units),
    refundedAmountMinorUnits: Number(row.refunded_amount_minor_units),
    currency: row.currency,
    status: row.status as DonationStatus,
    isPublic: row.is_public,
    receiptReference: row.receipt_reference,
    createdAt: row.created_at,
  }));
}

export async function getDonationReceipt(
  user: { id: string; isSuperAdmin: boolean },
  donationId: string,
): Promise<{
  id: string;
  receiptReference: string | null;
  amountMinorUnits: number;
  refundedAmountMinorUnits: number;
  currency: string;
  status: DonationStatus;
  createdAt: string;
  paidAt: string | null;
  campaignTitle: string;
  campaignSlug: string;
  donorLabel: string;
  isPublic: boolean;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, campaign_id, donor_id, amount_minor_units, refunded_amount_minor_units, currency, status, created_at, paid_at, receipt_reference, donor_display_name, is_public",
    )
    .eq("id", donationId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.donor_id !== user.id && !user.isSuperAdmin) {
    return null;
  }

  const { data: campaign } = await supabase
    .from("charity_campaigns")
    .select("title, slug")
    .eq("id", data.campaign_id)
    .maybeSingle();

  return {
    id: data.id,
    receiptReference: data.receipt_reference,
    amountMinorUnits: Number(data.amount_minor_units),
    refundedAmountMinorUnits: Number(data.refunded_amount_minor_units),
    currency: data.currency,
    status: data.status as DonationStatus,
    createdAt: data.created_at,
    paidAt: data.paid_at,
    campaignTitle: campaign?.title ?? "Campaign",
    campaignSlug: campaign?.slug ?? "",
    donorLabel: data.donor_display_name ?? "Donor",
    isPublic: data.is_public,
  };
}

export type CharityReports = {
  campaigns: {
    id: string;
    title: string;
    fundingTargetMinorUnits: number;
    receivedMinorUnits: number;
    committedMinorUnits: number;
    disbursedMinorUnits: number;
    currency: string;
  }[];
  outcomes: {
    programmeId: string;
    programmeName: string;
    status: ScholarshipAwardStatus;
    awardCount: number;
    awardedMinorUnits: number;
    completionsRecorded: number;
    internshipOutcomes: number;
    employmentOutcomes: number;
  }[];
};

export async function getCharityReports(
  workspace: CharityWorkspace,
): Promise<CharityReports> {
  const supabase = await createClient();
  const [finance, outcomes, programmes] = await Promise.all([
    supabase
      .from("charity_campaign_finance")
      .select(
        "campaign_id, title, currency, funding_target_minor_units, received_minor_units, committed_minor_units, disbursed_minor_units",
      )
      .eq("organisation_id", workspace.organisationId)
      .order("title"),
    supabase
      .from("charity_scholarship_outcomes")
      .select(
        "programme_id, status, award_count, awarded_minor_units, completions_recorded, internship_outcomes, employment_outcomes",
      )
      .eq("organisation_id", workspace.organisationId),
    supabase
      .from("scholarship_programmes")
      .select("id, name")
      .eq("organisation_id", workspace.organisationId),
  ]);

  const nameMap = new Map((programmes.data ?? []).map((row) => [row.id, row.name]));

  return {
    campaigns: (finance.data ?? []).map((row) => ({
      id: row.campaign_id ?? "",
      title: row.title ?? "Campaign",
      fundingTargetMinorUnits: Number(row.funding_target_minor_units ?? 0),
      receivedMinorUnits: Number(row.received_minor_units ?? 0),
      committedMinorUnits: Number(row.committed_minor_units ?? 0),
      disbursedMinorUnits: Number(row.disbursed_minor_units ?? 0),
      currency: row.currency ?? "NGN",
    })),
    outcomes: (outcomes.data ?? []).map((row) => ({
      programmeId: row.programme_id ?? "",
      programmeName: nameMap.get(row.programme_id ?? "") ?? "Programme",
      status: row.status as ScholarshipAwardStatus,
      awardCount: Number(row.award_count ?? 0),
      awardedMinorUnits: Number(row.awarded_minor_units ?? 0),
      completionsRecorded: Number(row.completions_recorded ?? 0),
      internshipOutcomes: Number(row.internship_outcomes ?? 0),
      employmentOutcomes: Number(row.employment_outcomes ?? 0),
    })),
  };
}

export async function listCourseOptions(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, title")
    .eq("status", "published")
    .order("title");
  if (error || !data) return [];
  return data;
}

export async function listImpactReports(
  workspace: CharityWorkspace,
): Promise<
  {
    id: string;
    campaignId: string;
    campaignTitle: string;
    title: string;
    summary: string | null;
    metrics: unknown;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("impact_reports")
    .select("id, campaign_id, title, summary, metrics, is_published, published_at, created_at")
    .eq("organisation_id", workspace.organisationId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const campaignIds = Array.from(new Set(data.map((row) => row.campaign_id)));
  const { data: campaigns } = campaignIds.length
    ? await supabase
        .from("charity_campaigns")
        .select("id, title")
        .in("id", campaignIds)
    : { data: [] as { id: string; title: string }[] };
  const nameMap = new Map((campaigns ?? []).map((row) => [row.id, row.title]));

  return data.map((row) => ({
    id: row.id,
    campaignId: row.campaign_id,
    campaignTitle: nameMap.get(row.campaign_id) ?? "Campaign",
    title: row.title,
    summary: row.summary,
    metrics: row.metrics,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }));
}
