import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";
import { userHasPermission } from "@/server/auth/current-user";
import type {
  ApplicationStatus,
  EmploymentType,
  InternshipApplicationStatus,
  InternshipListingStatus,
  JobStatus,
} from "@/types/database";
import type {
  InternshipOfferSummary,
  InterviewSummary,
  JobOfferSummary,
} from "@/server/employment/workspace-queries";

type Relation<T> = T | T[] | null;

function singleRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export type JobSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  employmentType: EmploymentType;
  state: string | null;
  city: string | null;
  workLocation: string | null;
  salaryMinMinorUnits: number | null;
  salaryMaxMinorUnits: number | null;
  salaryCurrency: string;
  isSalaryDisclosed: boolean;
  applicationDeadline: string | null;
  publishedAt: string | null;
  organisationName: string;
};

export type JobDetail = JobSummary & {
  organisationId: string;
  status: JobStatus;
  description: string | null;
  duties: string[];
  qualifications: string[];
  skills: string[];
  shiftRequirements: string | null;
  experienceRequirements: string | null;
  safeguardingRequirements: string | null;
};

export type MyJobApplication = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  organisationName: string;
  applicationDeadline: string | null;
  interviews: InterviewSummary[];
  offer: JobOfferSummary | null;
};

export type ManagedJob = {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  employmentType: EmploymentType;
  state: string | null;
  city: string | null;
  applicationDeadline: string | null;
  publishedAt: string | null;
  createdAt: string;
  applicantCount: number;
};

export type JobApplicant = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  coverLetter: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  applicantState: string | null;
  applicantCity: string | null;
};

export type InternshipSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  state: string | null;
  city: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  expectedHours: number | null;
  slots: number;
  applicationDeadline: string | null;
  publishedAt: string | null;
  organisationName: string;
};

export type InternshipDetail = InternshipSummary & {
  organisationId: string;
  status: InternshipListingStatus;
  description: string | null;
  requirements: string[];
  learningObjectives: string[];
};

export type MyInternshipApplication = {
  id: string;
  status: InternshipApplicationStatus;
  submittedAt: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  organisationName: string;
  applicationDeadline: string | null;
  interviews: InterviewSummary[];
  offer: InternshipOfferSummary | null;
  placement: { id: string; status: string } | null;
};

export type ManagedInternship = {
  id: string;
  title: string;
  slug: string;
  status: InternshipListingStatus;
  state: string | null;
  city: string | null;
  slots: number;
  applicationDeadline: string | null;
  publishedAt: string | null;
  createdAt: string;
  applicantCount: number;
};

export type InternshipApplicant = {
  id: string;
  status: InternshipApplicationStatus;
  submittedAt: string;
  coverNote: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  applicantState: string | null;
  applicantCity: string | null;
};

export type EmploymentOrganisationOption = {
  id: string;
  name: string;
};

export async function getPublishedJobs(): Promise<{
  jobs: JobSummary[];
  unavailable: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_postings")
    .select(
      "id, title, slug, summary, employment_type, state, city, work_location, salary_min_minor_units, salary_max_minor_units, salary_currency, is_salary_disclosed, application_deadline, published_at, organisations(name)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[employment] could not load jobs", error);
    return { jobs: [], unavailable: true };
  }

  return {
    unavailable: false,
    jobs: (data ?? []).map((job) => ({
      id: job.id,
      title: job.title,
      slug: job.slug,
      summary: job.summary,
      employmentType: job.employment_type,
      state: job.state,
      city: job.city,
      workLocation: job.work_location,
      salaryMinMinorUnits: job.salary_min_minor_units,
      salaryMaxMinorUnits: job.salary_max_minor_units,
      salaryCurrency: job.salary_currency,
      isSalaryDisclosed: job.is_salary_disclosed,
      applicationDeadline: job.application_deadline,
      publishedAt: job.published_at,
      organisationName:
        singleRelation(job.organisations)?.name ?? "HillCrest employer",
    })),
  };
}

export async function getJobDetail(id: string): Promise<JobDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_postings")
    .select(
      "id, organisation_id, title, slug, summary, description, duties, employment_type, work_location, state, city, shift_requirements, experience_requirements, qualifications, skills, salary_min_minor_units, salary_max_minor_units, salary_currency, is_salary_disclosed, safeguarding_requirements, application_deadline, status, published_at, organisations(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[employment] could not load job", error);
    return null;
  }

  return {
    id: data.id,
    organisationId: data.organisation_id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    duties: data.duties,
    employmentType: data.employment_type,
    workLocation: data.work_location,
    state: data.state,
    city: data.city,
    shiftRequirements: data.shift_requirements,
    experienceRequirements: data.experience_requirements,
    qualifications: data.qualifications,
    skills: data.skills,
    salaryMinMinorUnits: data.salary_min_minor_units,
    salaryMaxMinorUnits: data.salary_max_minor_units,
    salaryCurrency: data.salary_currency,
    isSalaryDisclosed: data.is_salary_disclosed,
    safeguardingRequirements: data.safeguarding_requirements,
    applicationDeadline: data.application_deadline,
    status: data.status,
    publishedAt: data.published_at,
    organisationName:
      singleRelation(data.organisations)?.name ?? "HillCrest employer",
  };
}

