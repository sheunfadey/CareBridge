import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

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
import {
  RefundPaymentDialog,
  VerifyPaymentButton,
} from "@/features/payments/components/payment-actions";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  paymentPurposeLabels,
  paymentReconciliationStatusLabels,
  paymentStatusLabels,
  type PaymentPurposeOption,
} from "@/lib/validation/payments";
import { userHasPermission } from "@/server/auth/current-user";
import { requirePermissionPage } from "@/server/auth/require-permission";
import { getPaymentDetail } from "@/server/payments/queries";

export const metadata: Metadata = {
  title: "Payment detail",
};

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await requirePermissionPage(
    "/dashboard/admin/payments",
    "payment_review",
  );
  const { reference } = await params;
  const payment = await getPaymentDetail(decodeURIComponent(reference));

  if (!payment) {
    notFound();
  }

  const canRefund = userHasPermission(user, "refund_process");
  const canVerify = userHasPermission(user, "payment_review");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title={payment.reference}
        description={`${paymentPurposeLabels[payment.purpose as PaymentPurposeOption] ?? payment.purpose} · ${payment.payerEmail}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" },
          { label: "Payments", href: "/dashboard/admin/payments" },
          { label: payment.reference },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/admin/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-navy"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          All payments
        </Link>
        <span className="text-muted-foreground">·</span>
        {canVerify ? <VerifyPaymentButton reference={payment.reference} /> : null}
        {canRefund &&
        ["successful", "partially_refunded"].includes(payment.status) ? (
          <RefundPaymentDialog
            reference={payment.reference}
            amountMinorUnits={payment.amountMinorUnits}
            refundedMinorUnits={payment.refundedMinorUnits}
            currency={payment.currency}
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={payment.status}
              label={paymentStatusLabels[payment.status]}
            />
            <StatusBadge
              status={payment.reconciliationStatus}
              label={
                paymentReconciliationStatusLabels[payment.reconciliationStatus]
              }
            />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-heading text-2xl font-semibold tabular-nums text-brand-navy">
                {formatMoney(payment.amountMinorUnits, payment.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Refunded</dt>
              <dd className="font-medium tabular-nums text-brand-navy">
                {formatMoney(payment.refundedMinorUnits, payment.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payer</dt>
              <dd className="font-medium text-brand-navy">
                {payment.payerName ?? "—"}
                <span className="block text-xs text-muted-foreground">
                  {payment.payerEmail}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Provider reference</dt>
              <dd className="font-mono text-xs text-brand-navy">
                {payment.providerReference ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-brand-navy">
                {formatDateTime(payment.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Paid</dt>
              <dd className="text-brand-navy">{formatDateTime(payment.paidAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last verified</dt>
              <dd className="text-brand-navy">
                {formatDateTime(payment.lastVerifiedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="text-brand-navy">{payment.description ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-heading text-lg font-semibold text-brand-navy">
            Provider data
          </h2>
          <p className="text-xs text-muted-foreground">
            Raw provider payloads are stored for reconciliation and are never
            used as the source of truth for balances.
          </p>
          <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-brand-navy">
            {JSON.stringify(payment.providerPayload, null, 2)}
          </pre>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-brand-navy">
            {JSON.stringify(payment.metadata, null, 2)}
          </pre>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-navy">
            Refunds
          </h2>
        </div>
        {payment.refunds.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No refunds have been requested for this payment.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Provider reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payment.refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(refund.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm font-medium tabular-nums text-brand-navy">
                    {formatMoney(refund.amountMinorUnits, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={refund.status} />
                  </TableCell>
                  <TableCell className="max-w-80 text-sm text-muted-foreground">
                    {refund.reason}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {refund.providerReference ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-navy">
            Webhook events
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signature verification and idempotency are enforced before an event
            is processed.
          </p>
        </div>
        {payment.webhookEvents.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No webhook events have been recorded.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payment.webhookEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(event.receivedAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-brand-navy">
                    {event.eventType}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={event.processingStatus} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {event.attempts}
                  </TableCell>
                  <TableCell className="max-w-80 text-sm text-muted-foreground">
                    {event.errorMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
