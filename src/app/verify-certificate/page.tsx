import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading, SiteSection } from "@/components/site/site-section";
import { VerifyCertificateForm } from "@/features/academy/components/verify-certificate-form";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description:
    "Check a HillCrest Academy certificate using its verification code.",
};

export default function VerifyCertificatePage() {
  return (
    <SiteSection tone="ivory">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-sky text-brand-teal">
            <ShieldCheckIcon className="size-6" />
          </span>
          <div className="mt-4">
            <SectionHeading
              align="center"
              eyebrow="Certificate verification"
              title="Check a HillCrest certificate"
              description="Enter the verification code printed on the certificate. Verification is public and does not require an account."
            />
          </div>
        </div>
        <Card className="p-6">
          <VerifyCertificateForm />
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Looking for your own certificates?{" "}
          <Link href="/dashboard/academy/certificates" className="underline">
            Open your certificate record
          </Link>
          .
        </p>
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </div>
    </SiteSection>
  );
}
