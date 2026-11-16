import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getManagedCourseDetail,
  listManagedAssessments,
  listManagedResources,
} from "@/server/academy/queries";
import {
  assessmentStatusLabels,
  courseDifficultyLabels,
  learningResourceKindLabels,
} from "@/lib/validation/academy";
import { AddModuleDialog } from "@/features/academy/components/add-module-dialog";
import { AddLessonDialog } from "@/features/academy/components/add-lesson-dialog";
import { PublishCourseButton } from "@/features/academy/components/publish-course-button";
import { CreateAssessmentDialog } from "@/features/academy/components/create-assessment-dialog";
import { AddResourceDialog } from "@/features/academy/components/add-resource-dialog";

type ManageCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: ManageCoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Manage course" };
  const course = await getManagedCourseDetail(courseId, user);
  return { title: course ? `Manage: ${course.title}` : "Manage course" };
}

export default async function ManageCoursePage({
  params,
}: ManageCoursePageProps) {
  const { courseId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/academy/manage/${courseId}`);
  }

  const course = await getManagedCourseDetail(courseId, user);
  if (!course) {
    notFound();
  }

  const assessments = await listManagedAssessments(course.id);
  const resources = await listManagedResources(course.id);
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      moduleTitle: `Module ${module.position}`,
    })),
  );

  const canEdit =
    user.isSuperAdmin || user.permissions.has("course_manage");
  const canPublish =
    user.isSuperAdmin || user.permissions.has("course_publish");
  const canAddContent =
    user.isSuperAdmin || user.permissions.has("learning_material_manage");
  const canManageAssessments =
    user.isSuperAdmin || user.permissions.has("assessment_manage");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <PageHeader
        eyebrow="Academy management"
        title={course.title}
        description={course.summary ?? "Course details and syllabus."}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "Manage courses", href: "/dashboard/academy/manage" },
          { label: course.title },
        ]}
        actions={
          <>
            {course.status === "published" && course.isPublic ? (
              <Button variant="outline" asChild>
                <Link href={`/courses/${course.slug}`}>View public page</Link>
              </Button>
            ) : null}
            {canAddContent ? (
              <Button variant="outline" asChild>
                <a href="#learning-resources">Upload resource</a>
              </Button>
            ) : null}
            {canPublish ? (
              <PublishCourseButton
                courseId={course.id}
                published={course.status === "published"}
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-4 rounded-[var(--radius-2xl)] bg-card/90 p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
        <div
          role="img"
          aria-label={course.title}
          className="h-20 w-full shrink-0 rounded-xl bg-portal-peach bg-cover bg-center sm:w-28"
          style={
            course.coverImageUrl
              ? { backgroundImage: `url("${course.coverImageUrl}")` }
              : undefined
          }
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <StatusBadge status={course.status} />
          <Badge variant="outline">
            {courseDifficultyLabels[course.difficulty]}
          </Badge>
          <Badge variant="secondary">
            {course.organisationName ?? "HillCrest platform"}
          </Badge>
          <Badge variant="secondary">{course.programmeTitle}</Badge>
          <span className="text-xs text-muted-foreground">
            {course.totalLessons} lesson{course.totalLessons === 1 ? "" : "s"} ·{" "}
            {course.estimatedMinutes} min · {course.modules.length} module
            {course.modules.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Assessments
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Auto-graded quizzes and exams. Required assessments gate course
              completion.
            </p>
          </div>
          {canManageAssessments ? (
            <CreateAssessmentDialog courseId={course.id}>
              <Button variant="outline" size="sm">
                <PlusIcon />
                New assessment
              </Button>
            </CreateAssessmentDialog>
          ) : null}
        </div>
        {assessments.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No assessments yet. Create one, add questions, then publish it.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {assessments.map((assessment) => (
              <li key={assessment.id}>
                <Link
                  href={`/dashboard/academy/manage/${course.id}/assessments/${assessment.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm transition hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-brand-strong">
                      {assessment.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assessment.questionCount} question
                      {assessment.questionCount === 1 ? "" : "s"} ·{" "}
                      {assessment.totalPoints} point
                      {assessment.totalPoints === 1 ? "" : "s"} ·{" "}
                      {assessment.attemptCount} attempt
                      {assessment.attemptCount === 1 ? "" : "s"} · Pass mark{" "}
                      {assessment.passMarkPercent}%
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {assessment.isRequired ? (
                      <Badge variant="secondary">Required</Badge>
                    ) : null}
                    <StatusBadge
                      status={assessment.status}
                      label={assessmentStatusLabels[assessment.status]}
                    />
                    <span className="text-xs text-muted-foreground">
                      Manage →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="learning-resources" className="scroll-mt-24 overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Learning resources
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDFs, documents, presentations, audio, video, images and links
              attached to the course or a lesson.
            </p>
          </div>
          {canAddContent ? (
            <AddResourceDialog courseId={course.id} lessons={lessons}>
              <Button variant="outline" size="sm">
                <PlusIcon />
                Add resource
              </Button>
            </AddResourceDialog>
          ) : null}
        </div>
        {resources.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No learning resources yet. Add a URL for a PDF, document, audio,
            video, image or external link.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {resources.map((resource) => {
              const lesson = resource.lessonId
                ? lessons.find((item) => item.id === resource.lessonId)
                : null;
              const resourceUrl = resource.downloadUrl ?? resource.externalUrl;
              return (
                <li
                  key={resource.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-brand-strong">
                        {resource.title}
                      </p>
                      <Badge variant="outline">
                        {learningResourceKindLabels[resource.kind]}
                      </Badge>
                      {resource.isPrivate ? (
                        <Badge variant="secondary">Enrolled learners</Badge>
                      ) : (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lesson
                        ? `${lesson.moduleTitle} · ${lesson.title}`
                        : "Course-wide resource"}
                      {resource.mimeType ? ` · ${resource.mimeType}` : ""}
                    </p>
                  </div>
                  {resourceUrl ? (
                    <a
                      href={resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand-teal hover:underline"
                    >
                      Open resource
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Syllabus
            </h2>
            {canAddContent ? (
              <AddModuleDialog courseId={course.id}>
                <Button variant="outline" size="sm">
                  <PlusIcon />
                  Add module
                </Button>
              </AddModuleDialog>
            ) : null}
          </div>

          {course.modules.length === 0 ? (
            <Card className="p-5 text-center">
              <p className="font-heading font-semibold text-brand-strong">
                No modules yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a module, then add lessons inside it.
              </p>
            </Card>
          ) : (
            course.modules.map((module) => (
              <Card key={module.id} className="overflow-hidden">
                <div className="flex items-start justify-between gap-3 border-b p-4">
                  <div>
                    <p className="font-heading font-semibold text-brand-strong">
                      Module {module.position}: {module.title}
                    </p>
                    {module.summary ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {module.summary}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {module.lessons.length} lesson
                      {module.lessons.length === 1 ? "" : "s"}
                      {module.isRequired ? " · Required" : ""}
                    </p>
                  </div>
                  {canAddContent ? (
                    <AddLessonDialog moduleId={module.id}>
                      <Button variant="outline" size="sm">
                        <PlusIcon />
                        Add lesson
                      </Button>
                    </AddLessonDialog>
                  ) : null}
                </div>
                {module.lessons.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No lessons in this module yet.
                  </p>
                ) : (
                  <div className="divide-y">
                    {module.lessons.map((lesson) => (
                      <details key={lesson.id}>
                        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm hover:bg-muted/50">
                          <span className="font-medium text-brand-strong">
                            {lesson.position}. {lesson.title}
                          </span>
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            {lesson.isPreview ? (
                              <Badge variant="secondary">Preview</Badge>
                            ) : null}
                            {lesson.estimatedMinutes} min
                          </span>
                        </summary>
                        <div className="space-y-3 px-4 pb-4">
                          <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                            {lesson.content}
                          </div>
                          {lesson.videoUrl ? (
                            <p className="text-xs text-muted-foreground">
                              Video: {lesson.videoUrl}
                            </p>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="font-heading font-semibold text-brand-strong">
              Course details
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Description
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {course.description}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Learning outcomes
                </dt>
                <dd className="mt-1">
                  {course.learningOutcomes.length === 0 ? (
                    <span className="text-muted-foreground">None listed</span>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                      {course.learningOutcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Prerequisites
                </dt>
                <dd className="mt-1">
                  {course.prerequisites.length === 0 ? (
                    <span className="text-muted-foreground">None listed</span>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                      {course.prerequisites.map((prerequisite) => (
                        <li key={prerequisite}>{prerequisite}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Certificate
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {course.certificateEnabled
                    ? "Issued on completion"
                    : "Not issued"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Scholarship
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {course.scholarshipEligible ? "Eligible" : "Not eligible"}
                </dd>
              </div>
            </dl>
            {canEdit ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Editing course details is not yet available in this build.
                Content and publication controls are enabled.
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
