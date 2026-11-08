"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  AuthCard,
  FormAlert,
  FormFieldError,
} from "@/features/auth/components/auth-ui";
import { loginAction, type ActionResult } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const callbackError = searchParams.get("error");

  const notice =
    callbackError === "auth_failed"
      ? "That link is invalid or has expired. Sign in or request a new link."
      : callbackError === "missing_code"
        ? "The verification link was incomplete. Try signing in again."
        : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await loginAction(values);
      setResult(outcome);
      if (outcome.ok) {
        router.push(redirectTo);
        router.refresh();
      }
    });
  };

  const serverFieldErrors =
    result && !result.ok ? result.fieldErrors : undefined;

  return (
    <AuthCard
      title="Sign in to HillCrest"
      description="Welcome back. Continue where you left off."
      footer={
        <span>
          New to HillCrest?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-teal hover:underline"
          >
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {notice ? <FormAlert tone="info">{notice}</FormAlert> : null}
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
            messages={
              errors.email?.message ? [errors.email.message] : serverFieldErrors?.email
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-teal hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FormFieldError
            messages={
              errors.password?.message
                ? [errors.password.message]
                : serverFieldErrors?.password
            }
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
