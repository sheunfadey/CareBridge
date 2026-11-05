"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createAssessmentQuestionSchema,
  createAssessmentSchema,
  createCourseCategorySchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  learningResourceSchema,
  linesToArray,
  parseCorrectOptionIds,
  slugify,
  updateCourseSchema,
  type CreateAssessmentInput,
  type CreateAssessmentQuestionInput,
  type CreateCourseCategoryInput,
  type CreateCourseInput,
  type CreateLessonInput,
  type CreateModuleInput,
  type LearningResourceInput,
  type UpdateCourseInput,
} from "@/lib/validation/academy";
import { getCurrentUser, type CurrentUser } from "@/server/auth/current-user";
import {
  AuthorisationError,
  assertPermission,
} from "@/server/auth/guards";
import { assertCanManageCourse } from "@/server/academy/guards";
import { recordAudit } from "@/server/audit/record-audit";
import type { Json } from "@/types/database";

export type AcademyActionResult =
  | {
      ok: true;
      message?: string;
      redirectTo?: string;
      certificateId?: string | null;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type CompleteLessonResult =
  | {
      ok: true;
      courseCompleted: boolean;
      completedLessons: number;
      totalLessons: number;
      certificateId: string | null;
    }
  | { ok: false; message: string };

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

function toFriendlyError(error: unknown): AcademyActionResult {
  if (error instanceof AuthorisationError) {
    return {
      ok: false,
      message:
        error.code === "UNAUTHENTICATED"
          ? "Sign in to continue."
          : "You do not have permission to do that.",
    };
  }
  console.error("[academy] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

async function uniqueCourseSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string> {
  const base = slugify(title) || "course";
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", base)
    .maybeSingle();

  if (!data) return base;
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

async function loadCourseForManagement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, organisation_id, status, published_at, is_public")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) {
    throw new AuthorisationError("Course not found", "FORBIDDEN");
  }
  return data;
}

export async function createCourseAction(
  input: CreateCourseInput,
): Promise<AcademyActionResult> {
  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const organisationId = parsed.data.organisationId || null;

    await assertPermission(user.id, "course_manage", organisationId);

    const supabase = await createClient();
    const { data: programme, error: programmeError } = await supabase
      .from("programmes")
      .select("id, organisation_id, status")
      .eq("id", parsed.data.programmeId)
      .maybeSingle();

    if (programmeError || !programme || programme.status !== "active") {
      return {
        ok: false,
        message: "That programme is not available for new courses.",
      };
    }

    if (
      programme.organisation_id &&
      programme.organisation_id !== organisationId
    ) {
      return {
        ok: false,
        message: "That programme belongs to another organisation.",
      };
    }

    let categoryId: string | null = null;
    let categoryName = parsed.data.category || null;

    if (parsed.data.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from("course_categories")
        .select("id, name, organisation_id, is_active")
        .eq("id", parsed.data.categoryId)
        .maybeSingle();

      if (categoryError || !category || !category.is_active) {
        return { ok: false, message: "That course category is not available." };
      }

      if (
        category.organisation_id &&
        category.organisation_id !== organisationId
      ) {
        return {
          ok: false,
          message: "That category belongs to another organisation.",
        };
      }

      categoryId = category.id;
      categoryName = category.name;
    }

    const slug = await uniqueCourseSlug(supabase, parsed.data.title);
    const organisationName =
      user.organisations.find((org) => org.organisationId === organisationId)
        ?.organisationName ?? "CareBridge Academy";

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        programme_id: parsed.data.programmeId,
        organisation_id: organisationId,
        title: parsed.data.title,
        slug,
        summary: parsed.data.summary,
        description: parsed.data.description,
        category: categoryName,
        category_id: categoryId,
        learning_outcomes: linesToArray(parsed.data.learningOutcomes),
        prerequisites: linesToArray(parsed.data.prerequisites),
        difficulty: parsed.data.difficulty,
        estimated_minutes: parsed.data.estimatedMinutes,
        instructor_id: user.id,
        status: "draft",
        price_minor_units: 0,
        currency: "NGN",
        scholarship_eligible: parsed.data.scholarshipEligible,
        certificate_enabled: parsed.data.certificateEnabled,
        certificate_issuer: organisationName,
        is_public: true,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !course) {
      return {
        ok: false,
        message:
          error?.code === "23505"
            ? "A course with a similar title already exists. Adjust the title and try again."
            : "We could not create the course.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId,
      action: "course.created",
      entityType: "course",
      entityId: course.id,
      metadata: { title: parsed.data.title, slug, categoryId },
    });

    revalidatePath("/dashboard/academy");
    revalidatePath("/dashboard/academy/manage");
    revalidatePath("/courses");
    return {
      ok: true,
      message: "Course created as a draft.",
      redirectTo: `/dashboard/academy/manage/${course.id}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function createCourseCategoryAction(
  input: CreateCourseCategoryInput,
): Promise<AcademyActionResult> {
  const parsed = createCourseCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const organisationId = parsed.data.organisationId || null;

    if (organisationId) {
      await assertPermission(user.id, "course_manage", organisationId);
    } else if (!user.isSuperAdmin) {
      return {
        ok: false,
        message: "Only a platform administrator can create global categories.",
      };
    }

    const supabase = await createClient();
    const slug = slugify(parsed.data.name) || "category";

    let duplicateQuery = supabase
      .from("course_categories")
      .select("id")
      .eq("slug", slug);
    duplicateQuery = organisationId
      ? duplicateQuery.eq("organisation_id", organisationId)
      : duplicateQuery.is("organisation_id", null);

    const { data: duplicate } = await duplicateQuery.maybeSingle();
    if (duplicate) {
      return {
        ok: false,
        message: "A category with that name already exists.",
      };
    }

    const { data: category, error } = await supabase
      .from("course_categories")
      .insert({
        organisation_id: organisationId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        sort_order: parsed.data.sortOrder,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !category) {
      return {
        ok: false,
        message:
          error?.code === "23505"
            ? "A category with that name already exists."
            : "We could not create the category.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId,
      action: "course.category.created",
      entityType: "course_category",
      entityId: category.id,
      metadata: { name: parsed.data.name, slug },
    });

    revalidatePath("/dashboard/academy/manage");
    revalidatePath("/dashboard/academy/manage/categories");
    revalidatePath("/dashboard/academy/manage/new");
    return { ok: true, message: "Category created." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function setCourseCategoryActiveAction(
  categoryId: string,
  active: boolean,
): Promise<AcademyActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: category, error: categoryError } = await supabase
      .from("course_categories")
      .select("id, name, organisation_id")
      .eq("id", categoryId)
      .maybeSingle();

    if (categoryError || !category) {
      return { ok: false, message: "That category is not available." };
    }

    if (category.organisation_id) {
      await assertPermission(
        user.id,
        "course_manage",
        category.organisation_id,
      );
    } else if (!user.isSuperAdmin) {
      return {
        ok: false,
        message: "Only a platform administrator can change global categories.",
      };
    }

    const { error } = await supabase
      .from("course_categories")
      .update({ is_active: active })
      .eq("id", category.id);

    if (error) {
      return { ok: false, message: "We could not update the category." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: category.organisation_id,
      action: "course.category.updated",
      entityType: "course_category",
      entityId: category.id,
      metadata: { name: category.name, active },
    });

    revalidatePath("/dashboard/academy/manage");
    revalidatePath("/dashboard/academy/manage/categories");
    revalidatePath("/dashboard/academy/manage/new");
    return {
      ok: true,
      message: active ? "Category activated." : "Category archived.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function updateCourseAction(
  input: UpdateCourseInput,
): Promise<AcademyActionResult> {
  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const course = await loadCourseForManagement(
      supabase,
      parsed.data.courseId,
    );

    await assertPermission(
      user.id,
      "course_manage",
      course.organisation_id,
    );

    const { error } = await supabase
      .from("courses")
      .update({
        title: parsed.data.title,
        summary: parsed.data.summary,
        description: parsed.data.description,
        category: parsed.data.category || null,
        learning_outcomes: linesToArray(parsed.data.learningOutcomes),
        prerequisites: linesToArray(parsed.data.prerequisites),
        difficulty: parsed.data.difficulty,
        estimated_minutes: parsed.data.estimatedMinutes,
        scholarship_eligible: parsed.data.scholarshipEligible,
        certificate_enabled: parsed.data.certificateEnabled,
      })
      .eq("id", course.id);

    if (error) {
      return { ok: false, message: "We could not update the course." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: "course.updated",
      entityType: "course",
      entityId: course.id,
      metadata: { title: parsed.data.title },
    });

    revalidatePath(`/dashboard/academy/manage/${course.id}`);
    revalidatePath(`/courses/${course.slug}`);
    return { ok: true, message: "Course details saved." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function setCoursePublicationAction(
  courseId: string,
  publish: boolean,
): Promise<AcademyActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const course = await loadCourseForManagement(supabase, courseId);

    await assertPermission(
      user.id,
      "course_publish",
      course.organisation_id,
    );

    if (publish) {
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id, lessons(id)")
        .eq("course_id", courseId);

      const lessonCount = (modules ?? []).reduce(
        (total, module) => total + (module.lessons?.length ?? 0),
        0,
      );

      if (lessonCount === 0) {
        return {
          ok: false,
          message: "Add at least one lesson before publishing.",
        };
      }
    }

    const { error } = await supabase
      .from("courses")
      .update({
        status: publish ? "published" : "draft",
        published_at: publish
          ? (course.published_at ?? new Date().toISOString())
          : course.published_at,
      })
      .eq("id", courseId);

    if (error) {
      return {
        ok: false,
        message: publish
          ? "We could not publish the course."
          : "We could not unpublish the course.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: publish ? "course.published" : "course.unpublished",
      entityType: "course",
      entityId: courseId,
    });

    revalidatePath("/dashboard/academy");
    revalidatePath("/dashboard/academy/manage");
    revalidatePath(`/dashboard/academy/manage/${courseId}`);
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);

    return {
      ok: true,
      message: publish ? "Course published." : "Course returned to draft.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function addModuleAction(
  input: CreateModuleInput,
): Promise<AcademyActionResult> {
  const parsed = createModuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const course = await loadCourseForManagement(
      supabase,
      parsed.data.courseId,
    );

    await assertCanManageCourse(course.id);
    await assertPermission(
      user.id,
      "learning_material_manage",
      course.organisation_id,
    );

    const { data: lastModule } = await supabase
      .from("course_modules")
      .select("position")
      .eq("course_id", course.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: module, error } = await supabase
      .from("course_modules")
      .insert({
        course_id: course.id,
        title: parsed.data.title,
        summary: parsed.data.summary || null,
        position: (lastModule?.position ?? 0) + 1,
        is_required: parsed.data.isRequired,
      })
      .select("id")
      .single();

    if (error || !module) {
      return { ok: false, message: "We could not add the module." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: "course.module.created",
      entityType: "course_module",
      entityId: module.id,
      metadata: { courseId: course.id, title: parsed.data.title },
    });

    revalidatePath(`/dashboard/academy/manage/${course.id}`);
    return { ok: true, message: "Module added." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function addLessonAction(
  input: CreateLessonInput,
): Promise<AcademyActionResult> {
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: module, error: moduleError } = await supabase
      .from("course_modules")
      .select("id, course_id, courses(id, organisation_id)")
      .eq("id", parsed.data.moduleId)
      .maybeSingle();

    const course = module ? singleCourse(module.courses) : null;

    if (moduleError || !module || !course) {
      return { ok: false, message: "That module is not available." };
    }

    await assertCanManageCourse(course.id);
    await assertPermission(
      user.id,
      "learning_material_manage",
      course.organisation_id,
    );

    const { data: lastLesson } = await supabase
      .from("lessons")
      .select("position")
      .eq("module_id", module.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: lesson, error } = await supabase
      .from("lessons")
      .insert({
        module_id: module.id,
        title: parsed.data.title,
        slug: `${slugify(parsed.data.title) || "lesson"}-${crypto.randomUUID().slice(0, 6)}`,
        content: parsed.data.content,
        video_url: parsed.data.videoUrl || null,
        estimated_minutes: parsed.data.estimatedMinutes,
        position: (lastLesson?.position ?? 0) + 1,
        is_required: parsed.data.isRequired,
        is_preview: parsed.data.isPreview,
      })
      .select("id")
      .single();

    if (error || !lesson) {
      return { ok: false, message: "We could not add the lesson." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: "course.lesson.created",
      entityType: "lesson",
      entityId: lesson.id,
      metadata: { courseId: course.id, title: parsed.data.title },
    });

    revalidatePath(`/dashboard/academy/manage/${course.id}`);
    return { ok: true, message: "Lesson added." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function addLearningResourceAction(
  input: LearningResourceInput,
): Promise<AcademyActionResult> {
  const parsed = learningResourceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const course = await loadCourseForManagement(
      supabase,
      parsed.data.courseId,
    );

    await assertCanManageCourse(course.id);
    await assertPermission(
      user.id,
      "learning_material_manage",
      course.organisation_id,
    );

    if (!parsed.data.externalUrl) {
      return {
        ok: false,
        message: "Add a link to the document, audio, video or resource.",
      };
    }

    if (parsed.data.lessonId) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id, course_modules(course_id)")
        .eq("id", parsed.data.lessonId)
        .maybeSingle();

      const lessonModule = lesson ? singleCourse(lesson.course_modules) : null;
      if (!lesson || lessonModule?.course_id !== course.id) {
        return { ok: false, message: "That lesson is not part of this course." };
      }
    }

    const { data: lastResource } = await supabase
      .from("learning_resources")
      .select("position")
      .eq("course_id", course.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: resource, error } = await supabase
      .from("learning_resources")
      .insert({
        course_id: course.id,
        lesson_id: parsed.data.lessonId || null,
        title: parsed.data.title,
        kind: parsed.data.kind,
        external_url: parsed.data.externalUrl,
        mime_type: parsed.data.mimeType || null,
        is_private: parsed.data.isPrivate,
        position: (lastResource?.position ?? 0) + 1,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !resource) {
      return { ok: false, message: "We could not add that resource." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: "course.resource.created",
      entityType: "learning_resource",
      entityId: resource.id,
      metadata: {
        courseId: course.id,
        kind: parsed.data.kind,
        lessonId: parsed.data.lessonId || null,
      },
    });

    revalidatePath(`/dashboard/academy/manage/${course.id}`);
    revalidatePath(`/dashboard/academy/learning/${course.id}`);
    return { ok: true, message: "Resource added." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

function singleCourse<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export async function enrolAction(
  courseId: string,
): Promise<AcademyActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("enrol_in_course", {
      p_course: courseId,
    });

    if (error || !data) {
      const message = error?.message.toLowerCase() ?? "";
      return {
        ok: false,
        message: message.includes("paid")
          ? "This is a paid course. Buy it from the course page to enrol."
          : message.includes("published")
            ? "This course is not open for enrolment."
            : message.includes("closed") || message.includes("limit")
              ? "Enrolment for this course is currently closed."
              : "We could not enrol you in this course.",
      };
    }

    const user = await requireUser();
    await recordAudit({
      actorId: user.id,
      action: "course.enrolled",
      entityType: "course_enrolment",
      entityId: data,
      metadata: { courseId },
    });

    revalidatePath("/dashboard/academy");
    revalidatePath("/dashboard/academy/learning");
    revalidatePath(`/dashboard/academy/learning/${courseId}`);
    revalidatePath(`/courses`);

    return {
      ok: true,
      message: "You are enrolled.",
      redirectTo: `/dashboard/academy/learning/${courseId}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export type AssessmentAttemptQuestion = {
  id: string;
  prompt: string;
  questionType: "single_choice" | "multiple_choice" | "true_false";
  options: { id: string; label: string }[];
  points: number;
  position: number;
};

export type AssessmentAttemptStart = {
  attemptId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string | null;
  passMarkPercent: number;
  maxAttempts: number;
  questions: AssessmentAttemptQuestion[];
};

export type AssessmentAttemptSubmission = {
  scorePoints: number;
  maxPoints: number;
  scorePercent: number;
  passed: boolean;
  passMarkPercent: number;
  results: {
    questionId: string;
    correctOptionIds: string[];
    isCorrect: boolean;
    awardedPoints: number;
    explanation: string | null;
  }[];
  courseCompleted: boolean;
  certificateId: string | null;
};

export type StartAssessmentResult =
  | { ok: true; attempt: AssessmentAttemptStart }
  | { ok: false; message: string };

export type SubmitAssessmentResult =
  | { ok: true; result: AssessmentAttemptSubmission }
  | { ok: false; message: string };

function assessmentFriendlyMessage(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("no questions")) {
    return "This assessment has no questions yet. Contact your instructor.";
  }
  if (lower.includes("no attempts")) {
    return "No attempts remain for this assessment. Contact your instructor if you need another attempt.";
  }
  if (lower.includes("not open")) {
    return "This assessment is not open.";
  }
  if (lower.includes("enrol")) {
    return "Enrol in this course before taking its assessments.";
  }
  if (lower.includes("expired") || lower.includes("time limit")) {
    return "The time limit for this attempt has expired. Start a new attempt if you have one remaining.";
  }
  if (lower.includes("already been submitted")) {
    return "This attempt has already been submitted.";
  }
  return fallback;
}

export async function createAssessmentAction(
  input: CreateAssessmentInput,
): Promise<AcademyActionResult> {
  const parsed = createAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const course = await loadCourseForManagement(
      supabase,
      parsed.data.courseId,
    );

    await assertCanManageCourse(course.id);
    await assertPermission(
      user.id,
      "assessment_manage",
      course.organisation_id,
    );

    const { data: assessment, error } = await supabase
      .from("assessments")
      .insert({
        course_id: course.id,
        title: parsed.data.title,
        instructions: parsed.data.instructions || null,
        kind: parsed.data.kind,
        pass_mark_percent: parsed.data.passMarkPercent,
        max_attempts: parsed.data.maxAttempts,
        time_limit_minutes: parsed.data.timeLimitMinutes ?? null,
        is_required: parsed.data.isRequired,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !assessment) {
      return { ok: false, message: "We could not create the assessment." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: course.organisation_id,
      action: "course.assessment.created",
      entityType: "assessment",
      entityId: assessment.id,
      metadata: { courseId: course.id, title: parsed.data.title },
    });

    revalidatePath(`/dashboard/academy/manage/${course.id}`);
    return {
      ok: true,
      message: "Assessment created as a draft.",
      redirectTo: `/dashboard/academy/manage/${course.id}/assessments/${assessment.id}`,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

function buildQuestionPayload(input: CreateAssessmentQuestionInput) {
  if (input.questionType === "true_false") {
    return {
      options: [
        { id: "true", label: "True" },
        { id: "false", label: "False" },
      ],
      correctAnswer: [input.correctAnswer.trim().toLowerCase()],
    };
  }

  const candidates = [
    { id: "a", label: input.optionA?.trim() ?? "" },
    { id: "b", label: input.optionB?.trim() ?? "" },
    { id: "c", label: input.optionC?.trim() ?? "" },
    { id: "d", label: input.optionD?.trim() ?? "" },
  ].filter((option) => option.label.length > 0);

  return {
    options: candidates,
    correctAnswer: parseCorrectOptionIds(input.correctAnswer),
  };
}

export async function addAssessmentQuestionAction(
  input: CreateAssessmentQuestionInput,
): Promise<AcademyActionResult> {
  const parsed = createAssessmentQuestionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id, course_id, organisation_id, status")
      .eq("id", parsed.data.assessmentId)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return { ok: false, message: "That assessment is not available." };
    }

    await assertCanManageCourse(assessment.course_id);
    await assertPermission(
      user.id,
      "assessment_manage",
      assessment.organisation_id,
    );

    const { data: lastQuestion } = await supabase
      .from("assessment_questions")
      .select("position")
      .eq("assessment_id", assessment.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = buildQuestionPayload(parsed.data);
    const { data: question, error } = await supabase
      .from("assessment_questions")
      .insert({
        assessment_id: assessment.id,
        prompt: parsed.data.prompt,
        question_type: parsed.data.questionType,
        options: payload.options,
        correct_answer: payload.correctAnswer,
        points: parsed.data.points,
        explanation: parsed.data.explanation || null,
        position: (lastQuestion?.position ?? 0) + 1,
      })
      .select("id")
      .single();

    if (error || !question) {
      return { ok: false, message: "We could not add the question." };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: assessment.organisation_id,
      action: "course.assessment.question.created",
      entityType: "assessment_question",
      entityId: question.id,
      metadata: { assessmentId: assessment.id },
    });

    revalidatePath(
      `/dashboard/academy/manage/${assessment.course_id}/assessments/${assessment.id}`,
    );
    return { ok: true, message: "Question added." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function setAssessmentPublicationAction(
  assessmentId: string,
  publish: boolean,
): Promise<AcademyActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id, course_id, organisation_id, status, published_at")
      .eq("id", assessmentId)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return { ok: false, message: "That assessment is not available." };
    }

    await assertCanManageCourse(assessment.course_id);
    await assertPermission(
      user.id,
      "assessment_manage",
      assessment.organisation_id,
    );

    if (publish) {
      const { count } = await supabase
        .from("assessment_questions")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", assessment.id);

      if (!count) {
        return {
          ok: false,
          message: "Add at least one question before publishing.",
        };
      }
    }

    const { error } = await supabase
      .from("assessments")
      .update({
        status: publish ? "published" : "draft",
        published_at:
          publish && !assessment.published_at
            ? new Date().toISOString()
            : assessment.published_at,
      })
      .eq("id", assessment.id);

    if (error) {
      return {
        ok: false,
        message: publish
          ? "We could not publish the assessment."
          : "We could not return the assessment to draft.",
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: assessment.organisation_id,
      action: publish
        ? "course.assessment.published"
        : "course.assessment.unpublished",
      entityType: "assessment",
      entityId: assessment.id,
    });

    revalidatePath(`/dashboard/academy/manage/${assessment.course_id}`);
    revalidatePath(
      `/dashboard/academy/manage/${assessment.course_id}/assessments/${assessment.id}`,
    );
    revalidatePath(`/dashboard/academy/learning/${assessment.course_id}`);

    return {
      ok: true,
      message: publish
        ? "Assessment published."
        : "Assessment returned to draft.",
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function startAssessmentAttemptAction(
  assessmentId: string,
): Promise<StartAssessmentResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("start_assessment_attempt", {
      p_assessment: assessmentId,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return {
        ok: false,
        message: assessmentFriendlyMessage(
          error?.message ?? "",
          "We could not start this assessment. Try again.",
        ),
      };
    }

    return { ok: true, attempt: data as unknown as AssessmentAttemptStart };
  } catch (error) {
    return toFriendlyError(error) as StartAssessmentResult;
  }
}

export async function submitAssessmentAttemptAction(input: {
  attemptId: string;
  answers: Record<string, string[]>;
}): Promise<SubmitAssessmentResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_assessment_attempt", {
      p_attempt: input.attemptId,
      p_answers: input.answers,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return {
        ok: false,
        message: assessmentFriendlyMessage(
          error?.message ?? "",
          "We could not submit this attempt. Try again.",
        ),
      };
    }

    const result = data as unknown as AssessmentAttemptSubmission;

    await recordAudit({
      actorId: user.id,
      action: "assessment.attempt.submitted",
      entityType: "assessment_attempt",
      entityId: input.attemptId,
      metadata: {
        scorePercent: result.scorePercent,
        passed: result.passed,
        courseCompleted: result.courseCompleted,
      },
    });

    revalidatePath("/dashboard/academy/learning");
    return { ok: true, result };
  } catch (error) {
    return toFriendlyError(error) as SubmitAssessmentResult;
  }
}

export async function completeLessonAction(
  lessonId: string,
): Promise<CompleteLessonResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("complete_lesson", {
      p_lesson: lessonId,
    });

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      const message = error?.message.toLowerCase() ?? "";
      return {
        ok: false,
        message: message.includes("enrol")
          ? "Enrol in this course before completing lessons."
          : "We could not record that lesson. Try again.",
      };
    }

    const result = data as Record<string, Json | undefined>;
    const courseCompleted = result.courseCompleted === true;
    const certificateId =
      typeof result.certificateId === "string"
        ? result.certificateId
        : null;

    if (courseCompleted) {
      await recordAudit({
        actorId: user.id,
        action: "course.completed",
        entityType: "lesson",
        entityId: lessonId,
        metadata: { certificateId },
      });
    }

    revalidatePath("/dashboard/academy/learning");
    revalidatePath("/dashboard/academy");
    return {
      ok: true,
      courseCompleted,
      completedLessons:
        typeof result.completedLessons === "number"
          ? result.completedLessons
          : 0,
      totalLessons:
        typeof result.requiredLessons === "number" ? result.requiredLessons : 0,
      certificateId,
    };
  } catch (error) {
    return toFriendlyError(error) as CompleteLessonResult;
  }
}
