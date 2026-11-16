import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";
import { listManagedCourses, type ManagedCourse } from "@/server/academy/queries";

export type TrainerSubmission = {
  id: string;
  learnerName: string;
  courseId: string;
  courseTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  scorePercent: number | null;
  passed: boolean | null;
  submittedAt: string | null;
};

export type TrainerDashboardData = {
  courses: ManagedCourse[];
  publishedCourses: number;
  draftCourses: number;
  learnerCount: number;
  assessmentCount: number;
  submissionCount: number;
  certificateCount: number;
  submissions: TrainerSubmission[];
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getTrainerDashboardData(
  user: CurrentUser,
  submissionLimit = 8,
): Promise<TrainerDashboardData> {
  const courses = await listManagedCourses(user);
  const courseIds = courses.map((course) => course.id);

  if (courseIds.length === 0) {
    return {
      courses,
      publishedCourses: 0,
      draftCourses: 0,
      learnerCount: 0,
      assessmentCount: 0,
      submissionCount: 0,
      certificateCount: 0,
      submissions: [],
    };
  }

  const supabase = await createClient();
  const [{ data: assessments }, { count: learnerCount }, { count: certificateCount }] =
    await Promise.all([
      supabase
        .from("assessments")
        .select("id, title, course_id, status")
        .in("course_id", courseIds),
      supabase
        .from("course_enrolments")
        .select("id", { count: "exact", head: true })
        .in("course_id", courseIds),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .in("course_id", courseIds)
        .is("revoked_at", null),
    ]);

  const assessmentIds = (assessments ?? []).map((assessment) => assessment.id);
  const assessmentById = new Map(
    (assessments ?? []).map((assessment) => [assessment.id, assessment]),
  );
  const courseById = new Map(courses.map((course) => [course.id, course]));

  let submissions: TrainerSubmission[] = [];

  if (assessmentIds.length > 0) {
    const { data: attempts } = await supabase
      .from("assessment_attempts")
      .select(
        "id, assessment_id, status, score_points, max_points, passed, submitted_at, profiles(full_name, email)",
      )
      .in("assessment_id", assessmentIds)
      .in("status", ["submitted", "expired"])
      .order("submitted_at", { ascending: false })
      .limit(submissionLimit);

    submissions = (attempts ?? []).flatMap((attempt) => {
      const assessment = assessmentById.get(attempt.assessment_id);
      if (!assessment) return [];
      const course = courseById.get(assessment.course_id);
      const profile = relationOne(
        attempt.profiles as
          | { full_name: string | null; email: string }
          | { full_name: string | null; email: string }[]
          | null,
      );
      const scorePercent =
        attempt.score_points !== null &&
        attempt.max_points !== null &&
        attempt.max_points > 0
          ? Math.round((attempt.score_points * 100) / attempt.max_points)
          : null;

      return [
        {
          id: attempt.id,
          learnerName: profile?.full_name ?? profile?.email ?? "Learner",
          courseId: assessment.course_id,
          courseTitle: course?.title ?? assessment.title,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          scorePercent,
          passed: attempt.passed,
          submittedAt: attempt.submitted_at,
        },
      ];
    });
  }

  return {
    courses,
    publishedCourses: courses.filter((course) => course.status === "published").length,
    draftCourses: courses.filter((course) => course.status === "draft").length,
    learnerCount: learnerCount ?? 0,
    assessmentCount: assessments?.length ?? 0,
    submissionCount: submissions.length,
    certificateCount: certificateCount ?? 0,
    submissions,
  };
}

export async function getTrainerGradebook(user: CurrentUser): Promise<TrainerSubmission[]> {
  const dashboard = await getTrainerDashboardData(user, 100);
  return dashboard.submissions;
}

export type TrainerLearner = {
  enrolmentId: string;
  learnerName: string;
  learnerEmail: string;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  certificateCode: string | null;
};

export type TrainerAssessment = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  kind: string;
  status: string;
  passMarkPercent: number;
  maxAttempts: number;
  questionCount: number;
  attemptCount: number;
};

export type TrainerCertificate = {
  id: string;
  courseTitle: string;
  learnerName: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  revokedAt: string | null;
};

