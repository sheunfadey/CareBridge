import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";
import { canAccessOrganisation, userHasPermission } from "@/server/auth/current-user";
import type {
  ApplicationStatus,
  AttendanceStatus,
  EvaluationRecommendation,
  EvaluationStatus,
  IncidentSeverity,
  IncidentStatus,
  InternshipApplicationStatus,
  InternshipLogStatus,
  InterviewMode,
  InterviewStatus,
  JobStatus,
  OfferStatus,
  PlacementAgreementStatus,
  PlacementStatus,
} from "@/types/database";

type Relation<T> = T | T[] | null;

function singleRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export type InterviewSummary = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  location: string | null;
  meetingLink: string | null;
  status: InterviewStatus;
  feedback: string | null;
  rating: number | null;
};

export type JobOfferSummary = {
  id: string;
  status: OfferStatus;
  employmentType: string;
  salaryMinorUnits: number | null;
  salaryCurrency: string;
  startDate: string | null;
  expiresAt: string | null;
  notes: string | null;
  respondedAt: string | null;
  createdAt: string;
};

export type InternshipOfferSummary = {
  id: string;
  status: OfferStatus;
  startDate: string | null;
  endDate: string | null;
  expectedHours: number | null;
  location: string | null;
  expiresAt: string | null;
  notes: string | null;
  respondedAt: string | null;
  createdAt: string;
};

export type PlacementSummary = {
  id: string;
  status: PlacementStatus;
  agreementStatus: PlacementAgreementStatus;
  candidateId: string;
  supervisorId: string | null;
  candidateName: string;
  supervisorName: string | null;
  listingTitle: string;
  organisationId: string;
  organisationName: string;
  location: string | null;
  state: string | null;
  city: string | null;
  startDate: string;
  endDate: string;
  expectedHours: number | null;
  safeguardingCleared: boolean;
  insuranceCleared: boolean;
  completedAt: string | null;
  updatedAt: string;
  viewerRole: "candidate" | "supervisor" | "manager";
};

export type PlacementLog = {
  id: string;
  weekStart: string;
  weekEnd: string;
  hours: number;
  summary: string;
  challenges: string | null;
  nextSteps: string | null;
  status: InternshipLogStatus;
  supervisorFeedback: string | null;
  authorName: string;
  authorId: string;
  reviewedAt: string | null;
  createdAt: string;
};

export type PlacementAttendance = {
  id: string;
  attendanceDate: string;
  status: AttendanceStatus;
  hours: number;
  notes: string | null;
};

export type PlacementEvaluation = {
  id: string;
  evaluationDate: string;
  overallRating: number;
  carePracticeRating: number | null;
  communicationRating: number | null;
  professionalismRating: number | null;
  safeguardingRating: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  recommendation: EvaluationRecommendation;
  status: EvaluationStatus;
  evaluatorId: string;
  evaluatorName: string;
};

export type PlacementIncident = {
  id: string;
  occurredAt: string;
  category: string;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  resolution: string | null;
  resolvedAt: string | null;
  reporterName: string;
  reporterId: string;
};

export type PlacementCompletion = {
  id: string;
  certificateCode: string;
  hoursCompleted: number;
  outcome: string;
  summary: string | null;
  issuedAt: string;
};

export type PlacementSupervisorOption = {
  userId: string;
  name: string;
};

export type PlacementDetail = PlacementSummary & {
  listingId: string;
  listingSlug: string;
  applicationId: string;
  learningObjectives: string[];
  supervisionArrangements: string | null;
  completionSummary: string | null;
  createdAt: string;
  logs: PlacementLog[];
  attendance: PlacementAttendance[];
  evaluations: PlacementEvaluation[];
  incidents: PlacementIncident[];
  completion: PlacementCompletion | null;
  supervisorOptions: PlacementSupervisorOption[];
  canManage: boolean;
  canSupervise: boolean;
  isCandidate: boolean;
};

