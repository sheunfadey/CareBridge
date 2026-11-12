"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon, UploadIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
  type AccountActionResult,
} from "@/features/account/actions";
import {
  AVATAR_MAX_BYTES,
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validation/account";

function initials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileSettings({
  initial,
}: {
  initial: {
    fullName: string;
    phone: string;
    state: string;
    city: string;
    email: string;
    avatarUrl: string | null;
  };
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AccountActionResult | null>(null);
  const [avatarResult, setAvatarResult] = useState<AccountActionResult | null>(
    null,
  );
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: initial.fullName,
      phone: initial.phone,
      state: initial.state,
      city: initial.city,
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = (values: ProfileUpdateInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await updateProfileAction(values);
      setResult(outcome);
      if (outcome.ok) {
        router.refresh();
      }
    });
  };

  const selectFile = (selected: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
    setFile(selected);
    setAvatarResult(null);
  };

  const uploadAvatar = () => {
    if (!file) {
      return;
    }
    setAvatarResult(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const outcome = await uploadAvatarAction(formData);
      setAvatarResult(outcome);
      if (outcome.ok) {
        setAvatarUrl(outcome.avatarUrl ?? null);
        setFile(null);
        selectFile(null);
        if (fileInput.current) {
          fileInput.current.value = "";
        }
        router.refresh();
      }
    });
  };

  const removeAvatar = () => {
    setAvatarResult(null);
    startTransition(async () => {
      const outcome = await removeAvatarAction();
      setAvatarResult(outcome);
      if (outcome.ok) {
        setAvatarUrl(null);
        setFile(null);
        selectFile(null);
        if (fileInput.current) {
          fileInput.current.value = "";
        }
        router.refresh();
      }
    });
  };

  const serverFieldErrors =
    result && !result.ok ? result.fieldErrors : undefined;
  const displayAvatar = previewUrl ?? avatarUrl;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16" size="lg">
          {displayAvatar ? (
            <AvatarImage src={displayAvatar} alt="" />
          ) : null}
          <AvatarFallback className="bg-brand-teal text-lg font-semibold text-white">
            {initials(initial.fullName, initial.email) || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="avatar-file">Profile photo</Label>
          <Input
            ref={fileInput}
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={uploadAvatar}
              disabled={!file || isPending}
            >
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadIcon />
              )}
              Upload photo
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={removeAvatar}
                disabled={isPending}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to {Math.round(AVATAR_MAX_BYTES / (1024 * 1024))}{" "}
            MB. Your photo is stored in a public bucket, so anyone with its link
            can view it.
          </p>
          {avatarResult ? (
            <FormAlert tone={avatarResult.ok ? "success" : "error"}>
              {avatarResult.message}
            </FormAlert>
          ) : null}
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName || serverFieldErrors?.fullName)}
            {...register("fullName")}
          />
          <FormFieldError
            messages={
              errors.fullName?.message
                ? [errors.fullName.message]
                : serverFieldErrors?.fullName
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. 080 0000 0000"
              aria-invalid={Boolean(errors.phone || serverFieldErrors?.phone)}
              {...register("phone")}
            />
            <FormFieldError
              messages={
                errors.phone?.message
                  ? [errors.phone.message]
                  : serverFieldErrors?.phone
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.state || serverFieldErrors?.state)}
              {...register("state")}
            />
            <FormFieldError
              messages={
                errors.state?.message
                  ? [errors.state.message]
                  : serverFieldErrors?.state
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city || serverFieldErrors?.city)}
            {...register("city")}
          />
          <FormFieldError
            messages={
              errors.city?.message
                ? [errors.city.message]
                : serverFieldErrors?.city
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={initial.email} readOnly disabled />
          <p className="text-xs text-muted-foreground">
            Contact platform support to change the email on your account.
          </p>
        </div>

        {result ? (
          <FormAlert tone={result.ok ? "success" : "error"}>
            {result.message}
          </FormAlert>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          Save profile
        </Button>
      </form>
    </div>
  );
}
