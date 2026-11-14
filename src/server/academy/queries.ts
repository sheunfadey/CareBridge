import "server-only";

import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS } from "@/lib/permissions/registry";
import type { CurrentUser } from "@/server/auth/current-user";
import type {
  AssessmentAttemptStatus,
  AssessmentKind,
  AssessmentQuestionType,
  AssessmentStatus,
  CourseDifficulty,
  CourseStatus,
  EnrolmentStatus,
  LearningResourceKind,
} from "@/types/database";

export type AcademyCourseSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  priceMinorUnits: number;
  currency: string;
  scholarshipEligible: boolean;
  certificateEnabled: boolean;
  programmeTitle: string;
  providerName: string;
  moduleCount: number;
};

export type SyllabusLesson = {
  id: string;
  title: string;
  slug: string;
  estimatedMinutes: number;
  position: number;
  isRequired: boolean;
  isPreview: boolean;
};

export type SyllabusModule = {
  id: string;
  title: string;
  summary: string | null;
  position: number;
  isRequired: boolean;
  lessons: SyllabusLesson[];
};

export type AcademyCourseSyllabus = AcademyCourseSummary & {
  description: string | null;
  learningOutcomes: string[];
  prerequisites: string[];
  version: number;
  publishedAt: string | null;
  modules: SyllabusModule[];
  totalLessons: number;
};

export type LearningLesson = SyllabusLesson & {
  content: string;
  videoUrl: string | null;
  completedAt: string | null;
};

export type LearningModule = Omit<SyllabusModule, "lessons"> & {
  lessons: LearningLesson[];
};

export type CourseResource = {
  id: string;
  lessonId: string | null;
  title: string;
  kind: LearningResourceKind;
  externalUrl: string | null;
  storagePath: string | null;
  downloadUrl: string | null;
  isPrivate: boolean;
};

export type LearningCourse = Omit<AcademyCourseSyllabus, "modules"> & {
  modules: LearningModule[];
  enrolmentId: string;
  completedLessons: number;
  completedAt: string | null;
  resources: CourseResource[];
};

export type MyLearningCourse = {
  enrolmentId: string;
  status: EnrolmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  courseId: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImageUrl: string | null;
  category: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  courseStatus: CourseStatus;
  certificateEnabled: boolean;
  certificateId: string | null;
  certificateNumber: string | null;
  certificateCode: string | null;
  totalLessons: number;
  completedLessons: number;
};

export type CourseAssessment = {
  id: string;
  title: string;
  instructions: string | null;
  kind: AssessmentKind;
  passMarkPercent: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  isRequired: boolean;
  questionCount: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  bestScorePercent: number | null;
  passed: boolean;
  inProgress: boolean;
};

export type ManagedLearningResource = {
  id: string;
  lessonId: string | null;
  title: string;
  kind: LearningResourceKind;
  externalUrl: string | null;
  storagePath: string | null;
  downloadUrl: string | null;
  mimeType: string | null;
  isPrivate: boolean;
  position: number;
  createdAt: string;
};

export type ManagedAssessment = {
  id: string;
  title: string;
  kind: AssessmentKind;
  status: AssessmentStatus;
  isRequired: boolean;
  passMarkPercent: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  questionCount: number;
  totalPoints: number;
  attemptCount: number;
};

export type ManagedAssessmentDetail = ManagedAssessment & {
  courseId: string;
  courseTitle: string;
  instructions: string | null;
  questions: {
    id: string;
    prompt: string;
    questionType: AssessmentQuestionType;
    options: { id: string; label: string }[];
    correctOptionIds: string[];
    points: number;
    explanation: string | null;
    position: number;
  }[];
  attempts: {
    id: string;
    attemptNumber: number;
    status: AssessmentAttemptStatus;
    startedAt: string;
    submittedAt: string | null;
    scorePoints: number | null;
    maxPoints: number | null;
    passed: boolean | null;
    learnerName: string;
  }[];
};

function optionList(value: unknown): { id: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option) => {
    if (
      !option ||
      typeof option !== "object" ||
      typeof (option as { id?: unknown }).id !== "string" ||
      typeof (option as { label?: unknown }).label !== "string"
    ) {
      return [];
    }
    return [
      {
        id: (option as { id: string }).id,
        label: (option as { label: string }).label,
      },
    ];
  });
}

