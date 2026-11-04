import "server-only";

import { createClient } from "@/lib/supabase/server";
import { userHasPermission } from "@/server/auth/current-user";
import type { CurrentUser } from "@/server/auth/current-user";
import { resolveCareWorkspace } from "@/server/care/access";
import { getCareDashboard } from "@/server/care/queries";
import { resolveCharityWorkspace } from "@/server/charity/access";
import { getCharityAdminSummary, listMyDonations, listMyScholarships } from "@/server/charity/queries";
import { getReconciliationSummary } from "@/server/payments/queries";

export type CareDashboardSnapshot = {
  workspaceName: string;
  organisationId: string;
  activeResidents: number;
  onLeaveResidents: number;
  activeStaff: number;
  shiftsToday: number;
  coverageGaps: number;
  openIncidents: number;
  outstandingMinorUnits: number;
  facilities: number;
};

export async function getCareDashboardSnapshot(
  user: CurrentUser,
): Promise<CareDashboardSnapshot | null> {
  const workspace = await resolveCareWorkspace(user, {
    permission: "resident_view",
  });
  if (!workspace) return null;

  const dashboard = await getCareDashboard(workspace);
  return {
    workspaceName: workspace.name,
    organisationId: workspace.organisationId,
    activeResidents: dashboard.activeResidents,
    onLeaveResidents: dashboard.onLeaveResidents,
    activeStaff: dashboard.activeStaff,
    shiftsToday: dashboard.shiftsToday,
    coverageGaps: dashboard.coverageGaps,
    openIncidents: dashboard.openIncidents,
    outstandingMinorUnits: dashboard.outstandingMinorUnits,
    facilities: workspace.facilities.length,
  };
}

export type CharityDashboardSnapshot = {
  organisationId: string;
  workspaceName: string;
  activeCampaigns: number;
  receivedMinorUnits: number;
  committedMinorUnits: number;
  awardsCount: number;
  studentsSponsored: number;
  pendingImpactReports: number;
};

export async function getCharityDashboardSnapshot(
  user: CurrentUser,
): Promise<CharityDashboardSnapshot | null> {
  const workspace = await resolveCharityWorkspace(user);
  if (!workspace) return null;

  const summary = await getCharityAdminSummary(workspace);
  return {
    organisationId: workspace.organisationId,
    workspaceName: workspace.name,
    activeCampaigns: summary.activeCampaigns,
    receivedMinorUnits: summary.receivedMinorUnits,
    committedMinorUnits: summary.committedMinorUnits,
    awardsCount: summary.awardsCount,
    studentsSponsored: summary.studentsSponsored,
    pendingImpactReports: summary.pendingImpactReports,
  };
}

export type MyCharitySnapshot = {
  donationsCount: number;
  donatedMinorUnits: number;
  applicationsCount: number;
  awardsCount: number;
  pendingAwards: number;
};

export async function getMyCharitySnapshot(
  user: CurrentUser,
): Promise<MyCharitySnapshot> {
  const [donations, scholarships] = await Promise.all([
    listMyDonations(user.id),
    listMyScholarships(user.id),
  ]);

  return {
    donationsCount: donations.length,
    donatedMinorUnits: donations
      .filter((donation) => donation.status === "successful" || donation.status === "partially_refunded")
      .reduce(
        (sum, donation) =>
          sum + donation.amountMinorUnits - donation.refundedAmountMinorUnits,
        0,
      ),
    applicationsCount: scholarships.applications.length,
    awardsCount: scholarships.awards.length,
    pendingAwards: scholarships.awards.filter((award) => award.status === "awarded")
      .length,
  };
}

export type ReferralPartnerSnapshot = {
  code: string;
  status: string;
  approvedMinorUnits: number;
  pendingMinorUnits: number;
  inPayoutMinorUnits: number;
  paidMinorUnits: number;
};

