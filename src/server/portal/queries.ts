import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMyLearning, type MyLearningCourse } from "@/server/academy/queries";

const DISPLAY_TIME_ZONE = "Africa/Lagos";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

function monthKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

function lastSixMonths(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1),
    );
    return { key: monthKey(date), label: monthLabel(date) };
  });
}

export type ProgressPoint = {
  key: string;
  label: string;
  lessons: number;
};

export type StudentCourseProgress = {
  enrolmentId: string;
  courseId: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastActivityAt: string | null;
};

export type StudentDashboardData = {
  minutesLearned: number;
  lessonsCompleted: number;
  averageProgress: number;
  certificates: number;
  activeCourses: number;
  progress: ProgressPoint[];
  courses: StudentCourseProgress[];
  recentLessons: {
    id: string;
    title: string;
    courseTitle: string;
    completedAt: string;
  }[];
};

type EnrolmentRow = {
  id: string;
  status: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  courses:
    | {
        id: string;
        title: string;
        slug: string;
        summary: string | null;
        cover_image_url: string | null;
        course_modules: { lessons: { id: string }[] }[] | null;
      }
    | {
        id: string;
        title: string;
        slug: string;
        summary: string | null;
        cover_image_url: string | null;
        course_modules: { lessons: { id: string }[] }[] | null;
      }[]
    | null;
};

type ProgressRow = {
  id: string;
  enrolment_id: string;
  lesson_id: string;
  completed_at: string;
  lessons:
    | {
        title: string;
        estimated_minutes: number;
        course_modules: { course_id: string } | { course_id: string }[] | null;
      }
    | {
        title: string;
        estimated_minutes: number;
        course_modules: { course_id: string } | { course_id: string }[] | null;
      }[]
    | null;
};

