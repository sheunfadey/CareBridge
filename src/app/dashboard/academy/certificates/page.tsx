import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PortalSection } from "@/features/portal/components/portal-ui";
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
  const learningLabel =
    user.activePortal === "caregiver" ? "My Learning" : "My Classroom";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-5">
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
          <Button
            variant="outline"
            className="rounded-full border-brand-navy/15 bg-card/70"
            asChild
          >
            <Link href="/verify-certificate">Verify a certificate</Link>
          </Button>
        }
      />

      {certificates.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-portal-mint text-portal-mint-strong">
            <ShieldCheckIcon className="size-7" />
          </span>
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            No certificates yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Complete all required lessons in a certificate-enabled course to
            earn one.
          </p>
          <Button className="mt-4 rounded-full" asChild>
            <Link href="/dashboard/academy/learning">
              Go to {learningLabel}
            </Link>
          </Button>
        </div>
      ) : (
        <PortalSection>
          <div className="grid gap-3 sm:grid-cols-2">
            {certificates.map((certificate) => (
              <article
                key={certificate.id}
                className="flex flex-col overflow-hidden rounded-[var(--radius-2xl)] bg-card/90 shadow-[0_12px_32px_-24px_rgb(16_43_92/0.4)] ring-1 ring-foreground/10"
              >
                <div className="relative overflow-hidden bg-portal-mint px-4 py-5">
                  <span
                    aria-hidden="true"
                    className="absolute -right-8 -top-10 size-28 rounded-full border-[10px] border-white/30"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-10 right-16 size-24 rounded-full bg-white/15"
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 text-portal-mint-strong">
                      <ShieldCheckIcon className="size-6" />
                    </span>
                    <span
                      className={
                        certificate.revokedAt
                          ? "rounded-full bg-brand-error/10 px-2.5 py-1 text-[11px] font-semibold text-brand-error"
                          : "rounded-full bg-white/70 dark:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-portal-mint-strong"
                      }
                    >
                      {certificate.revokedAt ? "Revoked" : "Valid"}
                    </span>
                  </div>
                  <p className="relative mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-portal-mint-strong">
                    Certificate of completion
                  </p>
                  <h2 className="relative mt-1 font-heading text-lg font-semibold text-brand-strong">
                    {certificate.courseTitle}
                  </h2>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-sm text-muted-foreground">
                    {certificate.learnerName} · {certificate.issuerName}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Certificate no.
                      </dt>
                      <dd className="mt-0.5 font-medium text-brand-strong">
                        {certificate.certificateNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Issued
                      </dt>
                      <dd className="mt-0.5 text-brand-strong">
                        {new Date(certificate.issuedAt).toLocaleDateString(
                          "en-NG",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    {certificate.credentialScope}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      asChild
                    >
                      <Link
                        href={`/verify-certificate/${certificate.verificationCode}`}
                      >
                        <ShieldCheckIcon />
                        Verify
                      </Link>
                    </Button>
                    {certificate.courseSlug ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        asChild
                      >
                        <Link href={`/courses/${certificate.courseSlug}`}>
                          View course
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </PortalSection>
      )}

      <p className="text-xs text-muted-foreground">
        Certificates confirm completion of HillCrest Academy course content.
        They are not a government licence or an external professional
        accreditation.
      </p>
    </div>
  );
}
