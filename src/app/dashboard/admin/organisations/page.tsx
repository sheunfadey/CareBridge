import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import { OrganisationActions } from "@/features/admin/components/organisation-actions";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import { adminService } from "@/server/admin/admin-service";

export const metadata: Metadata = {
  title: "Organisation management",
};

export default async function AdminOrganisationsPage() {
  await requireSuperAdminPage("/dashboard/admin/organisations");

  const [pending, all] = await Promise.all([
    adminService.listPendingOrganisations(50),
    adminService.listOrganisations({ limit: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform administration"
        title="Organisations"
        description="Approve, verify and manage organisations across every tenant. Decisions require an audit reason."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/dashboard/admin" },
          { label: "Organisations" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          Approval queue
        </h2>
        {!pending.ok ? (
          <Card className="p-5 text-sm text-muted-foreground">
            {pending.message}
          </Card>
        ) : pending.data.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              title="Nothing awaiting review"
              description="New organisations awaiting approval will appear here."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.data.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {org.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {org.city ? `${org.city}, ` : ""}
                        {org.state ?? "Nigeria"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {org.type.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={org.status} />
                    </TableCell>
                    <TableCell>
                      <OrganisationActions
                        organisationId={org.id}
                        organisationName={org.name}
                        status={org.status}
                        verificationStatus={org.verification_status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          All organisations
        </h2>
        {!all.ok ? (
          <Card className="p-5 text-sm text-muted-foreground">
            {all.message}
          </Card>
        ) : all.data.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              title="No organisations yet"
              description="Organisations will appear here once they are created."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.data.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <span className="block text-sm font-medium text-brand-navy">
                        {org.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {org.slug}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {org.type.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={org.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={org.verification_status} />
                    </TableCell>
                    <TableCell>
                      <OrganisationActions
                        organisationId={org.id}
                        organisationName={org.name}
                        status={org.status}
                        verificationStatus={org.verification_status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}
