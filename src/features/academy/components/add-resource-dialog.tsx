"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { addLearningResourceAction } from "@/features/academy/actions";
import {
  LEARNING_RESOURCE_KINDS,
  learningResourceKindLabels,
  learningResourceSchema,
  type LearningResourceInput,
} from "@/lib/validation/academy";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const defaults = (courseId: string): LearningResourceInput => ({
  courseId,
  lessonId: "",
  title: "",
  kind: "document",
  externalUrl: "",
  mimeType: "",
  isPrivate: true,
});

export function AddResourceDialog({
  courseId,
  lessons,
  children,
}: {
  courseId: string;
  lessons: { id: string; title: string; moduleTitle: string }[];
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
  } = useForm<LearningResourceInput>({
    resolver: zodResolver(learningResourceSchema),
    defaultValues: defaults(courseId),
  } as never);

  const kind = useWatch({ control, name: "kind" });
  const isPrivate = useWatch({ control, name: "isPrivate" });

  const onSubmit = (values: LearningResourceInput) => {
    setError(null);
    startTransition(async () => {
      const result = await addLearningResourceAction({
        ...values,
        courseId,
        lessonId: values.lessonId || undefined,
        externalUrl: values.externalUrl || undefined,
        mimeType: values.mimeType || undefined,
      });
      if (result.ok) {
        reset(defaults(courseId));
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add learning resource</DialogTitle>
          <DialogDescription>
            Attach a PDF, document, presentation, audio, video, image or link.
            File uploads are not enabled yet, so use a stable external URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}

          <div className="space-y-2">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FormFieldError
              messages={
                errors.title?.message ? [errors.title.message] : undefined
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resource-kind">Type</Label>
              <select
                id="resource-kind"
                className={selectClass}
                {...register("kind")}
              >
                {LEARNING_RESOURCE_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {learningResourceKindLabels[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-lesson">Lesson (optional)</Label>
              <select
                id="resource-lesson"
                className={selectClass}
                {...register("lessonId")}
              >
                <option value="">Course-wide resource</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.moduleTitle} · {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              type="url"
              placeholder={
                kind === "video"
                  ? "https://example.com/video.mp4"
                  : kind === "audio"
                    ? "https://example.com/audio.mp3"
                    : "https://example.com/document.pdf"
              }
              aria-invalid={Boolean(errors.externalUrl)}
              {...register("externalUrl")}
            />
            <FormFieldError
              messages={
                errors.externalUrl?.message
                  ? [errors.externalUrl.message]
                  : undefined
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-mime">MIME type (optional)</Label>
            <Input
              id="resource-mime"
              placeholder="application/pdf"
              {...register("mimeType")}
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={isPrivate}
              onCheckedChange={(checked) =>
                setValue("isPrivate", checked === true)
              }
            />
            <span>
              Enrolled learners only
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Leave checked so only enrolled learners and course managers can
                open the resource.
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
              {isPending ? "Adding..." : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