function answerList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export type ManagedCourse = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  difficulty: CourseDifficulty;
  isPublic: boolean;
  organisationId: string | null;
  organisationName: string | null;
  programmeTitle: string;
  categoryName: string | null;
  moduleCount: number;
  enrolmentCount: number;
  updatedAt: string;
};

export type ProgrammeOption = {
  id: string;
  title: string;
  organisationId: string | null;
};

export type OrganisationOption = {
  id: string;
  name: string;
};

export type CourseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organisationId: string | null;
  organisationName: string | null;
  sortOrder: number;
  isActive: boolean;
  canManage: boolean;
};

export type ManagedCourseDetail = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number;
  learningOutcomes: string[];
  prerequisites: string[];
  scholarshipEligible: boolean;
  certificateEnabled: boolean;
  status: CourseStatus;
  isPublic: boolean;
  organisationId: string | null;
  programmeId: string;
  programmeTitle: string;
  organisationName: string | null;
  publishedAt: string | null;
  modules: (Omit<SyllabusModule, "lessons"> & {
    lessons: (SyllabusLesson & {
      content: string;
      videoUrl: string | null;
    })[];
  })[];
  totalLessons: number;
};

export type IssuedCertificate = {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  learnerName: string;
  courseTitle: string;
  issuerName: string;
  credentialScope: string;
  disclaimer: string;
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  courseSlug: string;
};

export type CertificateVerification = {
  certificateNumber: string;
  learnerName: string;
  courseTitle: string;
  issuerName: string;
  credentialScope: string;
  disclaimer: string;
  issuedAt: string;
  revoked: boolean;
};

type Relation<T> = T | T[] | null;

function singleRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function canManageAcademyForOrganisation(
  organisation: CurrentUser["organisations"][number],
): boolean {
  return organisation.roles.some((role) =>
    (ROLE_PERMISSIONS[role] ?? []).includes("course_manage"),
  );
}

async function createSignedResourceUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const { data, error } = await supabase.storage
    .from("course-resources")
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    console.error("[academy] could not sign resource URLs", error);
    return new Map();
  }

  return new Map(
    (data ?? []).flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [],
    ),
  );
}

function normaliseModules(
  modules: {
    id: string;
    title: string;
    summary: string | null;
    position: number;
    is_required: boolean;
    lessons: {
      id: string;
      title: string;
      slug: string;
      estimated_minutes: number;
      position: number;
      is_required: boolean;
      is_preview: boolean;
    }[];
  }[],
): SyllabusModule[] {
  return [...modules]
    .sort((a, b) => a.position - b.position)
    .map((module) => ({
      id: module.id,
      title: module.title,
      summary: module.summary,
      position: module.position,
      isRequired: module.is_required,
      lessons: [...module.lessons]
        .sort((a, b) => a.position - b.position)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          estimatedMinutes: lesson.estimated_minutes,
          position: lesson.position,
          isRequired: lesson.is_required,
          isPreview: lesson.is_preview,
        })),
    }));
}

export async function getPublishedCourses(): Promise<{
  courses: AcademyCourseSummary[];
  unavailable: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, slug, summary, category, course_categories(name), difficulty, estimated_minutes, price_minor_units, currency, scholarship_eligible, certificate_enabled, programmes(title), organisations(name), course_modules(id)",
    )
    .eq("status", "published")
    .eq("is_public", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[academy] could not load published courses", error);
    return { courses: [], unavailable: true };
  }

  return {
    unavailable: false,
    courses: (data ?? []).map((course) => {
      const programme = singleRelation(course.programmes);
      const organisation = singleRelation(course.organisations);
      const category = singleRelation(course.course_categories);
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        summary: course.summary,
        category: category?.name ?? course.category,
        difficulty: course.difficulty,
        estimatedMinutes: course.estimated_minutes,
        priceMinorUnits: course.price_minor_units,
        currency: course.currency,
        scholarshipEligible: course.scholarship_eligible,
        certificateEnabled: course.certificate_enabled,
        programmeTitle: programme?.title ?? "HillCrest Academy",
        providerName: organisation?.name ?? "HillCrest Academy",
        moduleCount: course.course_modules?.length ?? 0,
      };
    }),
  };
}