export type JobApplicationWorkspace = {
  application: {
    id: string;
    status: ApplicationStatus;
    submittedAt: string;
    coverLetter: string | null;
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string | null;
    applicantState: string | null;
    applicantCity: string | null;
  };
  job: {
    id: string;
    title: string;
    slug: string;
    status: JobStatus;
    employmentType: string;
    organisationId: string;
    organisationName: string;
  };
  interviews: InterviewSummary[];
  offer: JobOfferSummary | null;
  canManage: boolean;
};

export type InternshipApplicationWorkspace = {
  application: {
    id: string;
    status: InternshipApplicationStatus;
    submittedAt: string;
    coverNote: string | null;
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string | null;
    applicantState: string | null;
    applicantCity: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    status: "draft" | "open" | "closed" | "archived";
    organisationId: string;
    organisationName: string;
    startDate: string | null;
    endDate: string | null;
    expectedHours: number | null;
    location: string | null;
    learningObjectives: string[];
  };
  interviews: InterviewSummary[];
  offer: InternshipOfferSummary | null;
  placement: { id: string; status: PlacementStatus } | null;
  canManage: boolean;
};

export type PlacementReadyApplication = {
  applicationId: string;
  applicantName: string;
  listingTitle: string;
  organisationName: string;
  submittedAt: string;
};

function mapInterview(row: {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: InterviewMode;
  location: string | null;
  meeting_link: string | null;
  status: InterviewStatus;
  feedback: string | null;
  rating: number | null;
}): InterviewSummary {
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    mode: row.mode,
    location: row.location,
    meetingLink: row.meeting_link,
    status: row.status,
    feedback: row.feedback,
    rating: row.rating,
  };
}

export async function getPlacementsForUser(
  user: CurrentUser,
): Promise<PlacementSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_placements")
    .select(
      "id, status, agreement_status, candidate_id, supervisor_id, location, state, city, start_date, end_date, expected_hours, safeguarding_cleared, insurance_cleared, completed_at, updated_at, organisation_id, internship_listings(title), organisations(name), candidate:profiles!internship_placements_candidate_id_fkey(full_name), supervisor:profiles!internship_placements_supervisor_id_fkey(full_name)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[placements] could not load placements", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const viewerRole =
      row.candidate_id === user.id
        ? "candidate"
        : row.supervisor_id === user.id
          ? "supervisor"
          : "manager";
    return {
      id: row.id,
      status: row.status,
      agreementStatus: row.agreement_status,
      candidateId: row.candidate_id,
      supervisorId: row.supervisor_id,
      candidateName:
        singleRelation(row.candidate)?.full_name ?? "Candidate",
      supervisorName: singleRelation(row.supervisor)?.full_name ?? null,
      listingTitle: singleRelation(row.internship_listings)?.title ?? "Placement",
      organisationId: row.organisation_id,
      organisationName:
        singleRelation(row.organisations)?.name ?? "Placement provider",
      location: row.location,
      state: row.state,
      city: row.city,
      startDate: row.start_date,
      endDate: row.end_date,
      expectedHours: row.expected_hours,
      safeguardingCleared: row.safeguarding_cleared,
      insuranceCleared: row.insurance_cleared,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
      viewerRole,
    };
  });
}