export async function getMyJobApplications(
  userId: string,
): Promise<MyJobApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, status, submitted_at, job_id, job_postings(title, slug, application_deadline, organisations(name)), interviews(id, scheduled_at, duration_minutes, mode, location, meeting_link, status, feedback, rating), job_offers(id, status, employment_type, salary_minor_units, salary_currency, start_date, expires_at, notes, responded_at, created_at)",
    )
    .eq("applicant_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("[employment] could not load my job applications", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const job = singleRelation(row.job_postings);
    if (!job) return [];
    const offer = singleRelation(row.job_offers);
    return [
      {
        id: row.id,
        status: row.status,
        submittedAt: row.submitted_at,
        jobId: row.job_id,
        jobTitle: job.title,
        jobSlug: job.slug,
        organisationName:
          singleRelation(job.organisations)?.name ?? "HillCrest employer",
        applicationDeadline: job.application_deadline,
        interviews: (row.interviews ?? [])
          .map((interview) => ({
            id: interview.id,
            scheduledAt: interview.scheduled_at,
            durationMinutes: interview.duration_minutes,
            mode: interview.mode,
            location: interview.location,
            meetingLink: interview.meeting_link,
            status: interview.status,
            feedback: interview.feedback,
            rating: interview.rating,
          }))
          .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
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
      },
    ];
  });
}

export async function hasAppliedToJob(
  jobId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getManagedJobs(
  user: CurrentUser,
  organisationId: string | null = null,
): Promise<ManagedJob[]> {
  const supabase = await createClient();
  let query = supabase
    .from("job_postings")
    .select(
      "id, title, slug, status, employment_type, state, city, application_deadline, published_at, created_at, job_applications(id)",
    )
    .order("created_at", { ascending: false });

  if (organisationId) {
    query = query.eq("organisation_id", organisationId);
  } else if (!user.isSuperAdmin) {
    const ids = user.organisations.map((org) => org.organisationId);
    if (ids.length === 0) return [];
    query = query.in("organisation_id", ids);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[employment] could not load managed jobs", error);
    return [];
  }

  return (data ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    status: job.status,
    employmentType: job.employment_type,
    state: job.state,
    city: job.city,
    applicationDeadline: job.application_deadline,
    publishedAt: job.published_at,
    createdAt: job.created_at,
    applicantCount: job.job_applications?.length ?? 0,
  }));
}

export async function getJobApplicants(
  jobId: string,
): Promise<{ jobTitle: string | null; applicants: JobApplicant[] }> {
  const supabase = await createClient();
  const [{ data: job }, { data, error }] = await Promise.all([
    supabase
      .from("job_postings")
      .select("title")
      .eq("id", jobId)
      .maybeSingle(),
    supabase
      .from("job_applications")
      .select(
        "id, status, submitted_at, cover_letter, profiles!job_applications_applicant_id_fkey(full_name, email, phone, state, city)",
      )
      .eq("job_id", jobId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (error) {
    console.error("[employment] could not load job applicants", error);
    return { jobTitle: job?.title ?? null, applicants: [] };
  }

  return {
    jobTitle: job?.title ?? null,
    applicants: (data ?? []).map((row) => {
      const profile = singleRelation(row.profiles);
      return {
        id: row.id,
        status: row.status,
        submittedAt: row.submitted_at,
        coverLetter: row.cover_letter,
        applicantName: profile?.full_name ?? "Applicant",
        applicantEmail: profile?.email ?? "",
        applicantPhone: profile?.phone ?? null,
        applicantState: profile?.state ?? null,
        applicantCity: profile?.city ?? null,
      };
    }),
  };
}

export async function getOpenInternships(): Promise<{
  internships: InternshipSummary[];
  unavailable: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_listings")
    .select(
      "id, title, slug, summary, state, city, location, start_date, end_date, expected_hours, slots, application_deadline, published_at, organisations(name)",
    )
    .eq("status", "open")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[employment] could not load internships", error);
    return { internships: [], unavailable: true };
  }

  return {
    unavailable: false,
    internships: (data ?? []).map((listing) => ({
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      summary: listing.summary,
      state: listing.state,
      city: listing.city,
      location: listing.location,
      startDate: listing.start_date,
      endDate: listing.end_date,
      expectedHours: listing.expected_hours,
      slots: listing.slots,
      applicationDeadline: listing.application_deadline,
      publishedAt: listing.published_at,
      organisationName:
        singleRelation(listing.organisations)?.name ??
        "HillCrest placement provider",
    })),
  };
}

export async function getInternshipDetail(
  id: string,
): Promise<InternshipDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_listings")
    .select(
      "id, organisation_id, title, slug, summary, description, state, city, location, start_date, end_date, expected_hours, slots, requirements, learning_objectives, application_deadline, status, published_at, organisations(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[employment] could not load internship", error);
    return null;
  }

  return {
    id: data.id,
    organisationId: data.organisation_id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    state: data.state,
    city: data.city,
    location: data.location,
    startDate: data.start_date,
    endDate: data.end_date,
    expectedHours: data.expected_hours,
    slots: data.slots,
    requirements: data.requirements,
    learningObjectives: data.learning_objectives,
    applicationDeadline: data.application_deadline,
    status: data.status,
    publishedAt: data.published_at,
    organisationName:
      singleRelation(data.organisations)?.name ??
      "HillCrest placement provider",
  };
}

