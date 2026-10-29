"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  linesToArray,
  slugify,
  updateCourseSchema,
  type CreateCourseInput,
  type CreateLessonInput,
  type CreateModuleInput,
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
        category: parsed.data.category || null,
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
      metadata: { title: parsed.data.title, slug },
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
    const courseCompleted = result.course_completed === true;
    const certificateId =
      typeof result.certificate_id === "string"
        ? result.certificate_id
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
        typeof result.completed_lessons === "number"
          ? result.completed_lessons
          : 0,
      totalLessons:
        typeof result.total_lessons === "number" ? result.total_lessons : 0,
      certificateId,
    };
  } catch (error) {
    return toFriendlyError(error) as CompleteLessonResult;
  }
}