export async function getPublishedCourseSyllabus(
  slug: string,
): Promise<AcademyCourseSyllabus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, slug, summary, description, category, course_categories(name), difficulty, estimated_minutes, price_minor_units, currency, scholarship_eligible, certificate_enabled, learning_outcomes, prerequisites, version, published_at, programmes(title), organisations(name), course_modules(id, title, summary, position, is_required, lessons(id, title, slug, estimated_minutes, position, is_required, is_preview))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[academy] could not load course syllabus", error);
    return null;
  }

  const modules = normaliseModules(data.course_modules ?? []);
  const programme = singleRelation(data.programmes);
  const organisation = singleRelation(data.organisations);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    category: singleRelation(data.course_categories)?.name ?? data.category,
    difficulty: data.difficulty,
    estimatedMinutes: data.estimated_minutes,
    priceMinorUnits: data.price_minor_units,
    currency: data.currency,
    scholarshipEligible: data.scholarship_eligible,
    certificateEnabled: data.certificate_enabled,
    learningOutcomes: data.learning_outcomes,
    prerequisites: data.prerequisites,
    version: data.version,
    publishedAt: data.published_at,
    programmeTitle: programme?.title ?? "HillCrest Academy",
    providerName: organisation?.name ?? "HillCrest Academy",
    moduleCount: modules.length,
    totalLessons: modules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    ),
    modules,
  };
}

export async function getEnrolment(
  courseId: string,
  userId: string,
): Promise<{ id: string; status: EnrolmentStatus; completedAt: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_enrolments")
    .select("id, status, completed_at")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[academy] could not load enrolment", error);
    return null;
  }

  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    completedAt: data.completed_at,
  };
}

export async function getCourseForLearning(
  courseId: string,
  userId: string,
): Promise<LearningCourse | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, slug, summary, description, category, course_categories(name), difficulty, estimated_minutes, price_minor_units, currency, scholarship_eligible, certificate_enabled, learning_outcomes, prerequisites, version, published_at, programmes(title), organisations(name), course_modules(id, title, summary, position, is_required, lessons(id, title, slug, content, video_url, estimated_minutes, position, is_required, is_preview))",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[academy] could not load course", error);
    return null;
  }

  const enrolment = await getEnrolment(courseId, userId);
  if (!enrolment || enrolment.status === "withdrawn") {
    return null;
  }

  const [{ data: progress }, { data: resources }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .eq("enrolment_id", enrolment.id),
    supabase
      .from("learning_resources")
      .select("id, lesson_id, title, kind, external_url, storage_path, is_private")
      .eq("course_id", courseId)
      .order("position", { ascending: true }),
  ]);

  const completedByLesson = new Map(
    (progress ?? []).map((row) => [row.lesson_id, row.completed_at]),
  );

  const learningModules: LearningModule[] = normaliseModules(
    data.course_modules ?? [],
  ).map((m) => ({
    ...m,
    lessons: m.lessons.map((lesson) => ({
      ...lesson,
      content: "",
      videoUrl: null,
      completedAt: completedByLesson.get(lesson.id) ?? null,
    })),
  }));

  const contentByLesson = new Map(
    (data.course_modules ?? []).flatMap((m) =>
      m.lessons.map((lesson) => [
        lesson.id,
        { content: lesson.content, videoUrl: lesson.video_url },
      ]),
    ),
  );

  for (const learningModule of learningModules) {
    for (const lesson of learningModule.lessons) {
      const content = contentByLesson.get(lesson.id);
      if (content) {
        lesson.content = content.content;
        lesson.videoUrl = content.videoUrl;
      }
    }
  }

  const signedResourceUrls = await createSignedResourceUrls(
    supabase,
    (resources ?? []).flatMap((resource) =>
      resource.storage_path ? [resource.storage_path] : [],
    ),
  );

  const programme = singleRelation(data.programmes);
  const organisation = singleRelation(data.organisations);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    category: singleRelation(data.course_categories)?.name ?? data.category,
    difficulty: data.difficulty,
    estimatedMinutes: data.estimated_minutes,
    priceMinorUnits: data.price_minor_units,
    currency: data.currency,
    scholarshipEligible: data.scholarship_eligible,
    certificateEnabled: data.certificate_enabled,
    learningOutcomes: data.learning_outcomes,
    prerequisites: data.prerequisites,
    version: data.version,
    publishedAt: data.published_at,
    programmeTitle: programme?.title ?? "HillCrest Academy",
    providerName: organisation?.name ?? "HillCrest Academy",
    moduleCount: learningModules.length,
    totalLessons: learningModules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    ),
    modules: learningModules,
    enrolmentId: enrolment.id,
    completedLessons: completedByLesson.size,
    completedAt: enrolment.completedAt,
    resources: (resources ?? []).map((resource) => ({
      id: resource.id,
      lessonId: resource.lesson_id,
      title: resource.title,
      kind: resource.kind,
      externalUrl: resource.external_url,
      storagePath: resource.storage_path,
      downloadUrl: resource.storage_path
        ? signedResourceUrls.get(resource.storage_path) ?? null
        : null,
      isPrivate: resource.is_private,
    })),
  };
}

