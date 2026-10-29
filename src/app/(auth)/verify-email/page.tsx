import type { Metadata } from "next";
import Link from "next/link";
import { MailCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/components/auth-ui";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email address"
      description="We sent a verification link to your email."
      footer={
        <span>
          Already verified?{" "}
          <Link href="/login" className="font-medium text-brand-teal hover:underline">
            Sign in
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
          <p className="text-sm text-brand-navy">
            Open the link in that email to activate your account. Verification
            links expire, so request a new one if needed.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Return to sign in</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
