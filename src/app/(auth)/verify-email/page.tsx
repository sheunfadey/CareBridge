import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MailCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard } from "@/features/auth/components/auth-ui";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form";

export const metadata: Metadata = {
  title: "Verify your email",
};

function VerifyEmailSkeleton() {
  return (
    <AuthCard
      title="Verify your email address"
      description="We sent a verification link to your email."
    >
      <div className="space-y-5" aria-hidden="true">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </AuthCard>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthCard
      title="Verify your email address"
      description={
        email
          ? `We sent a verification link to ${email}.`
          : "We sent a verification link to your email."
      }
      footer={
        <span>
          Already verified?{" "}
          <Link href="/login" className="font-medium text-brand-teal hover:underline">
            Sign in
          </Link>{" "}
          <span className="text-muted-foreground">or</span>{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-brand-teal hover:underline"
          >
            reset your password
          </Link>
        </span>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-brand-teal/20 bg-brand-sky p-4">
          <MailCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-brand-teal"
          />
          <p className="text-sm text-brand-strong">
            Open the link in that email to activate your account. Verification
            links expire, so request a new one if needed. Check your spam or junk
            folder if it does not arrive within a few minutes.
          </p>
        </div>

        <ResendVerificationForm defaultEmail={email ?? ""} />

        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <Suspense fallback={<VerifyEmailSkeleton />}>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}
