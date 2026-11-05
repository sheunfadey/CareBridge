"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LucideIcon } from "lucide-react";
import {
  BookOpenIcon,
  BriefcaseIcon,
  Building2Icon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  Share2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "cn";
import {
  FormAlert,
  FormFieldError,
} from "@/features/auth/components/auth-ui";
import {
  completeOnboardingAction,
  type ActionResult,
} from "@/features/auth/actions";
import {
  ACCOUNT_TYPES,
  accountTypeLabels,
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/auth";
import type { AccountType } from "@/types/database";

const accountTypeIcons: Record<AccountType, LucideIcon> = {
  caregiver: GraduationCapIcon,
  training_provider: BookOpenIcon,
  care_provider: Building2Icon,
  referral_partner: Share2Icon,
  charity: HeartHandshakeIcon,
  employer: BriefcaseIcon,
};

export function OnboardingForm({
  defaultFullName,
}: {
  defaultFullName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: defaultFullName,
      phone: "",
      state: "",
      city: "",
      accountType: "caregiver",
    },
  });

  const accountType = useWatch({ control, name: "accountType" });

  const onSubmit = (values: OnboardingInput) => {
    setResult(null);
    startTransition(async () => {
      const outcome = await completeOnboardingAction(values);
      setResult(outcome);
      if (outcome.ok && outcome.redirectTo) {
        router.push(outcome.redirectTo);
        router.refresh();
      }
    });
  };

  const serverFieldErrors =
    result && !result.ok ? result.fieldErrors : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold text-brand-strong">
          Set up your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us who you are so we can tailor your workspace. You can add more
          roles later through your organisation.
        </p>
      </header>

      {result && !result.ok ? (
        <FormAlert tone="error">{result.message}</FormAlert>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-brand-strong">
          I am joining as
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = accountTypeIcons[type];
            const selected = accountType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setValue("accountType", type, { shouldValidate: true })
                }
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                  selected
                    ? "border-brand-teal bg-brand-sky ring-1 ring-brand-teal"
                    : "border-border bg-card hover:border-brand-teal/40",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? "bg-brand-teal text-white"
                      : "bg-muted text-brand-slate",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium text-brand-strong">
                  {accountTypeLabels[type]}
                </span>
              </button>
            );
          })}
        </div>
        <FormFieldError
          messages={
            errors.accountType?.message ? [errors.accountType.message] : undefined
          }
        />
      </fieldset>

      <Card className="space-y-4 p-5">
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
              errors.fullName?.message ? [errors.fullName.message] : serverFieldErrors?.fullName
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. 080 0000 0000"
              {...register("phone")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State (optional)</Label>
            <Input id="state" autoComplete="address-level1" {...register("state")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City (optional)</Label>
          <Input id="city" autoComplete="address-level2" {...register("city")} />
        </div>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Continue to dashboard"}
      </Button>
    </form>
  );
}