export async function getTrainerLearners(
  user: CurrentUser,
): Promise<TrainerLearner[]> {
  const courses = await listManagedCourses(user);
  const courseIds = courses.map((course) => course.id);
  if (courseIds.length === 0) return [];

  const supabase = await createClient();
  const { data: enrolments } = await supabase
    .from("course_enrolments")
    .select(
      "id, status, enrolled_at, completed_at, course_id, user_id, profiles(full_name, email), courses(id, title, course_modules(id, lessons(id)))",
    )
    .in("course_id", courseIds)
    .order("enrolled_at", { ascending: false });

  const rows = enrolments ?? [];
  if (rows.length === 0) return [];

  const enrolmentIds = rows.map((row) => row.id);
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const [{ data: progress }, { data: certificates }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("enrolment_id")
      .in("enrolment_id", enrolmentIds),
    supabase
      .from("certificates")
      .select("user_id, course_id, verification_code")
      .in("user_id", userIds)
      .in("course_id", courseIds)
      .is("revoked_at", null),
  ]);

  const completedByEnrolment = new Map<string, number>();
  for (const row of progress ?? []) {
    completedByEnrolment.set(
      row.enrolment_id,
      (completedByEnrolment.get(row.enrolment_id) ?? 0) + 1,
    );
  }
  const certificateByKey = new Map(
    (certificates ?? []).map((certificate) => [
      `${certificate.user_id}:${certificate.course_id}`,
      certificate.verification_code,
    ]),
  );

  return rows.flatMap((row) => {
    const course = relationOne(
      row.courses as
        | { id: string; title: string; course_modules: { lessons: { id: string }[] }[] }
        | { id: string; title: string; course_modules: { lessons: { id: string }[] }[] }[]
        | null,
    );
    if (!course) return [];
    const profile = relationOne(
      row.profiles as
        | { full_name: string | null; email: string }
        | { full_name: string | null; email: string }[]
        | null,
    );
    const totalLessons = (course.course_modules ?? []).reduce(
      (total, module) => total + (module.lessons?.length ?? 0),
      0,
    );
    const completedLessons = completedByEnrolment.get(row.id) ?? 0;
    const progressPercent =
      totalLessons === 0
        ? row.status === "completed"
          ? 100
          : 0
        : Math.round((completedLessons * 100) / totalLessons);

    return [
      {
        enrolmentId: row.id,
        learnerName: profile?.full_name ?? profile?.email ?? "Learner",
        learnerEmail: profile?.email ?? "",
        courseId: course.id,
        courseTitle: course.title,
        status: row.status,
        enrolledAt: row.enrolled_at,
        completedAt: row.completed_at,
        completedLessons,
        totalLessons,
        progressPercent,
        certificateCode:
          certificateByKey.get(`${row.user_id}:${row.course_id}`) ?? null,
      },
    ];
  });
}

export async function getTrainerAssessments(
  user: CurrentUser,
): Promise<TrainerAssessment[]> {
  const courses = await listManagedCourses(user);
  const courseIds = courses.map((course) => course.id);
  if (courseIds.length === 0) return [];

  const supabase = await createClient();
  const [{ data: assessments }, { data: attempts }] = await Promise.all([
    supabase
      .from("assessments")
      .select(
        "id, course_id, title, kind, status, pass_mark_percent, max_attempts, assessment_questions(id), courses(title)",
      )
      .in("course_id", courseIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("assessment_attempts")
      .select("assessment_id, status")
      .in("status", ["submitted", "expired"]),
  ]);

  const attemptByAssessment = new Map<string, number>();
  for (const attempt of attempts ?? []) {
    attemptByAssessment.set(
      attempt.assessment_id,
      (attemptByAssessment.get(attempt.assessment_id) ?? 0) + 1,
    );
  }
  const courseById = new Map(courses.map((course) => [course.id, course]));

  return (assessments ?? []).flatMap((assessment) => {
    const course = courseById.get(assessment.course_id);
    if (!course) return [];
    return [
      {
        id: assessment.id,
        courseId: assessment.course_id,
        courseTitle: course.title,
        title: assessment.title,
        kind: assessment.kind,
        status: assessment.status,
        passMarkPercent: assessment.pass_mark_percent,
        maxAttempts: assessment.max_attempts,
        questionCount: assessment.assessment_questions?.length ?? 0,
        attemptCount: attemptByAssessment.get(assessment.id) ?? 0,
      },
    ];
  });
}

export async function getTrainerCertificates(
  user: CurrentUser,
): Promise<TrainerCertificate[]> {
  const courses = await listManagedCourses(user);
  const courseIds = courses.map((course) => course.id);
  if (courseIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("certificates")
    .select(
      "id, course_id, learner_name, certificate_number, verification_code, issued_at, revoked_at, courses(title)",
    )
    .in("course_id", courseIds)
    .order("issued_at", { ascending: false });

  return (data ?? []).flatMap((certificate) => {
    const course = relationOne(
      certificate.courses as
        | { title: string }
        | { title: string }[]
        | null,
    );
    return [
      {
        id: certificate.id,
        courseTitle: course?.title ?? "Course",
        learnerName: certificate.learner_name,
        certificateNumber: certificate.certificate_number,
        verificationCode: certificate.verification_code,
        issuedAt: certificate.issued_at,
        revokedAt: certificate.revoked_at,
      },
    ];
  });
}
