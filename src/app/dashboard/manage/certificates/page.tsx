import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AwardIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  getCurrentUser,
  userHasPermission,
} from "@/server/auth/current-user";
import { getTrainerCertificates } from "@/server/trainer/queries";

export const metadata: Metadata = { title: "Issued certificates" };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export default async function OrganisationCertificatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirectTo=/dashboard/manage/certificates");
  if (
    !userHasPermission(user, "course_manage") &&
    !userHasPermission(user, "course_publish")
  ) {
    redirect("/dashboard");
  }

  const certificates = await getTrainerCertificates(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-5">
      <PageHeader
        eyebrow="Organisation admin"
        title="Certificates"
        description="Certificates issued to learners across your organisation's courses, with public verification links."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Certificates" },
        ]}
        actions={
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/dashboard/academy/manage">Course Studio</Link>
          </Button>
        }
      />

      {certificates.length === 0 ? (
        <div className="rounded-[var(--radius-2xl)] bg-card/85 p-6 text-center ring-1 ring-foreground/10 sm:p-8">
          <AwardIcon className="mx-auto size-9 text-portal-peach-strong" />
          <p className="mt-3 font-heading text-lg font-semibold text-brand-strong">
            No certificates issued yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Certificates appear here when learners complete certificate-enabled
            courses.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="flex flex-col rounded-[var(--radius-2xl)] bg-card/90 p-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-portal-peach text-portal-peach-strong">
                  <AwardIcon className="size-5" />
                </span>
                <span
                  className={
                    certificate.revokedAt
                      ? "rounded-full bg-brand-error/10 px-2 py-1 text-[10px] font-semibold text-brand-error"
                      : "rounded-full bg-portal-mint px-2 py-1 text-[10px] font-semibold text-portal-mint-strong"
                  }
                >
                  {certificate.revokedAt ? "Revoked" : "Valid"}
                </span>
              </div>
              <p className="mt-3 font-heading text-sm font-semibold text-brand-strong">
                {certificate.courseTitle}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {certificate.learnerName}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Certificate no.</dt>
                  <dd className="mt-0.5 font-medium text-brand-strong">
                    {certificate.certificateNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Issued</dt>
                  <dd className="mt-0.5 text-brand-strong">
                    {formatDate(certificate.issuedAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-auto pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-full"
                  asChild
                >
                  <Link
                    href={`/verify-certificate/${certificate.verificationCode}`}
                  >
                    Verify certificate
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
