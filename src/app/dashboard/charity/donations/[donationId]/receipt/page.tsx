import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrintButton } from "@/features/charity/components/charity-forms";
import { formatDate, formatMoney } from "@/lib/format";
import { donationStatusLabels } from "@/lib/validation/charity";
import { getCurrentUser } from "@/server/auth/current-user";
import { getDonationReceipt } from "@/server/charity/queries";

export const metadata: Metadata = {
  title: "Donation receipt",
};

export default async function DonationReceiptPage({
  params,
}: {
  params: Promise<{ donationId: string }>;
}) {
  const { donationId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(`/dashboard/charity/donations/${donationId}/receipt`)}`,
    );
  }

  const receipt = await getDonationReceipt(user, donationId);
  if (!receipt) notFound();

  const netAmount = receipt.amountMinorUnits - receipt.refundedAmountMinorUnits;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Donation receipt"
        title={receipt.receiptReference ?? "Receipt"}
        description="This receipt records a donation to a charity campaign. Donations are held separately from commercial revenue."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Charity", href: "/dashboard/charity" },
          {
            label: "Donations",
            href: "/dashboard/charity/donations",
          },
          { label: "Receipt" },
        ]}
        actions={<PrintButton />}
      />

      <Card className="space-y-6 p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">
              CareBridge Charity
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-brand-navy">
              Donation receipt
            </h2>
          </div>
          <StatusBadge
            status={receipt.status}
            label={donationStatusLabels[receipt.status]}
          />
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Receipt number</dt>
            <dd className="font-mono text-brand-navy">
              {receipt.receiptReference ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-brand-navy">
              {formatDate(receipt.paidAt ?? receipt.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Donor</dt>
            <dd className="text-brand-navy">{receipt.donorLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Campaign</dt>
            <dd className="text-brand-navy">{receipt.campaignTitle}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Donation amount</dt>
            <dd className="font-medium tabular-nums text-brand-navy">
              {formatMoney(receipt.amountMinorUnits, receipt.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Refunded</dt>
            <dd className="tabular-nums text-brand-navy">
              {formatMoney(receipt.refundedAmountMinorUnits, receipt.currency)}
            </dd>
          </div>
          <div className="sm:col-span-2 rounded-md bg-muted/50 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Net donation recorded
            </dt>
            <dd className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-navy">
              {formatMoney(netAmount, receipt.currency)}
            </dd>
          </div>
        </dl>

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            This receipt is issued for a donation recorded after server-side
            payment verification. It is not a tax certificate. Contact the
            charity for any jurisdiction-specific documentation.
          </p>
          <p className="mt-2">
            Public acknowledgement: {receipt.isPublic ? "enabled" : "private"}.
            Donor contact details are never published.
          </p>
        </div>
      </Card>

      <Button asChild variant="ghost">
        <Link href="/dashboard/charity/donations">Back to donations</Link>
      </Button>
    </div>
  );
}
