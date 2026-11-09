import type { Metadata } from "next";
import Link from "next/link";
import { CircleDollarSignIcon, RefreshCwIcon, WalletIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  PAYMENT_RECONCILIATION_STATUSES,
  PAYMENT_STATUSES,
  paymentPurposeLabels,
  paymentReconciliationStatusLabels,
  paymentStatusLabels,
  type PaymentPurposeOption,
} from "@/lib/validation/payments";
import { userHasPermission } from "@/server/auth/current-user";
import { requirePermissionPage } from "@/server/auth/require-permission";
import {
  getReconciliationSummary,
  listAdminPayments,
} from "@/server/payments/queries";
import type {
  PaymentReconciliationStatus,
  PaymentStatus,
} from "@/types/database";

export const metadata: Metadata = {
  title: "Payments",
};

type SearchParams = {
  q?: string;
  status?: string;
  reconciliation?: string;
};

const reconciliationTones: Record<string, "neutral" | "info" | "success" | "warning" | "error"> = {
  pending: "warning",
  matched: "success",
  mismatch: "error",
  review_required: "warning",
  not_applicable: "neutral",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermissionPage(
    "/dashboard/admin/payments",
    "payment_review",
  );
  const params = await searchParams;
  const status = PAYMENT_STATUSES.includes(
    params.status as (typeof PAYMENT_STATUSES)[number],
  )
    ? (params.status as PaymentStatus)
    : undefined;
  const reconciliation = PAYMENT_RECONCILIATION_STATUSES.includes(
    params.reconciliation as (typeof PAYMENT_RECONCILIATION_STATUSES)[number],
  )
    ? (params.reconciliation as PaymentReconciliationStatus)
    : undefined;

  const [payments, summary] = await Promise.all([
    listAdminPayments({
      status,
      reconciliation,
      search: params.q,
      limit: 100,
    }),
    getReconciliationSummary(),
  ]);

  const canRefund = userHasPermission(user, "refund_process");

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Every payment is verified against the provider before it affects an account. Refunds are recorded in an append-only financial history."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Finance" },
          { label: "Payments" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Successful payments"
          value={summary.successfulCount}
          icon={<WalletIcon aria-hidden="true" />}
          href="/dashboard/admin/payments?status=successful"
        />
        <MetricCard
          label="Collected"
          value={formatMoney(summary.successfulMinorUnits, "NGN")}
          icon={<CircleDollarSignIcon aria-hidden="true" />}
          hint="Before refunds"
          href="/dashboard/admin/payments?status=successful"
        />
        <MetricCard
          label="Refunded"
          value={formatMoney(summary.refundedMinorUnits, "NGN")}
          icon={<RefreshCwIcon aria-hidden="true" />}
          href="/dashboard/admin/payments?status=refunded"
        />
        <MetricCard
          label="Awaiting verification"
          value={summary.pendingCount}
          icon={<RefreshCwIcon aria-hidden="true" />}
          hint={
            summary.mismatchCount > 0
              ? `${summary.mismatchCount} reconciliation mismatch(es)`
              : "No mismatches recorded"
          }
          href="/dashboard/admin/payments?status=pending"
        />
      </div>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              htmlFor="payment-search"
              className="text-xs font-medium text-muted-foreground"
            >
              Search
            </label>
            <Input
              id="payment-search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Reference, email or provider reference"
              className="w-72"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="payment-status"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="payment-status"
              name="status"
              defaultValue={status ?? "all"}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {paymentStatusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="payment-reconciliation"
              className="text-xs font-medium text-muted-foreground"
            >
              Reconciliation
            </label>
            <select
              id="payment-reconciliation"
              name="reconciliation"
              defaultValue={reconciliation ?? "all"}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="all">All</option>
              {PAYMENT_RECONCILIATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {paymentReconciliationStatusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/dashboard/admin/payments">Clear</Link>
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Payments will appear here as soon as a checkout is initiated."
          />
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reconciliation</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    {payment.providerReference ? (
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {payment.providerReference}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium text-brand-strong">
                      {payment.payerName ?? "—"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {payment.payerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {paymentPurposeLabels[
                      payment.purpose as PaymentPurposeOption
                    ] ?? payment.purpose.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="font-medium text-brand-strong">
                      {formatMoney(payment.amountMinorUnits, payment.currency)}
                    </span>
                    {payment.refundedMinorUnits > 0 ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatMoney(payment.refundedMinorUnits, payment.currency)} refunded
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={payment.status}
                      label={paymentStatusLabels[payment.status]}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={payment.reconciliationStatus}
                      label={
                        paymentReconciliationStatusLabels[
                          payment.reconciliationStatus
                        ]
                      }
                      tone={reconciliationTones[payment.reconciliationStatus]}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(payment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <VerifyPaymentButton reference={payment.reference} />
                      {canRefund &&
                      ["successful", "partially_refunded"].includes(
                        payment.status,
                      ) ? (
                        <RefundPaymentDialog
                          reference={payment.reference}
                          amountMinorUnits={payment.amountMinorUnits}
                          refundedMinorUnits={payment.refundedMinorUnits}
                          currency={payment.currency}
                        />
                      ) : null}
                    </div>
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