export async function getStudentDashboardData(
  userId: string,
): Promise<StudentDashboardData> {
  const supabase = await createClient();

  const [{ data: enrolmentData }, { data: progressData }, { count: certificates }] =
    await Promise.all([
      supabase
        .from("course_enrolments")
        .select(
          "id, status, course_id, enrolled_at, completed_at, courses(id, title, slug, summary, cover_image_url, course_modules(id, lessons(id)))",
        )
        .eq("user_id", userId)
        .in("status", ["active", "completed"])
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("lesson_progress")
        .select(
          "id, enrolment_id, lesson_id, completed_at, lessons(title, estimated_minutes, course_modules(course_id))",
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("revoked_at", null),
    ]);

  const enrolments = (enrolmentData ?? []) as EnrolmentRow[];
  const progress = (progressData ?? []) as ProgressRow[];

  const courseById = new Map<
    string,
    {
      title: string;
      slug: string;
      summary: string | null;
      coverImageUrl: string | null;
      totalLessons: number;
    }
  >();
  const enrolmentCourseId = new Map<string, string>();
  const totalLessonsByEnrolment = new Map<string, number>();

  for (const enrolment of enrolments) {
    const course = one(enrolment.courses);
    if (!course) continue;
    const totalLessons = (course.course_modules ?? []).reduce(
      (total, module) => total + (module.lessons?.length ?? 0),
      0,
    );
    courseById.set(course.id, {
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      coverImageUrl: course.cover_image_url,
      totalLessons,
    });
    enrolmentCourseId.set(enrolment.id, course.id);
    totalLessonsByEnrolment.set(enrolment.id, totalLessons);
  }

  const completedByEnrolment = new Map<string, number>();
  const lastActivityByEnrolment = new Map<string, string>();
  let minutesLearned = 0;

  for (const row of progress) {
    completedByEnrolment.set(
      row.enrolment_id,
      (completedByEnrolment.get(row.enrolment_id) ?? 0) + 1,
    );
    lastActivityByEnrolment.set(
      row.enrolment_id,
      lastActivityByEnrolment.get(row.enrolment_id) ?? row.completed_at,
    );
    const lesson = one(row.lessons);
    minutesLearned += lesson?.estimated_minutes ?? 0;
  }

  const activeEnrolments = enrolments.filter(
    (enrolment) => enrolment.status === "active",
  );

  let completedTotal = 0;
  let lessonTotal = 0;
  const courses: StudentCourseProgress[] = [];

  for (const enrolment of activeEnrolments) {
    const courseId = enrolmentCourseId.get(enrolment.id);
    if (!courseId) continue;
    const course = courseById.get(courseId);
    if (!course) continue;

    const completed = completedByEnrolment.get(enrolment.id) ?? 0;
    const total = totalLessonsByEnrolment.get(enrolment.id) ?? 0;
    completedTotal += completed;
    lessonTotal += total;

    courses.push({
      enrolmentId: enrolment.id,
      courseId,
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      coverImageUrl: course.coverImageUrl,
      completedLessons: completed,
      totalLessons: total,
      progressPercent: total === 0 ? 100 : Math.round((completed * 100) / total),
      lastActivityAt:
        lastActivityByEnrolment.get(enrolment.id) ??
        enrolment.completed_at ??
        enrolment.enrolled_at,
    });
  }

  courses.sort((a, b) => {
    if (a.progressPercent === b.progressPercent) {
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
    }
    return a.progressPercent - b.progressPercent;
  });

  const months = lastSixMonths();
  const countByMonth = new Map<string, number>();
  for (const row of progress) {
    const key = monthKey(new Date(row.completed_at));
    countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
  }

  const recentLessons = progress.slice(0, 4).flatMap((row) => {
    const lesson = one(row.lessons);
    const courseId = enrolmentCourseId.get(row.enrolment_id);
    const course = courseId ? courseById.get(courseId) : null;
    if (!lesson || !course) return [];
    return [
      {
        id: row.id,
        title: lesson.title,
        courseTitle: course.title,
        completedAt: row.completed_at,
      },
    ];
  });

  return {
    minutesLearned,
    lessonsCompleted: progress.length,
    averageProgress:
      lessonTotal === 0 ? 0 : Math.round((completedTotal * 100) / lessonTotal),
    certificates: certificates ?? 0,
    activeCourses: activeEnrolments.length,
    progress: months.map((month) => ({
      key: month.key,
      label: month.label,
      lessons: countByMonth.get(month.key) ?? 0,
    })),
    courses: courses.slice(0, 3),
    recentLessons,
  };
}

export type CaregiverShift = {
  id: string;
  title: string;
  facilityName: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export type CaregiverApplication = {
  id: string;
  roleTitle: string;
  organisationName: string;
  status: string;
  submittedAt: string;
};

export type CaregiverDashboardData = {
  shiftsThisWeek: number;
  todayShifts: CaregiverShift[];
  upcomingShifts: CaregiverShift[];
  activePlacements: number;
  placement: {
    id: string;
    title: string;
    organisationName: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  applications: CaregiverApplication[];
  applicationCount: number;
  activeCourses: number;
  certificates: number;
  training: MyLearningCourse[];
};

export async function getCaregiverDashboardData(
  userId: string,
): Promise<CaregiverDashboardData> {
  const supabase = await createClient();
  const today = dateKey(new Date());

  const [
    { data: assignmentData },
    { data: placementData },
    { data: applicationData },
    learning,
    { count: certificates },
  ] = await Promise.all([
    supabase
      .from("shift_assignments")
      .select(
        "id, status, shift_schedules(id, title, starts_at, ends_at, status, care_facilities(name))",
      )
      .eq("staff_user_id", userId),
    supabase
      .from("internship_placements")
      .select(
        "id, status, start_date, end_date, internship_listings(title), organisations(name)",
      )
      .eq("candidate_id", userId)
      .in("status", ["pending_agreement", "active"])
      .order("start_date", { ascending: true }),
    supabase
      .from("job_applications")
      .select(
        "id, status, submitted_at, job_postings(title, organisations(name))",
      )
      .eq("applicant_id", userId)
      .order("submitted_at", { ascending: false }),
    getMyLearning(userId),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("revoked_at", null),
  ]);

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const shifts: CaregiverShift[] = (assignmentData ?? []).flatMap((assignment) => {
    const shift = one(assignment.shift_schedules);
    if (!shift) return [];
    const facility = one(
      shift.care_facilities as
        | { name: string }
        | { name: string }[]
        | null,
    );
    if (assignment.status === "cancelled" || shift.status === "cancelled") {
      return [];
    }
    return [
      {
        id: shift.id,
        title: shift.title ?? "Care shift",
        facilityName: facility?.name ?? "Care facility",
        startsAt: shift.starts_at,
        endsAt: shift.ends_at,
        status: assignment.status,
      },
    ];
  });

  shifts.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcoming = shifts.filter((shift) => new Date(shift.endsAt) >= now);
  const todayShifts = upcoming.filter((shift) => dateKey(new Date(shift.startsAt)) === today);
  const shiftsThisWeek = upcoming.filter(
    (shift) => new Date(shift.startsAt) <= weekEnd,
  ).length;

  const placements = (placementData ?? []).flatMap((placement) => {
    const listing = one(
      placement.internship_listings as
        | { title: string }
        | { title: string }[]
        | null,
    );
    const organisation = one(
      placement.organisations as
        | { name: string }
        | { name: string }[]
        | null,
    );
    return [
      {
        id: placement.id,
        title: listing?.title ?? "Internship placement",
        organisationName: organisation?.name ?? "Placement provider",
        startDate: placement.start_date,
        endDate: placement.end_date,
        status: placement.status,
      },
    ];
  });

  const applications = (applicationData ?? []).flatMap((application) => {
    const job = one(
      application.job_postings as
        | { title: string; organisations: { name: string } | { name: string }[] | null }
        | { title: string; organisations: { name: string } | { name: string }[] | null }[]
        | null,
    );
    return [
      {
        id: application.id,
        roleTitle: job?.title ?? "Job application",
        organisationName:
          one(job?.organisations ?? null)?.name ?? "Employer",
        status: application.status,
        submittedAt: application.submitted_at,
      },
    ];
  });

  const activeCourses = learning.filter((course) => course.status === "active");

  return {
    shiftsThisWeek,
    todayShifts,
    upcomingShifts: upcoming.slice(0, 4),
    activePlacements: placements.length,
    placement: placements[0] ?? null,
    applications,
    applicationCount: applications.length,
    activeCourses: activeCourses.length,
    certificates: certificates ?? 0,
    training: activeCourses.slice(0, 2),
  };
}