export async function getPlacementDetail(
  user: CurrentUser,
  placementId: string,
): Promise<PlacementDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_placements")
    .select(
      "id, listing_id, application_id, status, agreement_status, candidate_id, supervisor_id, location, state, city, start_date, end_date, expected_hours, learning_objectives, supervision_arrangements, safeguarding_cleared, insurance_cleared, started_at, completed_at, completion_summary, created_at, updated_at, organisation_id, internship_listings(title, slug), organisations(name), candidate:profiles!internship_placements_candidate_id_fkey(full_name, email, phone, state, city), supervisor:profiles!internship_placements_supervisor_id_fkey(full_name)",
    )
    .eq("id", placementId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[placements] could not load placement", error);
    return null;
  }

  const organisationId = data.organisation_id;
  const canManage =
    userHasPermission(user, "internship_manage") &&
    canAccessOrganisation(user, organisationId);
  const canSupervise = canManage || data.supervisor_id === user.id;
  const isCandidate = data.candidate_id === user.id;

  const [
    { data: logs },
    { data: attendance },
    { data: evaluations },
    { data: incidents },
    { data: completion },
    supervisorOptions,
  ] = await Promise.all([
    supabase
      .from("internship_logs")
      .select(
        "id, week_start, week_end, hours, summary, challenges, next_steps, status, supervisor_feedback, reviewed_at, created_at, author_id, author:profiles!internship_logs_author_id_fkey(full_name)",
      )
      .eq("placement_id", placementId)
      .order("week_start", { ascending: false }),
    supabase
      .from("internship_attendance")
      .select("id, attendance_date, status, hours, notes")
      .eq("placement_id", placementId)
      .order("attendance_date", { ascending: false }),
    supabase
      .from("internship_evaluations")
      .select(
        "id, evaluation_date, overall_rating, care_practice_rating, communication_rating, professionalism_rating, safeguarding_rating, strengths, areas_for_improvement, recommendation, status, evaluator_id, evaluator:profiles!internship_evaluations_evaluator_id_fkey(full_name)",
      )
      .eq("placement_id", placementId)
      .order("evaluation_date", { ascending: false }),
    supabase
      .from("internship_incidents")
      .select(
        "id, occurred_at, category, severity, description, status, resolution, resolved_at, reported_by, reporter:profiles!internship_incidents_reported_by_fkey(full_name)",
      )
      .eq("placement_id", placementId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("internship_completion_records")
      .select(
        "id, certificate_code, hours_completed, outcome, summary, issued_at",
      )
      .eq("placement_id", placementId)
      .maybeSingle(),
    canManage
      ? supabase
          .from("organisation_memberships")
          .select("user_id, profiles(full_name, email)")
          .eq("organisation_id", organisationId)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
  ]);

  const supervisorList: PlacementSupervisorOption[] = (
    (supervisorOptions?.data ?? []) as {
      user_id: string;
      profiles:
        | { full_name: string | null; email: string }
        | { full_name: string | null; email: string }[]
        | null;
    }[]
  )
    .map((row) => {
      const profile = singleRelation(row.profiles);
      return {
        userId: row.user_id,
        name: profile?.full_name || profile?.email || "Team member",
      };
    })
    .filter((option) => option.userId !== data.candidate_id);

  return {
    id: data.id,
    listingId: data.listing_id,
    listingSlug: singleRelation(data.internship_listings)?.slug ?? "",
    applicationId: data.application_id,
    status: data.status,
    agreementStatus: data.agreement_status,
    candidateId: data.candidate_id,
    candidateName: singleRelation(data.candidate)?.full_name ?? "Candidate",
    supervisorId: data.supervisor_id,
    supervisorName: singleRelation(data.supervisor)?.full_name ?? null,
    listingTitle: singleRelation(data.internship_listings)?.title ?? "Placement",
    organisationId,
    organisationName:
      singleRelation(data.organisations)?.name ?? "Placement provider",
    location: data.location,
    state: data.state,
    city: data.city,
    startDate: data.start_date,
    endDate: data.end_date,
    expectedHours: data.expected_hours,
    learningObjectives: data.learning_objectives,
    supervisionArrangements: data.supervision_arrangements,
    safeguardingCleared: data.safeguarding_cleared,
    insuranceCleared: data.insurance_cleared,
    completedAt: data.completed_at,
    completionSummary: data.completion_summary,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    viewerRole: isCandidate
      ? "candidate"
      : canSupervise
        ? "supervisor"
        : "manager",
    logs: (logs ?? []).map((row) => ({
      id: row.id,
      weekStart: row.week_start,
      weekEnd: row.week_end,
      hours: row.hours,
      summary: row.summary,
      challenges: row.challenges,
      nextSteps: row.next_steps,
      status: row.status,
      supervisorFeedback: row.supervisor_feedback,
      authorName: singleRelation(row.author)?.full_name ?? "Candidate",
      authorId: row.author_id,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    })),
    attendance: (attendance ?? []).map((row) => ({
      id: row.id,
      attendanceDate: row.attendance_date,
      status: row.status,
      hours: row.hours,
      notes: row.notes,
    })),
    evaluations: (evaluations ?? []).map((row) => ({
      id: row.id,
      evaluationDate: row.evaluation_date,
      overallRating: row.overall_rating,
      carePracticeRating: row.care_practice_rating,
      communicationRating: row.communication_rating,
      professionalismRating: row.professionalism_rating,
      safeguardingRating: row.safeguarding_rating,
      strengths: row.strengths,
      areasForImprovement: row.areas_for_improvement,
      recommendation: row.recommendation,
      status: row.status,
      evaluatorId: row.evaluator_id,
      evaluatorName: singleRelation(row.evaluator)?.full_name ?? "Supervisor",
    })),
    incidents: (incidents ?? []).map((row) => ({
      id: row.id,
      occurredAt: row.occurred_at,
      category: row.category,
      severity: row.severity,
      description: row.description,
      status: row.status,
      resolution: row.resolution,
      resolvedAt: row.resolved_at,
      reporterName: singleRelation(row.reporter)?.full_name ?? "Reporter",
      reporterId: row.reported_by,
    })),
    completion: completion
      ? {
          id: completion.id,
          certificateCode: completion.certificate_code,
          hoursCompleted: completion.hours_completed,
          outcome: completion.outcome,
          summary: completion.summary,
          issuedAt: completion.issued_at,
        }
      : null,
    supervisorOptions: supervisorList,
    canManage,
    canSupervise,
    isCandidate,
  };
}

