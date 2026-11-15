"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import { addAssessmentQuestionAction } from "@/features/academy/actions";
import {
  ASSESSMENT_QUESTION_TYPES,
  assessmentQuestionTypeLabels,
  createAssessmentQuestionSchema,
  type CreateAssessmentQuestionInput,
} from "@/lib/validation/academy";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-base sm:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const defaults = (assessmentId: string): CreateAssessmentQuestionInput => ({
  assessmentId,
  prompt: "",
  questionType: "single_choice",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  points: 1,
  explanation: "",
});

export function AddAssessmentQuestionDialog({
  assessmentId,
  children,
}: {
  assessmentId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAssessmentQuestionInput>({
    resolver: zodResolver(createAssessmentQuestionSchema),
    defaultValues: defaults(assessmentId),
  } as never);

  const questionType = useWatch({ control, name: "questionType" });
  const correctAnswer = useWatch({ control, name: "correctAnswer" });

  useEffect(() => {
    if (
      questionType === "true_false" &&
      correctAnswer !== "true" &&
      correctAnswer !== "false"
    ) {
      setValue("correctAnswer", "true");
    } else if (
      questionType !== "true_false" &&
      (correctAnswer === "true" || correctAnswer === "false")
    ) {
      setValue("correctAnswer", "A");
    }
  }, [questionType, correctAnswer, setValue]);

  const onSubmit = (values: CreateAssessmentQuestionInput) => {
    setError(null);
    startTransition(async () => {
      const result = await addAssessmentQuestionAction({
        ...values,
        assessmentId,
      });
      if (result.ok) {
        reset(defaults(assessmentId));
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add question</DialogTitle>
          <DialogDescription>
            Questions are graded by the database. The correct answer is visible
            to course managers only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}
          <div className="space-y-2">
            <Label htmlFor="question-prompt">Question</Label>
            <Textarea
              id="question-prompt"
              rows={3}
              aria-invalid={Boolean(errors.prompt)}
              {...register("prompt")}
            />
            <FormFieldError
              messages={
                errors.prompt?.message ? [errors.prompt.message] : undefined
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="question-type">Answer type</Label>
              <select
                id="question-type"
                className={selectClass}
                {...register("questionType")}
              >
                {ASSESSMENT_QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {assessmentQuestionTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min={1}
                max={100}
                aria-invalid={Boolean(errors.points)}
                {...register("points")}
              />
            </div>
          </div>

          {questionType === "true_false" ? (
            <div className="space-y-2">
              <Label htmlFor="question-answer">Correct answer</Label>
              <select
                id="question-answer"
                className={selectClass}
                {...register("correctAnswer")}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["A", "B", "C", "D"] as const).map((letter) => (
                  <div key={letter} className="space-y-2">
                    <Label htmlFor={`question-option-${letter}`}>
                      Option {letter}
                      {letter === "C" || letter === "D" ? " (optional)" : ""}
                    </Label>
                    <Input
                      id={`question-option-${letter}`}
                      {...register(
                        `option${letter}` as
                          | "optionA"
                          | "optionB"
                          | "optionC"
                          | "optionD",
                      )}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-answer">
                  Correct option
                  {questionType === "multiple_choice" ? "s" : ""}
                </Label>
                <Input
                  id="question-answer"
                  placeholder={
                    questionType === "multiple_choice" ? "e.g. A,C" : "e.g. A"
                  }
                  aria-invalid={Boolean(errors.correctAnswer)}
                  {...register("correctAnswer")}
                />
                <FormFieldError
                  messages={
                    errors.correctAnswer?.message
                      ? [errors.correctAnswer.message]
                      : undefined
                  }
                />
              </div>
            </>
          )}

          {questionType === "true_false" ? (
            <FormFieldError
              messages={
                errors.correctAnswer?.message
                  ? [errors.correctAnswer.message]
                  : undefined
              }
            />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="question-explanation">
              Explanation shown after submission (optional)
            </Label>
            <Textarea
              id="question-explanation"
              rows={2}
              {...register("explanation")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
