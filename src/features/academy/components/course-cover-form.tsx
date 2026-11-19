"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  removeCourseCoverAction,
  uploadCourseCoverAction,
} from "@/features/academy/actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

export function CourseCoverForm({
  courseId,
  currentUrl,
}: {
  courseId: string;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const source = preview ?? currentUrl;

  React.useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("Images must be 4 MB or smaller.");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
  };

  const upload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    const formData = new FormData();
    formData.set("courseId", courseId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadCourseCoverAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Course image updated.");
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    });
  };

  const remove = () => {
    const formData = new FormData();
    formData.set("courseId", courseId);

    startTransition(async () => {
      const result = await removeCourseCoverAction(formData);
      if (result.ok) {
        toast.success(result.message ?? "Course image removed.");
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label="Course cover preview"
        className="relative aspect-[16/7] overflow-hidden rounded-xl bg-portal-lavender bg-cover bg-center ring-1 ring-foreground/10"
        style={source ? { backgroundImage: `url("${source}")` } : undefined}
      >
        {!source ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-portal-lavender-strong">
            <ImagePlusIcon className="size-7" aria-hidden="true" />
            <span className="text-xs font-medium">No image yet</span>
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        disabled={pending}
        className="block w-full text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-navy/90"
      />

      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP up to 4 MB. Used on the catalogue, public course page
        and studio cards.
      </p>

      {error ? (
        <p className="text-xs font-medium text-brand-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={pending}
          onClick={upload}
        >
          {pending ? "Uploading…" : "Upload image"}
        </Button>
        {currentUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={remove}
          >
            <Trash2Icon />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