export async function getPlacementSupervisorOptions(
  organisationId: string,
): Promise<PlacementSupervisorOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("user_id, profiles(full_name, email)")
    .eq("organisation_id", organisationId)
    .eq("status", "active");

  if (error) {
    console.error("[placements] could not load supervisors", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = singleRelation(row.profiles);
    return {
      userId: row.user_id,
      name: profile?.full_name || profile?.email || "Team member",
    };
  });
}

export async function getPlacementReadyApplications(): Promise<
  PlacementReadyApplication[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_applications")
    .select(
      "id, submitted_at, profiles!internship_applications_applicant_id_fkey(full_name), internship_listings(title, organisations(name)), internship_placements(id)",
    )
    .eq("status", "accepted")
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[placements] could not load ready applications", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const listing = singleRelation(row.internship_listings);
    const organisation = singleRelation(listing?.organisations ?? null);
    if (!listing || row.internship_placements !== null) return [];
    return [
      {
        applicationId: row.id,
        applicantName:
          singleRelation(row.profiles)?.full_name ?? "Candidate",
        listingTitle: listing.title,
        organisationName: organisation?.name ?? "Placement provider",
        submittedAt: row.submitted_at,
      },
    ];
  });
}

export async function getJobApplicationWorkspace(
  user: CurrentUser,
  applicationId: string,
): Promise<JobApplicationWorkspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, status, submitted_at, cover_letter, applicant_id, profiles!job_applications_applicant_id_fkey(full_name, email, phone, state, city), job_postings(id, title, slug, status, employment_type, organisation_id, organisations(name)), interviews(id, scheduled_at, duration_minutes, mode, location, meeting_link, status, feedback, rating), job_offers(id, status, employment_type, salary_minor_units, salary_currency, start_date, expires_at, notes, responded_at, created_at)",
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[employment] could not load job workspace", error);
    return null;
  }

  const job = singleRelation(data.job_postings);
  const profile = singleRelation(data.profiles);
  if (!job || !profile) return null;

  const canManage =
    userHasPermission(user, "job_manage") &&
    canAccessOrganisation(user, job.organisation_id);

  const interviews = (data.interviews ?? [])
    .map(mapInterview)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const offer = singleRelation(data.job_offers);

  return {
    application: {
      id: data.id,
      status: data.status,
      submittedAt: data.submitted_at,
      coverLetter: data.cover_letter,
      applicantId: data.applicant_id,
      applicantName: profile.full_name ?? "Applicant",
      applicantEmail: profile.email,
      applicantPhone: profile.phone,
      applicantState: profile.state,
      applicantCity: profile.city,
    },
    job: {
      id: job.id,
      title: job.title,
      slug: job.slug,
      status: job.status,
      employmentType: job.employment_type,
      organisationId: job.organisation_id,
      organisationName:
        singleRelation(job.organisations)?.name ?? "HillCrest employer",
    },
    interviews,
    offer: offer
      ? {
          id: offer.id,
          status: offer.status,
          employmentType: offer.employment_type,
          salaryMinorUnits: offer.salary_minor_units,
          salaryCurrency: offer.salary_currency,
          startDate: offer.start_date,
          expiresAt: offer.expires_at,
          notes: offer.notes,
          respondedAt: offer.responded_at,
          createdAt: offer.created_at,
        }
      : null,
    canManage,
  };
}