export async function getMyLearning(userId: string): Promise<MyLearningCourse[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_enrolments")
    .select(
      "id, status, enrolled_at, completed_at, course_id, courses(id, title, slug, summary, cover_image_url, category, difficulty, estimated_minutes, status, certificate_enabled, course_modules(id, lessons(id)))",
    )
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });

  if (error) {
    console.error("[academy] could not load learning", error);
    return [];
  }

  const enrolments = data ?? [];
  if (enrolments.length === 0) return [];

  const enrolmentIds = enrolments.map((row) => row.id);
  const courseIds = enrolments.map((row) => row.course_id);

  const [{ data: progress }, { data: certificates }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("enrolment_id, lesson_id")
      .in("enrolment_id", enrolmentIds),
    supabase
      .from("certificates")
      .select("id, course_id, certificate_number, verification_code")
      .eq("user_id", userId)
      .in("course_id", courseIds),
  ]);

  const completedByEnrolment = new Map<string, number>();
  for (const row of progress ?? []) {
    completedByEnrolment.set(
      row.enrolment_id,
      (completedByEnrolment.get(row.enrolment_id) ?? 0) + 1,
    );
  }

  const certificateByCourse = new Map(
    (certificates ?? []).map((certificate) => [
      certificate.course_id,
      certificate,
    ]),
  );

  return enrolments.flatMap((enrolment) => {
    const course = singleRelation(enrolment.courses);
    if (!course) return [];
    const certificate = certificateByCourse.get(course.id);
    const totalLessons = (course.course_modules ?? []).reduce(
      (total, module) => total + (module.lessons?.length ?? 0),
      0,
    );

    return [
      {
        enrolmentId: enrolment.id,
        status: enrolment.status,
        enrolledAt: enrolment.enrolled_at,
        completedAt: enrolment.completed_at,
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        summary: course.summary,
        coverImageUrl: course.cover_image_url,
        category: course.category,
        difficulty: course.difficulty,
        estimatedMinutes: course.estimated_minutes,
        courseStatus: course.status,
        certificateEnabled: course.certificate_enabled,
        certificateId: certificate?.id ?? null,
        certificateNumber: certificate?.certificate_number ?? null,
        certificateCode: certificate?.verification_code ?? null,
        totalLessons,
        completedLessons: completedByEnrolment.get(enrolment.id) ?? 0,
      },
    ];
  });
}

export async function listManagedCourses(
  user: CurrentUser,
): Promise<ManagedCourse[]> {
  const supabase = await createClient();
  const managedOrganisations = user.isSuperAdmin
    ? []
    : user.organisations
        .filter(canManageAcademyForOrganisation)
        .map((org) => org.organisationId);

  if (!user.isSuperAdmin && managedOrganisations.length === 0) {
    return [];
  }

  let query = supabase
    .from("courses")
    .select(
      "id, title, slug, status, difficulty, is_public, organisation_id, category, updated_at, course_categories(name), programmes(title), organisations(name), course_modules(id), course_enrolments(id)",
    )
    .order("updated_at", { ascending: false });

  if (!user.isSuperAdmin) {
    query = query.in("organisation_id", managedOrganisations);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[academy] could not load managed courses", error);
    return [];
  }

  return (data ?? []).map((course) => {
    const programme = singleRelation(course.programmes);
    const organisation = singleRelation(course.organisations);
    const category = singleRelation(course.course_categories);
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      difficulty: course.difficulty,
      isPublic: course.is_public,
      organisationId: course.organisation_id,
      organisationName: organisation?.name ?? null,
      programmeTitle: programme?.title ?? "HillCrest Academy",
      categoryName: category?.name ?? course.category,
      moduleCount: course.course_modules?.length ?? 0,
      enrolmentCount: course.course_enrolments?.length ?? 0,
      updatedAt: course.updated_at,
    };
  });
}

