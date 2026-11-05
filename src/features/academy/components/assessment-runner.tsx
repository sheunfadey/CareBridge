"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  startAssessmentAttemptAction,
  submitAssessmentAttemptAction,
  type AssessmentAttemptStart,
  type AssessmentAttemptSubmission,
} from "@/features/academy/actions";

type AssessmentRunnerProps = {
  assessmentId: string;
  title: string;
  instructions: string | null;
  passMarkPercent: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  attemptsUsed: number;
  attemptsRemaining: number;
  bestScorePercent: number | null;
  passed: boolean;
  inProgress: boolean;
  isRequired: boolean;
};

export function AssessmentRunner(props: AssessmentRunnerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "taking" | "result">("idle");
  const [attempt, setAttempt] = useState<AssessmentAttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<AssessmentAttemptSubmission | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMode("idle");
    setAttempt(null);
    setAnswers({});
    setResult(null);
    setError(null);
  };

  const start = () => {
    setError(null);
    startTransition(async () => {
      const response = await startAssessmentAttemptAction(props.assessmentId);
      if (response.ok) {
        setAttempt(response.attempt);
        setAnswers({});
        setResult(null);
        setMode("taking");
      } else {
        setError(response.message);
      }
    });
  };

  const choose = (questionId: string, optionId: string, multiple: boolean) => {
    setAnswers((current) => {
      const existing = current[questionId] ?? [];
      const next = multiple
        ? existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId]
        : [optionId];
      return { ...current, [questionId]: next };
    });
  };

  const submit = () => {
    if (!attempt) return;
    const unanswered = attempt.questions.filter(
      (question) => (answers[question.id] ?? []).length === 0,
    );
    if (unanswered.length > 0) {
      setError("Answer every question before submitting.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await submitAssessmentAttemptAction({
        attemptId: attempt.attemptId,
        answers,
      });
      if (response.ok) {
        setResult(response.result);
        setMode("result");
        router.refresh();
      } else {
        setError(response.message);
      }
    });
  };

  const attemptNumber = attempt?.attemptNumber ?? props.attemptsUsed + 1;
  const remainingAfterAttempt = Math.max(0, props.maxAttempts - attemptNumber);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-base font-semibold text-brand-strong">
              {props.title}
            </h3>
            {props.isRequired ? <Badge variant="secondary">Required</Badge> : null}
            {props.passed ? <Badge variant="default">Passed</Badge> : null}
          </div>
          {props.instructions ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {props.instructions}
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Pass mark {props.passMarkPercent}%</p>
          <p>
            {props.attemptsUsed} of {props.maxAttempts} attempts used
          </p>
          {props.bestScorePercent !== null ? (
            <p>Best score {props.bestScorePercent}%</p>
          ) : null}
          {props.timeLimitMinutes ? (
            <p className="mt-1 inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {props.timeLimitMinutes} min limit
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {mode === "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">
            {props.passed
              ? "You have passed this assessment. You can retake it while attempts remain."
              : props.attemptsRemaining === 0 && !props.inProgress
                ? "No attempts remain. Contact your instructor if you need another attempt."
                : props.inProgress
                  ? "You have an attempt in progress. Resume it to submit your answers."
                  : "Start when you are ready. The timer, if set, begins immediately."}
          </p>
          <Button
            onClick={start}
            disabled={
              isPending ||
              (props.attemptsRemaining === 0 && !props.inProgress)
            }
            size="sm"
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : null}
            {props.inProgress ? "Resume attempt" : "Start assessment"}
          </Button>
        </div>
      ) : null}

      {mode === "taking" && attempt ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 p-3 text-sm">
            <span className="font-medium text-brand-strong">
              Attempt {attempt.attemptNumber} of {props.maxAttempts}
            </span>
            <span className="text-xs text-muted-foreground">
              {attempt.expiresAt
                ? `Submit before ${formatDateTime(attempt.expiresAt)}`
                : "No time limit"}
            </span>
          </div>

          {attempt.questions.map((question, questionIndex) => {
            const multiple = question.questionType === "multiple_choice";
            const selected = answers[question.id] ?? [];
            return (
              <fieldset
                key={question.id}
                className="space-y-3 rounded-lg border p-4"
              >
                <legend className="px-1 text-sm font-medium text-brand-strong">
                  {questionIndex + 1}. {question.prompt}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {question.points} pt{question.points === 1 ? "" : "s"}
                  </span>
                </legend>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        type={multiple ? "checkbox" : "radio"}
                        name={question.id}
                        value={option.id}
                        checked={selected.includes(option.id)}
                        onChange={() =>
                          choose(question.id, option.id, multiple)
                        }
                        className="size-4 accent-brand-teal"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={isPending}
            >
              Close
            </Button>
            <Button type="button" onClick={submit} disabled={isPending}>
              {isPending ? <Loader2Icon className="animate-spin" /> : null}
              Submit attempt
            </Button>
          </div>
        </div>
      ) : null}

      {mode === "result" && result ? (
        <div className="space-y-5">
          <div
            className={
              result.passed
                ? "rounded-lg border border-brand-green/30 bg-brand-green/10 p-4"
                : "rounded-lg border border-amber-500/30 bg-amber-500/10 p-4"
            }
          >
            <div className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2Icon className="size-5 text-brand-green" />
              ) : (
                <XCircleIcon className="size-5 text-amber-600" />
              )}
              <p className="font-heading font-semibold text-brand-strong">
                {result.passed ? "Passed" : "Not passed"}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.scorePoints} / {result.maxPoints} points ·{" "}
              {result.scorePercent}% (pass mark {result.passMarkPercent}%)
            </p>
            {result.courseCompleted ? (
              <p className="mt-2 text-sm text-brand-strong">
                Course completed.{" "}
                {result.certificateId ? (
                  <Link
                    href="/dashboard/academy/certificates"
                    className="text-brand-teal underline"
                  >
                    View your certificate
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            {attempt?.questions.map((question, index) => {
              const questionResult = result.results.find(
                (item) => item.questionId === question.id,
              );
              return (
                <div
                  key={question.id}
                  className="rounded-lg border p-4 text-sm"
                >
                  <div className="flex items-start gap-2">
                    {questionResult?.isCorrect ? (
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-brand-green" />
                    ) : (
                      <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-brand-strong">
                        {index + 1}. {question.prompt}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Correct answer:{" "}
                        {question.options
                          .filter((option) =>
                            questionResult?.correctOptionIds.includes(option.id),
                          )
                          .map((option) => option.label)
                          .join(", ") || "—"}
                      </p>
                      {questionResult?.explanation ? (
                        <p className="mt-1 text-muted-foreground">
                          {questionResult.explanation}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              Done
            </Button>
            {remainingAfterAttempt > 0 ? (
              <Button type="button" onClick={start} disabled={isPending}>
                {isPending ? <Loader2Icon className="animate-spin" /> : <RotateCcwIcon />}
                Start another attempt
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
