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
import { ExpenseDialogForm } from "@/features/care/components/care-forms";
import { formatDate, formatMoney } from "@/lib/format";
import { expensePaymentStatusLabels } from "@/lib/validation/care";
import { requireCarePage } from "@/server/care/access";
import { listExpenses, listSuppliers } from "@/server/care/queries";
import type { ExpensePaymentStatus } from "@/types/database";

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

  const [expenses, suppliers] = await Promise.all([
    listExpenses(context.workspace, context.facility?.id),
    listSuppliers(context.workspace),
  ]);

  const total = expenses.reduce((sum, expense) => sum + expense.amountMinorUnits, 0);
  const unpaid = expenses
    .filter((expense) => expense.paymentStatus === "unpaid")
    .reduce((sum, expense) => sum + expense.amountMinorUnits, 0);

  return (
    <div className="space-y-6">
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
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Recorded spend</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-navy">
            {formatMoney(total, "NGN")}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-navy">
            {formatMoney(unpaid, "NGN")}
          </p>
        </Card>
      </div>

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
                  <TableCell className="text-sm font-medium text-brand-navy">
                    {expense.category}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {expense.supplierName ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-72 text-sm text-muted-foreground">
                    {expense.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-navy">
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
