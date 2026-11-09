import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangleIcon, CircleDollarSignIcon, ClockIcon, ShieldCheckIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
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
import { VerifyPaymentButton } from "@/features/payments/components/payment-actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  paymentPurposeLabels,
  paymentStatusLabels,
  type PaymentPurposeOption,
} from "@/lib/validation/payments";
import { requirePermissionPage } from "@/server/auth/require-permission";
import {
  getReconciliationSummary,
  listAdminPayments,
} from "@/server/payments/queries";
import type { PaymentSummary } from "@/server/payments/queries";

export const metadata: Metadata = {
  title: "Payment reconciliation",
};

function PaymentTable({
  payments,
  emptyTitle,
  emptyDescription,
}: {
  payments: PaymentSummary[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (payments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Payer</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reconciliation</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              <Link
                href={`/dashboard/admin/payments/${encodeURIComponent(payment.reference)}`}
                className="font-mono text-xs font-medium text-brand-teal hover:underline"
              >
                {payment.reference}
              </Link>
            </TableCell>
            <TableCell>
              <span className="block text-sm font-medium text-brand-strong">
                {payment.payerName ?? "—"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {payment.payerEmail}
              </span>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {paymentPurposeLabels[payment.purpose as PaymentPurposeOption] ??
                payment.purpose.replaceAll("_", " ")}
            </TableCell>
            <TableCell className="text-sm font-medium tabular-nums text-brand-strong">
              {formatMoney(payment.amountMinorUnits, payment.currency)}
            </TableCell>
            <TableCell>
              <StatusBadge
                status={payment.status}
                label={paymentStatusLabels[payment.status]}
              />
            </TableCell>
            <TableCell>
              <StatusBadge status={payment.reconciliationStatus} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTime(payment.createdAt)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <VerifyPaymentButton reference={payment.reference} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminReconciliationPage() {
  await requirePermissionPage(
    "/dashboard/admin/reconciliation",
    "payment_review",
  );

  const [summary, pending, mismatches, reviewRequired, matched] =
    await Promise.all([
      getReconciliationSummary(),
      listAdminPayments({ statuses: ["initiated", "pending"], limit: 100 }),
      listAdminPayments({ reconciliation: "mismatch", limit: 100 }),
      listAdminPayments({ reconciliation: "review_required", limit: 100 }),
      listAdminPayments({ reconciliation: "matched", limit: 25 }),
    ]);

  const needsAttention = [...mismatches, ...reviewRequired];

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Reconciliation"
        description="Compare HillCrest records with the payment provider. Never confirm a payment from a browser redirect — verification always happens server-side."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" },
          { label: "Reconciliation" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Matched successful"
          value={summary.successfulCount}
          icon={<ShieldCheckIcon aria-hidden="true" />}
          hint={formatMoney(summary.successfulMinorUnits, "NGN")}
        />
        <MetricCard
          label="Awaiting verification"
          value={summary.pendingCount}
          icon={<ClockIcon aria-hidden="true" />}
        />
        <MetricCard
          label="Needs review"
          value={needsAttention.length}
          icon={<AlertTriangleIcon aria-hidden="true" />}
          hint="Mismatch or flagged by verification"
        />
        <MetricCard
          label="Refunded"
          value={formatMoney(summary.refundedMinorUnits, "NGN")}
          icon={<CircleDollarSignIcon aria-hidden="true" />}
        />
      </div>

      {needsAttention.length > 0 ? (
        <Card className="overflow-hidden border-brand-warning/40 p-0">
          <div className="border-b border-border bg-brand-warning/10 p-4">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Needs attention
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These payments could not be automatically matched. Verify them
              individually; do not edit amounts manually.
            </p>
          </div>
          <PaymentTable
            payments={needsAttention}
            emptyTitle="Nothing flagged"
            emptyDescription="No payments require manual review."
          />
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Awaiting verification
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Initiated or pending payments. Verification calls the provider and
            only updates the ledger when the amounts and currency match.
          </p>
        </div>
        <PaymentTable
          payments={pending}
          emptyTitle="Nothing awaiting verification"
          emptyDescription="Every initiated payment has been reconciled."
        />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Recently matched
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The latest payments confirmed against the provider.
          </p>
        </div>
        <PaymentTable
          payments={matched}
          emptyTitle="No matched payments yet"
          emptyDescription="Verified payments will appear here."
        />
      </Card>
    </div>
  );
}
