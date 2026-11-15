"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createAssessmentAction } from "@/features/academy/actions";
import {
  ASSESSMENT_KINDS,
  assessmentKindLabels,
  createAssessmentSchema,
  type CreateAssessmentInput,
} from "@/lib/validation/academy";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-base sm:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateAssessmentDialog({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateAssessmentInput>({
    resolver: zodResolver(createAssessmentSchema),
    defaultValues: {
      courseId,
      title: "",
      kind: "quiz",
      instructions: "",
      passMarkPercent: 70,
      maxAttempts: 3,
      timeLimitMinutes: undefined,
      isRequired: false,
    },
  } as never);

  const isRequired = useWatch({ control, name: "isRequired" });

  const onSubmit = (values: CreateAssessmentInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createAssessmentAction({
        ...values,
        courseId,
        instructions: values.instructions || undefined,
      });
      if (result.ok) {
        reset({
          courseId,
          title: "",
          kind: "quiz",
          instructions: "",
          passMarkPercent: 70,
          maxAttempts: 3,
          timeLimitMinutes: undefined,
          isRequired: false,
        });
        setOpen(false);
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.refresh();
        }
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New assessment</DialogTitle>
          <DialogDescription>
            Assessments are auto-graded from objective questions. The answer key
            is never sent to learners before they submit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}
          <div className="space-y-2">
            <Label htmlFor="assessment-title">Title</Label>
            <Input
              id="assessment-title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FormFieldError
              messages={
                errors.title?.message ? [errors.title.message] : undefined
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assessment-kind">Type</Label>
              <select
                id="assessment-kind"
                className={selectClass}
                {...register("kind")}
              >
                {ASSESSMENT_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {assessmentKindLabels[kind]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-pass">Pass mark (%)</Label>
              <Input
                id="assessment-pass"
                type="number"
                min={0}
                max={100}
                aria-invalid={Boolean(errors.passMarkPercent)}
                {...register("passMarkPercent")}
              />
              <FormFieldError
                messages={
                  errors.passMarkPercent?.message
                    ? [errors.passMarkPercent.message]
                    : undefined
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-attempts">Maximum attempts</Label>
              <Input
                id="assessment-attempts"
                type="number"
                min={1}
                max={20}
                aria-invalid={Boolean(errors.maxAttempts)}
                {...register("maxAttempts")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment-minutes">
                Time limit (minutes, optional)
              </Label>
              <Input
                id="assessment-minutes"
                type="number"
                min={1}
                max={480}
                placeholder="No limit"
                aria-invalid={Boolean(errors.timeLimitMinutes)}
                {...register("timeLimitMinutes")}
              />
              <FormFieldError
                messages={
                  errors.timeLimitMinutes?.message
                    ? [errors.timeLimitMinutes.message]
                    : undefined
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment-instructions">
              Instructions (optional)
            </Label>
            <Textarea
              id="assessment-instructions"
              rows={3}
              {...register("instructions")}
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={isRequired}
              onCheckedChange={(checked) =>
                setValue("isRequired", checked === true)
              }
            />
            <span>
              Required for course completion
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Learners must pass this assessment before the course completes,
                in addition to required lessons.
              </span>
            </span>
          </label>
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
              {isPending ? "Creating..." : "Create assessment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
