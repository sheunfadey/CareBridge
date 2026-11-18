import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/server/auth/current-user";
import { getManagedAssessmentDetail } from "@/server/academy/queries";
import {
  assessmentAttemptStatusLabels,
  assessmentKindLabels,
  assessmentQuestionTypeLabels,
  assessmentStatusLabels,
} from "@/lib/validation/academy";
import { formatDateTime } from "@/lib/format";
import { AddAssessmentQuestionDialog } from "@/features/academy/components/add-assessment-question-dialog";
import { AssessmentPublishButton } from "@/features/academy/components/assessment-publish-button";
import type { StudioBase } from "@/features/academy/studio/base";

export async function getAssessmentStudioMetadata(
  courseId: string,
  assessmentId: string,
): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Assessment" };
  const assessment = await getManagedAssessmentDetail(
    courseId,
    assessmentId,
    user,
  );
  return { title: assessment ? `Manage: ${assessment.title}` : "Assessment" };
}

export async function AssessmentDetailPage({
  base,
  courseId,
  assessmentId,
}: {
  base: StudioBase;
  courseId: string;
  assessmentId: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(
        `${base.manageHref}/${courseId}/assessments/${assessmentId}`,
      )}`,
    );
  }

  const assessment = await getManagedAssessmentDetail(
    courseId,
    assessmentId,
    user,
  );
  if (!assessment) {
    notFound();
  }

  const canManage =
    user.isSuperAdmin || user.permissions.has("assessment_manage");
  const correctIds = new Set<string>();

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Assessment"
        title={assessment.title}
        description={assessment.instructions ?? "Questions, answer key and attempts."}
        breadcrumbs={[
          { label: base.homeLabel, href: base.homeHref },
          { label: "Course Studio", href: base.manageHref },
          {
            label: assessment.courseTitle,
            href: `${base.manageHref}/${assessment.courseId}`,
          },
          { label: assessment.title },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`${base.manageHref}/${assessment.courseId}`}>
                <ArrowLeftIcon />
                Back to course
              </Link>
            </Button>
            {canManage ? (
              <AssessmentPublishButton
                assessmentId={assessment.id}
                published={assessment.status === "published"}
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={assessment.status}
          label={assessmentStatusLabels[assessment.status]}
        />
        <Badge variant="outline">{assessmentKindLabels[assessment.kind]}</Badge>
        {assessment.isRequired ? (
          <Badge variant="secondary">Required for completion</Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          Pass mark {assessment.passMarkPercent}% · {assessment.maxAttempts}{" "}
          attempts · {assessment.questionCount} question
          {assessment.questionCount === 1 ? "" : "s"} ·{" "}
          {assessment.totalPoints} point
          {assessment.totalPoints === 1 ? "" : "s"}
          {assessment.timeLimitMinutes
            ? ` · ${assessment.timeLimitMinutes} min limit`
            : ""}
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Questions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The answer key is only visible to course managers and is never sent
              to learners before submission.
            </p>
          </div>
          {canManage ? (
            <AddAssessmentQuestionDialog assessmentId={assessment.id}>
              <Button variant="outline" size="sm">
                <PlusIcon />
                Add question
              </Button>
            </AddAssessmentQuestionDialog>
          ) : null}
        </div>

        {assessment.questions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No questions yet. Add at least one before publishing.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {assessment.questions.map((question, index) => {
              correctIds.clear();
              for (const id of question.correctOptionIds) correctIds.add(id);
              return (
                <li key={question.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-brand-strong">
                      {index + 1}. {question.prompt}
                    </p>
                    <Badge variant="secondary">
                      {question.points} pt{question.points === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {assessmentQuestionTypeLabels[question.questionType]}
                  </p>
                  <ul className="space-y-1 text-sm">
                    {question.options.map((option) => (
                      <li
                        key={option.id}
                        className={
                          correctIds.has(option.id)
                            ? "font-medium text-brand-green"
                            : "text-muted-foreground"
                        }
                      >
                        {option.label}
                        {correctIds.has(option.id) ? " · correct" : ""}
                      </li>
                    ))}
                  </ul>
                  {question.explanation ? (
                    <p className="text-sm text-muted-foreground">
                      Explanation: {question.explanation}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Attempts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {assessment.attemptCount === 0
              ? "No learner has attempted this assessment yet."
              : `${assessment.attemptCount} attempt${
                  assessment.attemptCount === 1 ? "" : "s"
                } recorded. Submitted attempts are immutable.`}
          </p>
        </div>
        {assessment.attempts.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Attempts will appear here after learners start the assessment.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessment.attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="text-sm text-brand-strong">
                    {attempt.learnerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    #{attempt.attemptNumber}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={attempt.status}
                      label={assessmentAttemptStatusLabels[attempt.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {attempt.scorePoints !== null && attempt.maxPoints !== null
                      ? `${attempt.scorePoints} / ${attempt.maxPoints}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {attempt.passed === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : attempt.passed ? (
                      <span className="font-medium text-brand-green">Passed</span>
                    ) : (
                      <span className="font-medium text-destructive">
                        Not passed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {attempt.submittedAt
                      ? formatDateTime(attempt.submittedAt)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
