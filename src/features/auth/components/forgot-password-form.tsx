"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { forgotPasswordAction, type ActionResult } from "@/features/auth/actions";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    setResult(null);
    startTransition(async () => {
      setResult(await forgotPasswordAction(values));
    });
  };

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we will send a reset link."
      footer={
        <span>
          Remembered it?{" "}
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
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FormFieldError
            messages={errors.email?.message ? [errors.email.message] : undefined}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
