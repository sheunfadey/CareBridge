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
import {
  PlanDialogForm,
  RecordSubscriptionPaymentDialogForm,
  SetSubscriptionStatusDialogForm,
} from "@/features/billing/components/billing-forms";
import { formatDate, formatMoney } from "@/lib/format";
import {
  subscriptionBillingCycleLabels,
  subscriptionModuleLabels,
  subscriptionStatusLabels,
  type SubscriptionModule,
} from "@/lib/validation/billing";
import { requirePermissionPage } from "@/server/auth/require-permission";
import {
  getPlatformBillingSummary,
  listBillingPlans,
  listPlatformSubscriptions,
} from "@/server/billing/queries";

export const metadata: Metadata = {
  title: "Subscriptions",
};

function defaultPaymentPeriod(): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function AdminSubscriptionsPage() {
  await requirePermissionPage("/dashboard/admin/subscriptions", "billing_manage");

  const [summary, subscriptions, plans] = await Promise.all([
    getPlatformBillingSummary(),
    listPlatformSubscriptions(),
    listBillingPlans({ includeInactive: true }),
  ]);

  const period = defaultPaymentPeriod();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform billing"
        title="Subscriptions"
        description="Configure plans, manage organisation subscriptions and record subscription payments. Subscription billing is separate from training, donations and payouts."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/dashboard/admin" },
          { label: "Subscriptions" },
        ]}
        actions={<PlanDialogForm />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Organisations</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {summary.organisations}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Active / trial / grace</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {summary.activeOrTrial}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Past due</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {summary.pastDue}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Recorded subscription payments</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-strong">
            {formatMoney(summary.recordedPaymentsMinorUnits, "NGN")}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.recordedPaymentsCount} payment
            {summary.recordedPaymentsCount === 1 ? "" : "s"}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Plans
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Prices are configuration only. Leave them blank to show “Contact us”.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <p className="font-medium text-brand-strong">{plan.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{plan.code}</p>
                </TableCell>
                <TableCell className="max-w-80 text-xs text-muted-foreground">
                  {plan.modules.length === 0
                    ? "All modules"
                    : plan.modules
                        .map(
                          (module) =>
                            subscriptionModuleLabels[module as SubscriptionModule] ??
                            module,
                        )
                        .join(", ")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {plan.maxUsers === null ? "Unlimited users" : `${plan.maxUsers} users`}
                  <br />
                  {plan.maxFacilities === null
                    ? "Unlimited facilities"
                    : `${plan.maxFacilities} facilities`}
                </TableCell>
                <TableCell className="text-sm text-brand-strong">
                  {plan.monthlyPriceMinorUnits === null
                    ? "Contact us"
                    : `${formatMoney(plan.monthlyPriceMinorUnits, plan.currency)}/mo`}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={plan.isActive ? "active" : "inactive"}
                    label={plan.isActive ? "Active" : "Inactive"}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <PlanDialogForm plan={plan} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Organisation subscriptions
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Period ends</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((row) => (
              <TableRow key={row.organisationId}>
                <TableCell>
                  <p className="font-medium text-brand-strong">{row.organisationName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.organisationSlug}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.planName ?? "No plan"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={row.effectiveStatus.replaceAll("_", "-")}
                    label={
                      subscriptionStatusLabels[
                        row.effectiveStatus as keyof typeof subscriptionStatusLabels
                      ] ?? row.effectiveStatus.replaceAll("_", " ")
                    }
                  />
                  {row.cancelAtPeriodEnd ? (
                    <p className="mt-1 text-xs text-brand-warning">
                      Cancels at period end
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.billingCycle
                    ? subscriptionBillingCycleLabels[row.billingCycle]
                    : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <RecordSubscriptionPaymentDialogForm
                      organisationId={row.organisationId}
                      currency="NGN"
                      periodStart={period.start}
                      periodEnd={period.end}
                    />
                    <SetSubscriptionStatusDialogForm
                      organisationId={row.organisationId}
                      currentStatus={row.status === "none" ? "trialing" : row.status}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
