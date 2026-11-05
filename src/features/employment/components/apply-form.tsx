"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  applyToInternshipAction,
  applyToJobAction,
} from "@/features/employment/actions";
import type {
  ApplyToInternshipInput,
  ApplyToJobInput,
} from "@/lib/validation/employment";

type ApplyKind = "job" | "internship";

type ApplyFormProps = {
  kind: ApplyKind;
  targetId: string;
  alreadyApplied: boolean;
  disabledReason?: string | null;
};

type FormValues = {
  message: string;
};

export function ApplyForm({
  kind,
  targetId,
  alreadyApplied,
  disabledReason,
}: ApplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { message: "" },
  });

  const onSubmit = (values: FormValues) => {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result =
        kind === "job"
          ? await applyToJobAction({
              jobId: targetId,
              coverLetter: values.message,
            } satisfies ApplyToJobInput)
          : await applyToInternshipAction({
              listingId: targetId,
              coverNote: values.message,
            } satisfies ApplyToInternshipInput);

      if (result.ok) {
        setSuccess(result.message ?? "Application submitted.");
        router.refresh();
      } else {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  if (alreadyApplied) {
    return (
      <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4 text-sm text-brand-strong">
        You have already applied. Track its status from your applications page.
      </div>
    );
  }

  if (success) {
    return <FormAlert tone="success">{success}</FormAlert>;
  }

  if (disabledReason) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        {disabledReason}
      </div>
    );
  }

  const fieldName = kind === "job" ? "coverLetter" : "coverNote";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      <div className="space-y-2">
        <Label htmlFor={`apply-${kind}-message`}>
          {kind === "job" ? "Cover letter (optional)" : "Cover note (optional)"}
        </Label>
        <Textarea
          id={`apply-${kind}-message`}
          rows={5}
          placeholder={
            kind === "job"
              ? "Tell the employer why you are a good fit for this role."
              : "Tell the provider why you would like this placement."
          }
          {...register("message")}
        />
        <FormFieldError
          messages={
            errors.message?.message
              ? [errors.message.message]
              : fieldErrors[fieldName]
          }
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Submitting..."
          : kind === "job"
            ? "Apply for this job"
            : "Apply for this placement"}
      </Button>
    </form>
  );
}