export async function listCourseAssessments(
  courseId: string,
  userId: string,
): Promise<CourseAssessment[]> {
  const enrolment = await getEnrolment(courseId, userId);
  if (!enrolment || enrolment.status === "withdrawn") return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, title, instructions, kind, pass_mark_percent, max_attempts, time_limit_minutes, is_required, assessment_questions(id)",
    )
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[academy] could not load assessments", error);
    return [];
  }

  const assessments = data ?? [];
  if (assessments.length === 0) return [];

  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select(
      "assessment_id, status, score_points, max_points, passed, submitted_at",
    )
    .eq("enrolment_id", enrolment.id)
    .in(
      "assessment_id",
      assessments.map((assessment) => assessment.id),
    );

  const attemptsByAssessment = new Map<
    string,
    {
      status: AssessmentAttemptStatus;
      scorePoints: number | null;
      maxPoints: number | null;
      passed: boolean | null;
    }[]
  >();
  for (const attempt of attempts ?? []) {
    const list = attemptsByAssessment.get(attempt.assessment_id) ?? [];
    list.push({
      status: attempt.status,
      scorePoints: attempt.score_points,
      maxPoints: attempt.max_points,
      passed: attempt.passed,
    });
    attemptsByAssessment.set(attempt.assessment_id, list);
  }

  return assessments.map((assessment) => {
    const rows = attemptsByAssessment.get(assessment.id) ?? [];
    const used = rows.filter(
      (row) => row.status === "submitted" || row.status === "expired",
    ).length;
    const scores = rows.flatMap((row) =>
      row.status === "submitted" &&
      row.scorePoints !== null &&
      row.maxPoints !== null &&
      row.maxPoints > 0
        ? [Math.round((row.scorePoints * 100) / row.maxPoints)]
        : [],
    );

    return {
      id: assessment.id,
      title: assessment.title,
      instructions: assessment.instructions,
      kind: assessment.kind,
      passMarkPercent: assessment.pass_mark_percent,
      maxAttempts: assessment.max_attempts,
      timeLimitMinutes: assessment.time_limit_minutes,
      isRequired: assessment.is_required,
      questionCount: assessment.assessment_questions?.length ?? 0,
      attemptsUsed: used,
      attemptsRemaining: Math.max(0, assessment.max_attempts - used),
      bestScorePercent: scores.length ? Math.max(...scores) : null,
      passed: rows.some((row) => row.passed === true),
      inProgress: rows.some((row) => row.status === "in_progress"),
    };
  });
}

export async function listManagedResources(
  courseId: string,
): Promise<ManagedLearningResource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_resources")
    .select(
      "id, lesson_id, title, kind, external_url, storage_path, mime_type, size_bytes, is_private, position, created_at",
    )
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[academy] could not load learning resources", error);
    return [];
  }

  const signedUrls = await createSignedResourceUrls(
    supabase,
    (data ?? []).flatMap((resource) =>
      resource.storage_path ? [resource.storage_path] : [],
    ),
  );

  return (data ?? []).map((resource) => ({
    id: resource.id,
    lessonId: resource.lesson_id,
    title: resource.title,
    kind: resource.kind,
    externalUrl: resource.external_url,
    storagePath: resource.storage_path,
    downloadUrl: resource.storage_path
      ? signedUrls.get(resource.storage_path) ?? null
      : null,
    mimeType: resource.mime_type,
    isPrivate: resource.is_private,
    position: resource.position,
    createdAt: resource.created_at,
  }));
}

export async function listManagedAssessments(
  courseId: string,
): Promise<ManagedAssessment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, title, kind, status, is_required, pass_mark_percent, max_attempts, time_limit_minutes, assessment_questions(id, points), assessment_attempts(id)",
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[academy] could not load managed assessments", error);
    return [];
  }

  return (data ?? []).map((assessment) => ({
    id: assessment.id,
    title: assessment.title,
    kind: assessment.kind,
    status: assessment.status,
    isRequired: assessment.is_required,
    passMarkPercent: assessment.pass_mark_percent,
    maxAttempts: assessment.max_attempts,
    timeLimitMinutes: assessment.time_limit_minutes,
    questionCount: assessment.assessment_questions?.length ?? 0,
    totalPoints: (assessment.assessment_questions ?? []).reduce(
      (total, question) => total + question.points,
      0,
    ),
    attemptCount: assessment.assessment_attempts?.length ?? 0,
  }));
}

