import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/server/auth/current-user";
import { listIssuedCertificates } from "@/server/academy/queries";

export const metadata: Metadata = {
  title: "Certificates",
};

export default async function CertificatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/academy/certificates");
  }

  const certificates = await listIssuedCertificates(user);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy"
        title="Certificates"
        description="Certificates record course completion. Each one has a public verification code that can be checked without signing in."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Academy", href: "/dashboard/academy" },
          { label: "Certificates" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/verify-certificate">Verify a certificate</Link>
          </Button>
        }
      />

      {certificates.length === 0 ? (
        <Card className="p-6 text-center">
          <ShieldCheckIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 font-heading font-semibold text-brand-strong">
            No certificates yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete all required lessons in a certificate-enabled course to
            earn one.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/academy/learning">Go to My Learning</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold text-brand-strong">
                    {certificate.courseTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {certificate.learnerName} · {certificate.issuerName}
                  </p>
                </div>
                <Badge variant={certificate.revokedAt ? "destructive" : "default"}>
                  {certificate.revokedAt ? "Revoked" : "Valid"}
                </Badge>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Certificate no.</dt>
                  <dd className="font-medium text-brand-strong">
                    {certificate.certificateNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="text-brand-strong">
                    {new Date(certificate.issuedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {certificate.credentialScope}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/verify-certificate/${certificate.verificationCode}`}>
                    <ShieldCheckIcon />
                    Verify
                  </Link>
                </Button>
                {certificate.courseSlug ? (
                  <Button variant="outline" asChild>
                    <Link href={`/courses/${certificate.courseSlug}`}>
                      View course
                    </Link>
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Certificates confirm completion of CareBridge Academy course content.
        They are not a government licence or an external professional
        accreditation.
      </p>
    </div>
  );
}