export async function getMyInternshipApplications(
  userId: string,
): Promise<MyInternshipApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internship_applications")
    .select(
      "id, status, submitted_at, listing_id, internship_listings(title, slug, application_deadline, organisations(name)), interviews(id, scheduled_at, duration_minutes, mode, location, meeting_link, status, feedback, rating), internship_offers(id, status, start_date, end_date, expected_hours, location, expires_at, notes, responded_at, created_at), internship_placements(id, status)",
    )
    .eq("applicant_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error(
      "[employment] could not load my internship applications",
      error,
    );
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const listing = singleRelation(row.internship_listings);
    if (!listing) return [];
    const offer = singleRelation(row.internship_offers);
    const placement = singleRelation(row.internship_placements);
    return [
      {
        id: row.id,
        status: row.status,
        submittedAt: row.submitted_at,
        listingId: row.listing_id,
        listingTitle: listing.title,
        listingSlug: listing.slug,
        organisationName:
          singleRelation(listing.organisations)?.name ??
          "HillCrest placement provider",
        applicationDeadline: listing.application_deadline,
        interviews: (row.interviews ?? [])
          .map((interview) => ({
            id: interview.id,
            scheduledAt: interview.scheduled_at,
            durationMinutes: interview.duration_minutes,
            mode: interview.mode,
            location: interview.location,
            meetingLink: interview.meeting_link,
            status: interview.status,
            feedback: interview.feedback,
            rating: interview.rating,
          }))
          .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
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
      },
    ];
  });
}

export async function hasAppliedToInternship(
  listingId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internship_applications")
    .select("id")
    .eq("listing_id", listingId)
    .eq("applicant_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getManagedInternships(
  user: CurrentUser,
  organisationId: string | null = null,
): Promise<ManagedInternship[]> {
  const supabase = await createClient();
  let query = supabase
    .from("internship_listings")
    .select(
      "id, title, slug, status, state, city, slots, application_deadline, published_at, created_at, internship_applications(id)",
    )
    .order("created_at", { ascending: false });

  if (organisationId) {
    query = query.eq("organisation_id", organisationId);
  } else if (!user.isSuperAdmin) {
    const ids = user.organisations.map((org) => org.organisationId);
    if (ids.length === 0) return [];
    query = query.in("organisation_id", ids);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[employment] could not load managed internships", error);
    return [];
  }

  return (data ?? []).map((listing) => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    status: listing.status,
    state: listing.state,
    city: listing.city,
    slots: listing.slots,
    applicationDeadline: listing.application_deadline,
    publishedAt: listing.published_at,
    createdAt: listing.created_at,
    applicantCount: listing.internship_applications?.length ?? 0,
  }));
}

export async function getInternshipApplicants(
  listingId: string,
): Promise<{ listingTitle: string | null; applicants: InternshipApplicant[] }> {
  const supabase = await createClient();
  const [{ data: listing }, { data, error }] = await Promise.all([
    supabase
      .from("internship_listings")
      .select("title")
      .eq("id", listingId)
      .maybeSingle(),
    supabase
      .from("internship_applications")
      .select(
        "id, status, submitted_at, cover_note, profiles!internship_applications_applicant_id_fkey(full_name, email, phone, state, city)",
      )
      .eq("listing_id", listingId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (error) {
    console.error("[employment] could not load internship applicants", error);
    return { listingTitle: listing?.title ?? null, applicants: [] };
  }

  return {
    listingTitle: listing?.title ?? null,
    applicants: (data ?? []).map((row) => {
      const profile = singleRelation(row.profiles);
      return {
        id: row.id,
        status: row.status,
        submittedAt: row.submitted_at,
        coverNote: row.cover_note,
        applicantName: profile?.full_name ?? "Applicant",
        applicantEmail: profile?.email ?? "",
        applicantPhone: profile?.phone ?? null,
        applicantState: profile?.state ?? null,
        applicantCity: profile?.city ?? null,
      };
    }),
  };
}

export async function getEmploymentOrganisationOptions(
  user: CurrentUser,
  permission: "job_manage" | "internship_manage",
): Promise<EmploymentOrganisationOption[]> {
  if (!userHasPermission(user, permission)) return [];

  if (user.isSuperAdmin) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organisations")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) {
      console.error("[employment] could not load organisations", error);
      return [];
    }
    return data ?? [];
  }

  return user.organisations.map((org) => ({
    id: org.organisationId,
    name: org.organisationName,
  }));
}