export async function getManagedAssessmentDetail(
  courseId: string,
  assessmentId: string,
  user: CurrentUser,
): Promise<ManagedAssessmentDetail | null> {
  if (
    !user.isSuperAdmin &&
    !user.permissions.has("course_manage") &&
    !user.permissions.has("assessment_manage")
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select(
      "id, course_id, title, instructions, kind, status, is_required, pass_mark_percent, max_attempts, time_limit_minutes, courses(id, title, organisation_id), assessment_questions(id, prompt, question_type, options, correct_answer, points, explanation, position)",
    )
    .eq("id", assessmentId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[academy] could not load assessment", error);
    return null;
  }

  const course = singleRelation(data.courses);
  if (!course) return null;

  if (!user.isSuperAdmin && course.organisation_id) {
    const allowed = user.organisations.some(
      (org) =>
        org.organisationId === course.organisation_id &&
        canManageAcademyForOrganisation(org),
    );
    if (!allowed) return null;
  }

  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select(
      "id, attempt_number, status, started_at, submitted_at, score_points, max_points, passed, profiles(full_name, email)",
    )
    .eq("assessment_id", assessmentId)
    .order("submitted_at", { ascending: false });

  const questions = [...(data.assessment_questions ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  return {
    id: data.id,
    courseId: data.course_id,
    courseTitle: course.title,
    title: data.title,
    instructions: data.instructions,
    kind: data.kind,
    status: data.status,
    isRequired: data.is_required,
    passMarkPercent: data.pass_mark_percent,
    maxAttempts: data.max_attempts,
    timeLimitMinutes: data.time_limit_minutes,
    questionCount: questions.length,
    totalPoints: questions.reduce((total, question) => total + question.points, 0),
    attemptCount: attempts?.length ?? 0,
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      questionType: question.question_type,
      options: optionList(question.options),
      correctOptionIds: answerList(question.correct_answer),
      points: question.points,
      explanation: question.explanation,
      position: question.position,
    })),
    attempts: (attempts ?? []).map((attempt) => {
      const profile = singleRelation(attempt.profiles);
      return {
        id: attempt.id,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        scorePoints: attempt.score_points,
        maxPoints: attempt.max_points,
        passed: attempt.passed,
        learnerName:
          profile?.full_name ?? profile?.email ?? "Learner",
      };
    }),
  };
}

export async function listCourseCategories(
  user: CurrentUser,
): Promise<CourseCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_categories")
    .select(
      "id, name, slug, description, organisation_id, sort_order, is_active, organisations(name)",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[academy] could not load course categories", error);
    return [];
  }

  return (data ?? []).map((category) => {
    const organisation = singleRelation(category.organisations);
    const canManage = user.isSuperAdmin
      ? true
      : category.organisation_id
        ? user.organisations.some(
            (org) =>
              org.organisationId === category.organisation_id &&
              canManageAcademyForOrganisation(org),
          )
        : false;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      organisationId: category.organisation_id,
      organisationName: organisation?.name ?? null,
      sortOrder: category.sort_order,
      isActive: category.is_active,
      canManage,
    };
  });
}

export async function listProgrammeOptions(): Promise<ProgrammeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programmes")
    .select("id, title, organisation_id")
    .eq("status", "active")
    .order("title", { ascending: true });

  if (error) {
    console.error("[academy] could not load programmes", error);
    return [];
  }

  return (data ?? []).map((programme) => ({
    id: programme.id,
    title: programme.title,
    organisationId: programme.organisation_id,
  }));
}

export function managedOrganisationOptions(
  user: CurrentUser,
): OrganisationOption[] {
  if (user.isSuperAdmin) {
    return user.organisations.map((org) => ({
      id: org.organisationId,
      name: org.organisationName,
    }));
  }
  return user.organisations
    .filter(canManageAcademyForOrganisation)
    .map((org) => ({
      id: org.organisationId,
      name: org.organisationName,
    }));
}

export async function verifyCertificate(
  code: string,
): Promise<CertificateVerification | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_certificate", {
    p_code: code.trim(),
  });

  if (error) {
    console.error("[academy] certificate verification failed", error);
    return null;
  }

  const result = data?.[0];
  if (!result) return null;
  return {
    certificateNumber: result.certificate_number,
    learnerName: result.learner_name,
    courseTitle: result.course_title,
    issuerName: result.issuer_name,
    credentialScope: result.credential_scope,
    disclaimer: result.disclaimer,
    issuedAt: result.issued_at,
    revoked: result.revoked,
  };
}

