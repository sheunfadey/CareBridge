import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangleIcon, CheckCircle2Icon, ShieldXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteSection } from "@/components/site/site-section";
import { verifyCertificate } from "@/server/academy/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Certificate verification",
  robots: { index: false, follow: false },
};

type VerifyCodePageProps = {
  params: Promise<{ code: string }>;
};

export default async function VerifyCodePage({ params }: VerifyCodePageProps) {
  const { code } = await params;
  await connection();
  const certificate = await verifyCertificate(decodeURIComponent(code));

  if (!certificate) {
    return (
      <SiteSection>
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-error/10 text-brand-error">
            <ShieldXIcon className="size-6" />
          </span>
          <h1 className="font-heading text-3xl font-semibold text-brand-strong">
            Certificate not found
          </h1>
          <p className="text-muted-foreground">
            No certificate matches that verification code. Check the code
            printed on the certificate and try again.
          </p>
          <Button asChild>
            <Link href="/verify-certificate">Try another code</Link>
          </Button>
        </div>
      </SiteSection>
    );
  }

  return (
    <SiteSection tone="ivory">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <span
            className={`mx-auto flex size-12 items-center justify-center rounded-full ${
              certificate.revoked
                ? "bg-brand-error/10 text-brand-error"
                : "bg-brand-success/10 text-brand-success"
            }`}
          >
            {certificate.revoked ? (
              <AlertTriangleIcon className="size-6" />
            ) : (
              <CheckCircle2Icon className="size-6" />
            )}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold text-brand-strong">
            {certificate.revoked
              ? "Certificate revoked"
              : "Certificate verified"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {certificate.revoked
              ? "This certificate was issued but has since been revoked."
              : "This certificate is valid and was issued by the provider named below."}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-teal">
                Certificate of completion
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold text-brand-strong">
                {certificate.learnerName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                has completed
              </p>
              <p className="mt-1 font-heading text-lg font-semibold text-brand-strong">
                {certificate.courseTitle}
              </p>
            </div>
            <Badge variant={certificate.revoked ? "destructive" : "default"}>
              {certificate.revoked ? "Revoked" : "Valid"}
            </Badge>
          </div>

          <dl className="mt-6 grid gap-4 border-t pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Certificate number
              </dt>
              <dd className="mt-1 font-medium text-brand-strong">
                {certificate.certificateNumber}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Issued by
              </dt>
              <dd className="mt-1 font-medium text-brand-strong">
                {certificate.issuerName}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Issued on
              </dt>
              <dd className="mt-1 font-medium text-brand-strong">
                {new Date(certificate.issuedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Scope
              </dt>
              <dd className="mt-1 text-brand-strong">
                {certificate.credentialScope}
              </dd>
            </div>
          </dl>

          <p className="mt-6 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            {certificate.disclaimer}
          </p>
        </Card>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/verify-certificate">Verify another certificate</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/courses">Browse HillCrest courses</Link>
          </Button>
        </div>
      </div>
    </SiteSection>
  );
}
