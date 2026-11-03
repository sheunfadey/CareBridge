import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CharityNav } from "@/components/charity/charity-nav";
import { EmptyState } from "@/components/feedback/empty-state";
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
import { DonationPreferenceDialogForm } from "@/features/charity/components/charity-forms";
import { formatDateTime, formatMoney } from "@/lib/format";
import { donationStatusLabels } from "@/lib/validation/charity";
import { getCurrentUser } from "@/server/auth/current-user";
import { resolveCharityWorkspace } from "@/server/charity/access";
import {
  listCharityDonations,
  listMyDonations,
} from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Donations",
};

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard%2Fcharity%2Fdonations");
  }

  const workspace = await resolveCharityWorkspace(user, {
    requested: params.organisation,
  });
  const [myDonations, adminDonations] = await Promise.all([
    listMyDonations(user.id),
    workspace ? listCharityDonations(workspace) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Charity"
        title="Donations"
        description="Your donation history, receipts and acknowledgement preferences. Charity staff see verified campaign donations for their workspace."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          { label: "Donations" },
        ]}
      />

      <CharityNav
        user={user}
        organisationId={workspace?.organisationId}
        active="/donations"
      />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-navy">
            My donations
          </h2>
        </div>
        {myDonations.length === 0 ? (
          <EmptyState
            title="No donations yet"
            description="Donations appear here after the payment provider confirms them."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead className="text-right">Acknowledgement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="text-sm font-medium text-brand-navy">
                    {donation.campaignSlug ? (
                      <Link
                        href={`/charity/${donation.campaignSlug}`}
                        className="hover:text-brand-teal"
                      >
                        {donation.campaignTitle}
                      </Link>
                    ) : (
                      donation.campaignTitle
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-navy">
                    {formatMoney(donation.amountMinorUnits, donation.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={donation.status}
                      label={donationStatusLabels[donation.status]}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(donation.paidAt ?? donation.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/charity/donations/${donation.id}/receipt`}
                      className="text-sm font-medium text-brand-teal hover:underline"
                    >
                      {donation.receiptReference ?? "Receipt"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <DonationPreferenceDialogForm
                      donationId={donation.id}
                      isPublic={donation.isPublic}
                      donorDisplayName={donation.donorDisplayName}
                      message={donation.message}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {workspace ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-5">
            <h2 className="font-heading text-lg font-semibold text-brand-navy">
              Workspace donations
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Donations are separated from commercial revenue and reconciled from
              verified payments only.
            </p>
          </div>
          {adminDonations.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No donations have been verified for this workspace.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="text-sm text-brand-navy">
                      {donation.campaignTitle}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {donation.donorLabel}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-brand-navy">
                      {formatMoney(donation.amountMinorUnits, donation.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={donation.status}
                        label={donationStatusLabels[donation.status]}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {donation.isPublic ? "Acknowledged" : "Private"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(donation.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : null}
    </div>
  );
}
