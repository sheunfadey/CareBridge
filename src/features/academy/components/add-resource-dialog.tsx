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
import {
  addLearningResourceAction,
  addLearningResourceUploadAction,
} from "@/features/academy/actions";
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
  const [file, setFile] = useState<File | null>(null);

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
    if (file && values.kind !== "link") {
      const formData = new FormData();
      formData.set("courseId", courseId);
      formData.set("lessonId", values.lessonId || "");
      formData.set("title", values.title);
      formData.set("kind", values.kind);
      formData.set("isPrivate", String(values.isPrivate));
      formData.set("file", file);

      startTransition(async () => {
        const result = await addLearningResourceUploadAction(formData);
        if (result.ok) {
          reset(defaults(courseId));
          setFile(null);
          setOpen(false);
          router.refresh();
        } else {
          setError(result.message);
        }
      });
      return;
    }

    if (!values.externalUrl) {
      setError("Choose a file to upload or enter an external URL.");
      return;
    }

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
        setFile(null);
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
            Upload a PDF, document, presentation, audio, video or image up to 50
            MB, or attach an external URL. Link resources use a URL only.
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
            <Label htmlFor="resource-url">External URL</Label>
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
            <p className="text-xs text-muted-foreground">
              Use either an upload or an external URL. An upload takes priority.
            </p>
          </div>

          {kind !== "link" ? (
            <div className="space-y-2">
              <Label htmlFor="resource-file">Upload file (optional)</Label>
              <Input
                id="resource-file"
                type="file"
                accept={
                  kind === "pdf"
                    ? ".pdf,application/pdf"
                    : kind === "document"
                      ? ".doc,.docx,.odt,.rtf,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      : kind === "presentation"
                        ? ".ppt,.pptx,.odp,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        : kind === "audio"
                          ? "audio/*"
                          : kind === "video"
                            ? "video/*"
                            : kind === "image"
                              ? "image/*"
                              : undefined
                }
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 50 MB. Uploaded files are private to enrolled learners
                unless you allow public access.
              </p>
              {file ? (
                <p className="text-xs text-brand-teal">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              ) : null}
            </div>
          ) : null}

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
