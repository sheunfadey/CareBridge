"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/components/auth-ui";
import { enrolAction } from "@/features/academy/actions";
import { startCoursePaymentAction } from "@/features/payments/actions";
import { formatMoney } from "@/lib/format";

type CourseEnrolmentCtaProps = {
  courseId: string;
  priceMinorUnits: number;
  currency: string;
  isAuthenticated: boolean;
  returnTo: string;
  label?: string;
  size?: "default" | "lg";
  variant?: "default" | "outline";
};

export function CourseEnrolmentCta({
  courseId,
  priceMinorUnits,
  currency,
  isAuthenticated,
  returnTo,
  label,
  size = "lg",
  variant = "default",
}: CourseEnrolmentCtaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPaid = priceMinorUnits > 0;
  const buttonLabel =
    label ??
    (isPaid
      ? `Buy course · ${formatMoney(priceMinorUnits, currency)}`
      : "Enrol free");

  const onClick = () => {
    setError(null);

    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    startTransition(async () => {
      if (isPaid) {
        const result = await startCoursePaymentAction(courseId);
        if (!result.ok) {
          if (result.redirectTo) router.push(result.redirectTo);
          else setError(result.message);
        }
        return;
      }

      const result = await enrolAction(courseId);
      if (result.ok && result.redirectTo) {
        router.push(result.redirectTo);
      } else if (!result.ok) {
        setError(result.message);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button size={size} variant={variant} onClick={onClick} disabled={isPending}>
        {isPending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : isPaid ? (
          <CreditCardIcon aria-hidden="true" />
        ) : null}
        {isPending ? "Please wait..." : buttonLabel}
      </Button>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
    </div>
  );
}