export async function getManagedCourseDetail(
  courseId: string,
  user: CurrentUser,
): Promise<ManagedCourseDetail | null> {
  if (
    !user.isSuperAdmin &&
    !user.permissions.has("course_manage") &&
    !user.permissions.has("course_publish") &&
    !user.permissions.has("learning_material_manage")
  ) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, slug, summary, description, category, course_categories(name), difficulty, estimated_minutes, learning_outcomes, prerequisites, scholarship_eligible, certificate_enabled, status, is_public, organisation_id, programme_id, published_at, programmes(title), organisations(name), course_modules(id, title, summary, position, is_required, lessons(id, title, slug, content, video_url, estimated_minutes, position, is_required, is_preview))",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[academy] could not load managed course", error);
    return null;
  }

  if (!user.isSuperAdmin && data.organisation_id) {
    const allowed = user.organisations.some(
      (org) =>
        org.organisationId === data.organisation_id &&
        canManageAcademyForOrganisation(org),
    );
    if (!allowed) return null;
  }

  const syllabusModules = normaliseModules(data.course_modules ?? []).map((m) => {
    const rawModule = (data.course_modules ?? []).find((rm) => rm.id === m.id);
    return {
      ...m,
      lessons: m.lessons.map((lesson) => {
        const rawLesson = (rawModule?.lessons ?? []).find((l) => l.id === lesson.id);
        return {
          ...lesson,
          content: rawLesson?.content ?? "",
          videoUrl: rawLesson?.video_url ?? null,
        };
      }),
    };
  });

  const programme = singleRelation(data.programmes);
  const organisation = singleRelation(data.organisations);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    description: data.description,
    category: singleRelation(data.course_categories)?.name ?? data.category,
    difficulty: data.difficulty,
    estimatedMinutes: data.estimated_minutes,
    learningOutcomes: data.learning_outcomes,
    prerequisites: data.prerequisites,
    scholarshipEligible: data.scholarship_eligible,
    certificateEnabled: data.certificate_enabled,
    status: data.status,
    isPublic: data.is_public,
    organisationId: data.organisation_id,
    programmeId: data.programme_id,
    programmeTitle: programme?.title ?? "HillCrest Academy",
    organisationName: organisation?.name ?? null,
    publishedAt: data.published_at,
    modules: syllabusModules,
    totalLessons: syllabusModules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    ),
  };
}

export async function listIssuedCertificates(
  user: CurrentUser,
): Promise<IssuedCertificate[]> {
  const supabase = await createClient();
  let query = supabase
    .from("certificates")
    .select(
      "id, certificate_number, verification_code, learner_name, course_title, issuer_name, credential_scope, disclaimer, issued_at, revoked_at, revoked_reason, courses(slug)",
    )
    .order("issued_at", { ascending: false });

  if (!user.isSuperAdmin && !user.permissions.has("course_publish")) {
    query = query.eq("user_id", user.id);
  } else if (!user.isSuperAdmin) {
    const orgs = user.organisations
      .filter(canManageAcademyForOrganisation)
      .map((org) => org.organisationId);

    if (orgs.length === 0) return [];

    const { data: courseIds } = await supabase
      .from("courses")
      .select("id")
      .in("organisation_id", orgs);

    const ids = (courseIds ?? []).map((row) => row.id);
    if (ids.length === 0) return [];
    query = query.in("course_id", ids);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[academy] could not load certificates", error);
    return [];
  }

  return (data ?? []).map((certificate) => {
    const course = singleRelation(certificate.courses);
    return {
      id: certificate.id,
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code,
      learnerName: certificate.learner_name,
      courseTitle: certificate.course_title,
      issuerName: certificate.issuer_name,
      credentialScope: certificate.credential_scope,
      disclaimer: certificate.disclaimer,
      issuedAt: certificate.issued_at,
      revokedAt: certificate.revoked_at,
      revokedReason: certificate.revoked_reason,
      courseSlug: course?.slug ?? "",
    };
  });
}

export async function getAcademyFacts(userId: string): Promise<{
  activeEnrolments: number;
  completedCourses: number;
  certificates: number;
}> {
  const supabase = await createClient();
  const [{ count: active }, { count: completed }, { count: certificates }] =
    await Promise.all([
      supabase
        .from("course_enrolments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("course_enrolments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("revoked_at", null),
    ]);

  return {
    activeEnrolments: active ?? 0,
    completedCourses: completed ?? 0,
    certificates: certificates ?? 0,
  };
}