export async function getReferralPartnerSnapshot(
  user: CurrentUser,
): Promise<ReferralPartnerSnapshot | null> {
  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("referral_partners")
    .select("id, code, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!partner) return null;

  const { data: balance } = await supabase
    .from("referral_partner_balances")
    .select(
      "approved_minor_units, pending_minor_units, in_payout_minor_units, paid_minor_units",
    )
    .eq("partner_id", partner.id)
    .maybeSingle();

  return {
    code: partner.code,
    status: partner.status,
    approvedMinorUnits: Number(balance?.approved_minor_units ?? 0),
    pendingMinorUnits: Number(balance?.pending_minor_units ?? 0),
    inPayoutMinorUnits: Number(balance?.in_payout_minor_units ?? 0),
    paidMinorUnits: Number(balance?.paid_minor_units ?? 0),
  };
}

export type EmployerSnapshot = {
  publishedJobs: number;
  draftJobs: number;
  applications: number;
  shortlisted: number;
  hired: number;
};

export async function getEmployerSnapshot(
  user: CurrentUser,
): Promise<EmployerSnapshot | null> {
  if (!userHasPermission(user, "job_manage")) return null;

  const organisationIds = user.organisations.map((org) => org.organisationId);
  if (organisationIds.length === 0) return null;

  const supabase = await createClient();
  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabase
      .from("job_postings")
      .select("id, status")
      .in("organisation_id", organisationIds),
    supabase
      .from("job_applications")
      .select("id, status, job_postings!inner(organisation_id)")
      .in("job_postings.organisation_id", organisationIds),
  ]);

  const apps = applications ?? [];
  return {
    publishedJobs: (jobs ?? []).filter((job) => job.status === "published").length,
    draftJobs: (jobs ?? []).filter((job) => job.status === "draft").length,
    applications: apps.length,
    shortlisted: apps.filter((app) => app.status === "shortlisted").length,
    hired: apps.filter((app) => app.status === "hired").length,
  };
}

export type AcademySnapshot = {
  myEnrolments: number;
  myCompleted: number;
  myCertificates: number;
  managedCourses: number;
  publishedCourses: number;
};

export async function getAcademySnapshot(
  user: CurrentUser,
): Promise<AcademySnapshot> {
  const supabase = await createClient();
  const [{ data: enrolments }, { count: certificates }] = await Promise.all([
    supabase
      .from("course_enrolments")
      .select("id, status, course_id")
      .eq("user_id", user.id),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const enrolIds = (enrolments ?? []).map((row) => row.id);
  const { data: completions } = enrolIds.length
    ? await supabase
        .from("completion_records")
        .select("id")
        .in("enrolment_id", enrolIds)
    : { data: [] as { id: string }[] };

  let managedCourses = 0;
  let publishedCourses = 0;
  if (userHasPermission(user, "course_manage")) {
    const organisationIds = user.organisations.map((org) => org.organisationId);
    const { data: courses } = organisationIds.length
      ? await supabase
          .from("courses")
          .select("id, status")
          .in("organisation_id", organisationIds)
      : { data: [] as { id: string; status: string }[] };
    managedCourses = courses?.length ?? 0;
    publishedCourses = (courses ?? []).filter(
      (course) => course.status === "published",
    ).length;
  }

  return {
    myEnrolments: (enrolments ?? []).filter((row) => row.status === "active").length,
    myCompleted: completions?.length ?? 0,
    myCertificates: certificates ?? 0,
    managedCourses,
    publishedCourses,
  };
}

export type FinanceSnapshot = {
  pendingPayments: number;
  mismatches: number;
  refundsInProgress: number;
  pendingPayouts: number;
};

export async function getFinanceSnapshot(
  user: CurrentUser,
): Promise<FinanceSnapshot | null> {
  if (
    !userHasPermission(user, "payment_review") &&
    !userHasPermission(user, "billing_manage")
  ) {
    return null;
  }

  const supabase = await createClient();
  const [reconciliation, { count: pending }, { count: refunds }, { count: payouts }] =
    await Promise.all([
      getReconciliationSummary(),
      supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .in("status", ["initiated", "pending"]),
      supabase
        .from("payment_refunds")
        .select("id", { count: "exact", head: true })
        .in("status", ["requested", "processing"]),
      supabase
        .from("referral_payout_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "approved"]),
    ]);

  return {
    pendingPayments: pending ?? 0,
    mismatches: reconciliation.mismatchCount,
    refundsInProgress: refunds ?? 0,
    pendingPayouts: payouts ?? 0,
  };
}
