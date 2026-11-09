import type { Metadata } from "next";
import Link from "next/link";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
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
import { InvoiceDialogForm } from "@/features/care/components/care-forms";
import { formatDate, formatMoney } from "@/lib/format";
import {
  SERVICE_INVOICE_STATUSES,
  serviceInvoiceStatusLabels,
} from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import { listInvoices, listResidentOptions } from "@/server/care/queries";
import type { ServiceInvoiceStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    organisation?: string;
    facility?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "invoice_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/invoices",
  });

  const status = SERVICE_INVOICE_STATUSES.includes(
    params.status as ServiceInvoiceStatus,
  )
    ? (params.status as ServiceInvoiceStatus)
    : "all";

  const [invoices, residents] = await Promise.all([
    listInvoices(context.workspace, {
      facilityId: context.facility?.id,
      status,
    }),
    listResidentOptions(context.workspace, context.facility?.id),
  ]);

  const canManage = userHasPermission(context.user, "invoice_manage");
  const billed = invoices.reduce((sum, invoice) => sum + invoice.totalMinorUnits, 0);
  const outstanding = invoices.reduce(
    (sum, invoice) => sum + invoice.outstandingMinorUnits,
    0,
  );

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Invoices"
        description="Resident and payer invoices, payments, refunds and outstanding balances. Invoice numbers are allocated by the database."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Invoices" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            {canManage && context.facilities.length > 0 ? (
              <InvoiceDialogForm
                organisationId={context.workspace.organisationId}
                facilities={context.facilities}
                residents={residents}
                defaultFacilityId={context.facility?.id}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Total billed</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(billed, "NGN")}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(outstanding, "NGN")}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Invoices</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {invoices.length}
          </p>
        </Card>
      </div>

      <Card className="p-3.5">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <input type="hidden" name="organisation" value={context.workspace.organisationId} />
          {context.facility ? (
            <input type="hidden" name="facility" value={context.facility.id} />
          ) : null}
          <div>
            <label htmlFor="invoice-status" className="mb-1 block text-xs text-muted-foreground">
              Status
            </label>
            <select
              id="invoice-status"
              name="status"
              defaultValue={status}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {SERVICE_INVOICE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {serviceInvoiceStatusLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices"
            description="Create an invoice, add line items and issue it when ready."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs text-brand-strong">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {invoice.payerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invoice.residentName ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(invoice.issueDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(invoice.dueDate)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(invoice.totalMinorUnits, "NGN")}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(invoice.outstandingMinorUnits, "NGN")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={invoice.status}
                      label={serviceInvoiceStatusLabels[invoice.status]}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/care-homes/invoices/${invoice.id}`}>
                        Open
                      </Link>
                    </Button>
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
