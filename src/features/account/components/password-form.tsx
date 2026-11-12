"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  changePasswordAction,
  type AccountActionResult,
} from "@/features/account/actions";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validation/account";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AccountActionResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ChangePasswordInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await changePasswordAction(values);
      setResult(outcome);
      if (outcome.ok) {
        reset();
      }
    });
  };

  const serverFieldErrors =
    result && !result.ok ? result.fieldErrors : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(
            errors.currentPassword || serverFieldErrors?.currentPassword,
          )}
          {...register("currentPassword")}
        />
        <FormFieldError
          messages={
            errors.currentPassword?.message
              ? [errors.currentPassword.message]
              : serverFieldErrors?.currentPassword
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(
              errors.newPassword || serverFieldErrors?.newPassword,
            )}
            {...register("newPassword")}
          />
          <FormFieldError
            messages={
              errors.newPassword?.message
                ? [errors.newPassword.message]
                : serverFieldErrors?.newPassword
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(
              errors.confirmPassword || serverFieldErrors?.confirmPassword,
            )}
            {...register("confirmPassword")}
          />
          <FormFieldError
            messages={
              errors.confirmPassword?.message
                ? [errors.confirmPassword.message]
                : serverFieldErrors?.confirmPassword
            }
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Use at least 8 characters with a letter and a number. Changing your
        password signs out other devices at their next request.
      </p>

      {result ? (
        <FormAlert tone={result.ok ? "success" : "error"}>
          {result.message}
        </FormAlert>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <KeyRoundIcon />}
        Change password
      </Button>
    </form>
  );
}
