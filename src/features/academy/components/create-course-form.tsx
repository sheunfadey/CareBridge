"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import { createCourseAction } from "@/features/academy/actions";
import {
  COURSE_DIFFICULTIES,
  courseDifficultyLabels,
  createCourseSchema,
  type CreateCourseInput,
} from "@/lib/validation/academy";
import type {
  OrganisationOption,
  ProgrammeOption,
} from "@/server/academy/queries";

type CreateCourseFormProps = {
  programmes: ProgrammeOption[];
  organisations: OrganisationOption[];
};

export function CreateCourseForm({
  programmes,
  organisations,
}: CreateCourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      programmeId: programmes[0]?.id ?? "",
      organisationId: organisations[0]?.id ?? "",
      title: "",
      summary: "",
      description: "",
      category: "",
      difficulty: "foundation",
      estimatedMinutes: 60,
      learningOutcomes: "",
      prerequisites: "",
      scholarshipEligible: false,
      certificateEnabled: true,
    },
  } as never);

  const programmeId = useWatch({ control, name: "programmeId" });
  const organisationId = useWatch({ control, name: "organisationId" });
  const difficulty = useWatch({ control, name: "difficulty" });
  const scholarshipEligible = useWatch({
    control,
    name: "scholarshipEligible",
  });
  const certificateEnabled = useWatch({
    control,
    name: "certificateEnabled",
  });

  const onSubmit = (values: CreateCourseInput) => {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload: CreateCourseInput = {
        ...values,
        organisationId: values.organisationId || undefined,
      };
      const result = await createCourseAction(payload);
      if (result.ok) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.refresh();
        }
      } else {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-programme">Programme</Label>
          <Select
            value={programmeId}
            onValueChange={(value) =>
              setValue("programmeId", value, { shouldValidate: true })
            }
          >
            <SelectTrigger id="course-programme" className="w-full">
              <SelectValue placeholder="Select a programme" />
            </SelectTrigger>
            <SelectContent>
              {programmes.map((programme) => (
                <SelectItem key={programme.id} value={programme.id}>
                  {programme.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError
            messages={
              errors.programmeId?.message
                ? [errors.programmeId.message]
                : fieldErrors.programmeId
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-owner">Owner</Label>
          <Select
            value={organisationId || "platform"}
            onValueChange={(value) =>
              setValue("organisationId", value === "platform" ? "" : value, {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="course-owner" className="w-full">
              <SelectValue placeholder="Select an owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="platform">CareBridge platform</SelectItem>
              {organisations.map((organisation) => (
                <SelectItem key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Platform-owned courses require a platform administrator.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-title">Course title</Label>
        <Input
          id="course-title"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        <FormFieldError
          messages={
            errors.title?.message
              ? [errors.title.message]
              : fieldErrors.title
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-summary">Short summary</Label>
        <Textarea
          id="course-summary"
          rows={3}
          aria-invalid={Boolean(errors.summary)}
          {...register("summary")}
        />
        <FormFieldError
          messages={
            errors.summary?.message
              ? [errors.summary.message]
              : fieldErrors.summary
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-description">Description</Label>
        <Textarea
          id="course-description"
          rows={6}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <FormFieldError
          messages={
            errors.description?.message
              ? [errors.description.message]
              : fieldErrors.description
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course-category">Category (optional)</Label>
          <Input id="course-category" {...register("category")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-difficulty">Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(value) =>
              setValue(
                "difficulty",
                value as CreateCourseInput["difficulty"],
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger id="course-difficulty" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_DIFFICULTIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {courseDifficultyLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-minutes">Estimated minutes</Label>
          <Input
            id="course-minutes"
            type="number"
            min={5}
            {...register("estimatedMinutes", { valueAsNumber: true })}
          />
          <FormFieldError
            messages={
              errors.estimatedMinutes?.message
                ? [errors.estimatedMinutes.message]
                : fieldErrors.estimatedMinutes
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-outcomes">
            Learning outcomes (one per line)
          </Label>
          <Textarea id="course-outcomes" rows={5} {...register("learningOutcomes")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-prerequisites">
            Prerequisites (one per line)
          </Label>
          <Textarea
            id="course-prerequisites"
            rows={5}
            {...register("prerequisites")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={scholarshipEligible}
            onCheckedChange={(checked) =>
              setValue("scholarshipEligible", checked === true)
            }
          />
          Scholarship eligible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={certificateEnabled}
            onCheckedChange={(checked) =>
              setValue("certificateEnabled", checked === true)
            }
          />
          Issue a certificate on completion
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending || programmes.length === 0}>
          {isPending ? "Creating..." : "Create draft course"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/academy/manage">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
