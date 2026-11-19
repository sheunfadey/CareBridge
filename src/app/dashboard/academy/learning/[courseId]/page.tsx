import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  CircleIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  PlayCircleIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/server/auth/current-user";
import { getCourseForLearning, listCourseAssessments } from "@/server/academy/queries";
import { learningResourceKindLabels } from "@/lib/validation/academy";
import { LessonCompleteButton } from "@/features/academy/components/lesson-complete-button";
import { AssessmentRunner } from "@/features/academy/components/assessment-runner";

type LearningCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({
  params,
}: LearningCoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Learning" };
  const course = await getCourseForLearning(courseId, user.id);
  if (!course) return { title: "Learning" };
  return { title: course.title };
}

export default async function LearningCoursePage({
  params,
}: LearningCoursePageProps) {
  const { courseId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirectTo=/dashboard/academy/learning/${courseId}`);
  }

  const course = await getCourseForLearning(courseId, user.id);
  if (!course) {
    notFound();
  }

  const assessments = await listCourseAssessments(courseId, user.id);
  const learningLabel =
    user.activePortal === "caregiver" ? "My Learning" : "My Progress";

  const progress = course.totalLessons
    ? Math.round((course.completedLessons / course.totalLessons) * 100)
    : 0;

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow={learningLabel}
        title={course.title}
        description={course.summary ?? "Work through the syllabus and track your progress."}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: learningLabel, href: "/dashboard/academy/learning" },
          { label: course.title },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/academy/learning">Back to learning</Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-heading font-semibold text-brand-strong">
              Progress
            </p>
            <p className="text-sm text-muted-foreground">
              {course.completedLessons} / {course.totalLessons} lessons completed
            </p>
          </div>
          <Badge variant={course.completedAt ? "default" : "outline"}>
            {course.completedAt ? "Completed" : "In progress"}
          </Badge>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-brand-teal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b p-4">
          <ClipboardCheckIcon className="size-5 text-brand-teal" aria-hidden="true" />
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Assessments
            </h2>
            <p className="text-sm text-muted-foreground">
              Required assessments must be passed before the course completes.
              Answers are graded on the server.
            </p>
          </div>
        </div>
        {assessments.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No assessments have been published for this course yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="p-4">
                <AssessmentRunner
                  assessmentId={assessment.id}
                  title={assessment.title}
                  instructions={assessment.instructions}
                  passMarkPercent={assessment.passMarkPercent}
                  maxAttempts={assessment.maxAttempts}
                  timeLimitMinutes={assessment.timeLimitMinutes}
                  attemptsUsed={assessment.attemptsUsed}
                  attemptsRemaining={assessment.attemptsRemaining}
                  bestScorePercent={assessment.bestScorePercent}
                  passed={assessment.passed}
                  inProgress={assessment.inProgress}
                  isRequired={assessment.isRequired}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {course.modules.map((module) => (
            <Card key={module.id} className="overflow-hidden">
              <div className="border-b p-4">
                <p className="font-heading font-semibold text-brand-strong">
                  Module {module.position}: {module.title}
                </p>
                {module.summary ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {module.summary}
                  </p>
                ) : null}
              </div>
              <div className="divide-y">
                {module.lessons.map((lesson) => {
                  const completed = Boolean(lesson.completedAt);
                  return (
                    <details
                      key={lesson.id}
                      className="group"
                      open={completed ? undefined : undefined}
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 transition hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <CheckCircle2Icon className="size-5 text-brand-green" />
                          ) : (
                            <CircleIcon className="size-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-brand-strong">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.estimatedMinutes} min
                              {lesson.isPreview ? " · Preview" : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={completed ? "default" : "outline"}>
                          {completed ? "Done" : "Not done"}
                        </Badge>
                      </summary>
                      <div className="space-y-4 px-4 pb-4">
                        {lesson.videoUrl ? (
                          <div className="overflow-hidden rounded-lg border">
                            <iframe
                              src={lesson.videoUrl}
                              title={lesson.title}
                              className="aspect-video w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : null}
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {lesson.content}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpenIcon className="size-3.5" />
                            Read and complete this lesson
                          </div>
                          <LessonCompleteButton
                            lessonId={lesson.id}
                            completed={completed}
                          />
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <p className="font-heading font-semibold text-brand-strong">
              Resources
            </p>
            {course.resources.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No additional resources yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {course.resources.map((resource) => (
                  <li key={resource.id} className="flex items-start gap-2 text-sm">
                    <FileTextIcon className="mt-0.5 size-4 text-brand-teal" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-brand-strong">
                          {resource.title}
                        </p>
                        <Badge variant="outline">
                          {learningResourceKindLabels[resource.kind]}
                        </Badge>
                      </div>
                      {resource.downloadUrl ?? resource.externalUrl ? (
                        <a
                          href={
                            (resource.downloadUrl ?? resource.externalUrl) as string
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-teal underline"
                        >
                          Open resource
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {course.completedAt ? (
            <Card className="p-4 text-center">
              <PlayCircleIcon className="mx-auto size-8 text-brand-green" />
              <p className="mt-2 font-heading font-semibold text-brand-strong">
                Course completed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You have completed all required lessons.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/academy">Back to Academy</Link>
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
