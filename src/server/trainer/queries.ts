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
