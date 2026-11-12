import type { Metadata } from "next";
import Link from "next/link";
import { Building2Icon, PlusIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import { CreateOrganisationDialog } from "@/features/organisations/components/create-organisation-dialog";
import { listOrganisationsForUser } from "@/server/organisations/queries";
import { organisationTypeLabels } from "@/lib/validation/organisation";

export const metadata: Metadata = {
  title: "Organisation",
};

export default async function OrganisationListPage() {
  const organisations = await listOrganisationsForUser();

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Organisations"
        description="Workspaces you belong to. Each organisation has its own members, roles and permissions."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Organisation" }]}
        actions={
          <CreateOrganisationDialog>
            <Button>
              <PlusIcon />
              New organisation
            </Button>
          </CreateOrganisationDialog>
        }
      />

      {organisations.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-sky text-brand-teal">
            <Building2Icon className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="font-heading text-base font-semibold sm:text-lg text-brand-strong">
              No organisation yet
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a workspace for your care home, training provider or agency,
              or accept an invitation from an organisation you already work with.
            </p>
          </div>
          <CreateOrganisationDialog>
            <Button className="mt-1">
              <PlusIcon />
              Create organisation
            </Button>
          </CreateOrganisationDialog>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {organisations.map((org) => (
            <li key={org.id}>
              <Link
                href={`/dashboard/organisation/${org.id}`}
                className="group block h-full rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition hover:ring-brand-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-brand-sky text-brand-teal">
                    <Building2Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <StatusBadge status={org.status} />
                </div>
                <h2 className="mt-3 font-heading text-base font-semibold text-brand-strong">
                  {org.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {organisationTypeLabels[org.type]}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {org.isOwner ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-sky px-2 py-0.5 text-brand-teal">
                      <ShieldCheckIcon className="size-3.5" aria-hidden="true" />
                      Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon className="size-3.5" aria-hidden="true" />
                      Member
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
