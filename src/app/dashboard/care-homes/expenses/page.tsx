import type { Metadata } from "next";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
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
import { ExpenseDialogForm, PurchaseRequestDialogForm, PurchaseReviewButtons } from "@/features/care/components/care-forms";
import { formatDate, formatMoney } from "@/lib/format";
import {
  expensePaymentStatusLabels,
  purchaseRequestStatusLabels,
} from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import {
  listExpenses,
  listPurchaseRequests,
  listSuppliers,
} from "@/server/care/queries";
import type { ExpensePaymentStatus, PurchaseRequestStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Expenses",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "expense_manage",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/expenses",
  });

  const [expenses, suppliers, purchaseRequests] = await Promise.all([
    listExpenses(context.workspace, context.facility?.id),
    listSuppliers(context.workspace),
    listPurchaseRequests(context.workspace, context.facility?.id),
  ]);
  const canApprove = await context.can("expense_approve");

  const total = expenses.reduce((sum, expense) => sum + expense.amountMinorUnits, 0);
  const unpaid = expenses
    .filter((expense) => expense.paymentStatus === "unpaid")
    .reduce((sum, expense) => sum + expense.amountMinorUnits, 0);

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Expenses"
        description="Operational spend by facility and category, with receipt references and payment status."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Expenses" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            {context.facility ? (
              <PurchaseRequestDialogForm
                organisationId={context.workspace.organisationId}
                facilityId={context.facility.id}
              />
            ) : null}
            <ExpenseDialogForm
              organisationId={context.workspace.organisationId}
              facilities={context.facilities}
              suppliers={suppliers}
              defaultFacilityId={context.facility?.id}
            />
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/expenses"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Recorded spend</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(total, "NGN")}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-strong sm:text-2xl">
            {formatMoney(unpaid, "NGN")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Purchase requests
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Requests are approved by a user with expense approval permission.
            Receipts and purchases are recorded separately as expenses.
          </p>
        </div>
        {purchaseRequests.length === 0 ? (
          <EmptyState
            title="No purchase requests"
            description="Create a request for stock or services that need approval."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Needed by</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-sm text-brand-strong">
                    {request.items.map((item) => item.description).join(", ") ||
                      "Purchase request"}
                    {request.notes ? (
                      <p className="text-xs text-muted-foreground">{request.notes}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.requestedByName ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {request.neededBy ? formatDate(request.neededBy) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(request.estimatedTotalMinorUnits, "NGN")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={request.status}
                      label={
                        purchaseRequestStatusLabels[
                          request.status as PurchaseRequestStatus
                        ]
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canApprove && request.status === "submitted" ? (
                      <PurchaseReviewButtons
                        organisationId={context.workspace.organisationId}
                        requestId={request.id}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses recorded"
            description="Record operational spend to track payment status and receipts."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(expense.incurredOn)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-brand-strong">
                    {expense.category}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.supplierName ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-72 text-sm text-muted-foreground">
                    {expense.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {formatMoney(expense.amountMinorUnits, expense.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={expense.paymentStatus}
                      label={
                        expensePaymentStatusLabels[
                          expense.paymentStatus as ExpensePaymentStatus
                        ]
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.receiptReference ?? "—"}
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
