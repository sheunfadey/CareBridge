import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CareNav } from "@/components/care/care-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
  IssueInvoiceButton,
  PaymentDialogForm,
  RefundDialogForm,
} from "@/features/care/components/care-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  serviceInvoiceStatusLabels,
  servicePaymentMethodLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { getInvoiceDetail } from "@/server/care/queries";
import type { ServicePaymentMethod } from "@/types/database";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const { invoiceId } = await params;
  const query = await searchParams;
  const context = await requireCarePage({
    permission: "invoice_view",
    requestedOrganisation: query.organisation,
    requestedFacility: query.facility,
    redirectTo: `/dashboard/care-homes/invoices/${invoiceId}`,
  });

  const invoice = await getInvoiceDetail(context.workspace, invoiceId);
  if (!invoice) notFound();

  const canManage = userHasPermission(context.user, "invoice_manage");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title={invoice.invoiceNumber}
        description={`${invoice.payerName}${invoice.residentName ? ` · ${invoice.residentName}` : ""} · due ${formatDate(invoice.dueDate)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          {
            label: "Invoices",
            href: `/dashboard/care-homes/invoices?organisation=${context.workspace.organisationId}`,
          },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <>
            <StatusBadge
              status={invoice.status}
              label={serviceInvoiceStatusLabels[invoice.status]}
            />
            {canManage && invoice.status === "draft" ? (
              <IssueInvoiceButton
                organisationId={context.workspace.organisationId}
                invoiceId={invoice.id}
              />
            ) : null}
            {canManage &&
            ["issued", "partially_paid", "overdue"].includes(invoice.status) ? (
              <PaymentDialogForm
                organisationId={context.workspace.organisationId}
                invoiceId={invoice.id}
              />
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/invoices"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Invoice total</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(invoice.totalMinorUnits, "NGN")}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(invoice.paidMinorUnits, "NGN")}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(invoice.outstandingMinorUnits, "NGN")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Invoice lines
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-sm text-brand-strong">{item.description}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatMoney(item.unitPriceMinorUnits, "NGN")}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                  {formatMoney(item.lineTotalMinorUnits, "NGN")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Payments
          </h2>
          {invoice.payments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {invoice.payments.map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium tabular-nums text-brand-strong">
                      {formatMoney(payment.amountMinorUnits, "NGN")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {servicePaymentMethodLabels[payment.method as ServicePaymentMethod]} ·{" "}
                      {formatDateTime(payment.paidAt)}
                      {payment.reference ? ` · ${payment.reference}` : ""}
                    </p>
                  </div>
                  {canManage ? (
                    <RefundDialogForm
                      organisationId={context.workspace.organisationId}
                      paymentId={payment.id}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {invoice.refunds.length > 0 ? (
            <div className="mt-4 border-t border-border pt-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Refunds
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {invoice.refunds.map((refund) => (
                  <li key={refund.id} className="flex justify-between gap-3">
                    <span className="text-brand-strong">{refund.reason}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatMoney(refund.amountMinorUnits, "NGN")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Notes
          </h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {invoice.notes ?? "No notes recorded."}
          </p>
          <dl className="grid gap-3 border-t border-border pt-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="font-medium text-brand-strong">{formatDate(invoice.issueDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-medium text-brand-strong">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payer contact</dt>
              <dd className="font-medium text-brand-strong">
                {invoice.payerContact ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Refunded</dt>
              <dd className="font-medium text-brand-strong">
                {formatMoney(invoice.refundedMinorUnits, "NGN")}
              </dd>
            </div>
          </dl>
          <Button asChild variant="ghost">
            <Link
              href={`/dashboard/care-homes/invoices?organisation=${context.workspace.organisationId}`}
            >
              Back to invoices
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
