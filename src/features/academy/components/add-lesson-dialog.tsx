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
import { addLessonAction } from "@/features/academy/actions";
import {
  createLessonSchema,
  type CreateLessonInput,
} from "@/lib/validation/academy";

export function AddLessonDialog({
  moduleId,
  children,
}: {
  moduleId: string;
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
  } = useForm<CreateLessonInput>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      moduleId,
      title: "",
      content: "",
      estimatedMinutes: 15,
      isRequired: true,
      isPreview: false,
      videoUrl: "",
    },
  } as never);

  const isRequired = useWatch({ control, name: "isRequired" });
  const isPreview = useWatch({ control, name: "isPreview" });

  const onSubmit = (values: CreateLessonInput) => {
    setError(null);
    startTransition(async () => {
      const result = await addLessonAction({
        ...values,
        moduleId,
        videoUrl: values.videoUrl || undefined,
      });
      if (result.ok) {
        reset({
          moduleId,
          title: "",
          content: "",
          estimatedMinutes: 15,
          isRequired: true,
          isPreview: false,
          videoUrl: "",
        });
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add lesson</DialogTitle>
          <DialogDescription>
            Lesson content is shown to enrolled learners.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson title</Label>
            <Input
              id="lesson-title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FormFieldError
              messages={
                errors.title?.message ? [errors.title.message] : undefined
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-content">Content</Label>
            <Textarea
              id="lesson-content"
              rows={9}
              aria-invalid={Boolean(errors.content)}
              {...register("content")}
            />
            <FormFieldError
              messages={
                errors.content?.message ? [errors.content.message] : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              Use blank lines between paragraphs and start headings with
              &quot;##&quot;.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-minutes">Estimated minutes</Label>
              <Input
                id="lesson-minutes"
                type="number"
                min={1}
                {...register("estimatedMinutes")}
              />
              <FormFieldError
                messages={
                  errors.estimatedMinutes?.message
                    ? [errors.estimatedMinutes.message]
                    : undefined
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-video">Video URL (optional)</Label>
              <Input
                id="lesson-video"
                placeholder="https://..."
                {...register("videoUrl")}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isRequired}
                onCheckedChange={(checked) =>
                  setValue("isRequired", checked === true)
                }
              />
              Required for completion
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPreview}
                onCheckedChange={(checked) =>
                  setValue("isPreview", checked === true)
                }
              />
              Public preview lesson
            </label>
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
              {isPending ? "Adding..." : "Add lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
