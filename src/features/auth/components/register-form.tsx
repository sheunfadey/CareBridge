"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AuthCard,
  FormAlert,
  FormFieldError,
} from "@/features/auth/components/auth-ui";
import { registerAction, type ActionResult } from "@/features/auth/actions";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralCode: "",
      acceptTerms: false,
    },
  });

  const acceptedTerms = useWatch({ control, name: "acceptTerms" });

  const onSubmit = (values: RegisterInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await registerAction(values);
      setResult(outcome);
      if (outcome.ok && outcome.redirectTo) {
        router.push(outcome.redirectTo);
      }
    });
  };

  const serverFieldErrors =
    result && !result.ok ? result.fieldErrors : undefined;

  return (
    <AuthCard
      title="Create your HillCrest account"
      description="Start your caregiver journey or manage care operations."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-teal hover:underline"
          >
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {result && !result.ok ? (
          <FormAlert tone="error">{result.message}</FormAlert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
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
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
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
          <p className="text-xs text-muted-foreground">
            At least 8 characters, including a letter and a number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
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

        <div className="space-y-2">
          <Label htmlFor="referralCode">
            Referral code <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="referralCode"
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. ABC123"
            className="uppercase placeholder:normal-case"
            aria-invalid={Boolean(errors.referralCode)}
            {...register("referralCode")}
          />
          <FormFieldError
            messages={
              errors.referralCode?.message
                ? [errors.referralCode.message]
                : serverFieldErrors?.referralCode
            }
          />
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="acceptTerms"
            checked={acceptedTerms}
            onCheckedChange={(checked) =>
              setValue("acceptTerms", checked === true, { shouldValidate: true })
            }
          />
          <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
            I agree to the{" "}
            <Link href="/terms" className="text-brand-teal hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand-teal hover:underline">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>
        <FormFieldError
          messages={
            errors.acceptTerms?.message ? [errors.acceptTerms.message] : undefined
          }
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
