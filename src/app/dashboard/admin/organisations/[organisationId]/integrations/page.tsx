import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import {
  getOrganisationBasic,
  listOrganisationIntegrations,
  type OrganisationIntegrationKind,
} from "@/server/admin/organisation-integrations";
import { OrganisationIntegrationForm } from "@/features/admin/components/organisation-integration-form";

export const metadata: Metadata = {
  title: "Organisation integrations",
};

const kinds: OrganisationIntegrationKind[] = [
  "paystack",
  "sms",
  "email",
  "custom_api",
];

export default async function OrganisationIntegrationsPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  await requireSuperAdminPage(
    `/dashboard/admin/organisations/${organisationId}/integrations`,
  );

  const [organisation, integrations] = await Promise.all([
    getOrganisationBasic(organisationId),
    listOrganisationIntegrations(organisationId),
  ]);

  if (!organisation) notFound();

  const byKind = new Map(integrations.map((row) => [row.kind, row]));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <AdminPageHeader
        eyebrow="Organisation integrations"
        title={organisation.name}
        description="Configure payment, SMS, email and custom API credentials for this organisation. Secrets are stored server-side and never returned to the browser."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Organisations", href: "/dashboard/admin/organisations" },
          { label: organisation.name, href: "/dashboard/admin/organisations" },
          { label: "Integrations" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/organisations">
              <ArrowLeftIcon />
              Back to organisations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {kinds.map((kind) => {
          const existing = byKind.get(kind);
          return (
            <Card key={kind} className="p-4">
              <OrganisationIntegrationForm
                organisationId={organisation.id}
                kind={kind}
                initial={{
                  provider:
                    existing?.provider ??
                    (kind === "paystack"
                      ? "paystack"
                      : kind === "email"
                        ? "resend"
                        : ""),
                  mode:
                    existing?.mode ??
                    (kind === "paystack" ? "sandbox" : ""),
                  publicKey: existing?.publicKey ?? "",
                  senderId: existing?.senderId ?? "",
                  senderName:
                    existing?.senderName ??
                    (kind === "email" ? organisation.name : ""),
                  config: existing?.config ?? {},
                  isEnabled: existing?.isEnabled ?? false,
                  hasSecret: existing?.hasSecret ?? false,
                  hasWebhookSecret: existing?.hasWebhookSecret ?? false,
                }}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