export async function getInternshipApplicationWorkspace(
  user: CurrentUser,
  applicationId: string,
): Promise<InternshipApplicationWorkspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_applications")
    .select(
      "id, status, submitted_at, cover_note, applicant_id, profiles!internship_applications_applicant_id_fkey(full_name, email, phone, state, city), internship_listings(id, title, slug, status, organisation_id, start_date, end_date, expected_hours, location, learning_objectives, organisations(name)), interviews(id, scheduled_at, duration_minutes, mode, location, meeting_link, status, feedback, rating), internship_offers(id, status, start_date, end_date, expected_hours, location, expires_at, notes, responded_at, created_at), internship_placements(id, status)",
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error(
        "[employment] could not load internship workspace",
        error,
      );
    }
    return null;
  }

  const listing = singleRelation(data.internship_listings);
  const profile = singleRelation(data.profiles);
  if (!listing || !profile) return null;

  const canManage =
    userHasPermission(user, "internship_manage") &&
    canAccessOrganisation(user, listing.organisation_id);

  const interviews = (data.interviews ?? [])
    .map(mapInterview)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const offer = singleRelation(data.internship_offers);
  const placement = singleRelation(data.internship_placements);

  return {
    application: {
      id: data.id,
      status: data.status,
      submittedAt: data.submitted_at,
      coverNote: data.cover_note,
      applicantId: data.applicant_id,
      applicantName: profile.full_name ?? "Applicant",
      applicantEmail: profile.email,
      applicantPhone: profile.phone,
      applicantState: profile.state,
      applicantCity: profile.city,
    },
    listing: {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      status: listing.status,
      organisationId: listing.organisation_id,
      organisationName:
        singleRelation(listing.organisations)?.name ??
        "HillCrest placement provider",
      startDate: listing.start_date,
      endDate: listing.end_date,
      expectedHours: listing.expected_hours,
      location: listing.location,
      learningObjectives: listing.learning_objectives,
    },
    interviews,
    offer: offer
      ? {
          id: offer.id,
          status: offer.status,
          startDate: offer.start_date,
          endDate: offer.end_date,
          expectedHours: offer.expected_hours,
          location: offer.location,
          expiresAt: offer.expires_at,
          notes: offer.notes,
          respondedAt: offer.responded_at,
          createdAt: offer.created_at,
        }
      : null,
    placement: placement
      ? { id: placement.id, status: placement.status }
      : null,
    canManage,
  };
}
