"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthCard,
  FormAlert,
  FormFieldError,
} from "@/features/auth/components/auth-ui";
import { resetPasswordAction, type ActionResult } from "@/features/auth/actions";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await resetPasswordAction(values);
      setResult(outcome);
      if (outcome.ok) {
        setTimeout(() => router.push("/login"), 1500);
      }
    });
  };

  return (
    <AuthCard
      title="Choose a new password"
      description="Set a strong password for your CareBridge account."
      footer={
        <span>
          <Link href="/login" className="font-medium text-brand-teal hover:underline">
            Back to sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {result?.ok ? (
          <FormAlert tone="success">{result.message}</FormAlert>
        ) : null}
        {result && !result.ok ? (
          <FormAlert tone="error">{result.message}</FormAlert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FormFieldError
            messages={
              errors.password?.message ? [errors.password.message] : undefined
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <FormFieldError
            messages={
              errors.confirmPassword?.message
                ? [errors.confirmPassword.message]
                : undefined
            }
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
