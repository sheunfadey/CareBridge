import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CancelSubscriptionButton,
  ChangePlanDialogForm,
  ResumeSubscriptionButton,
} from "@/features/billing/components/billing-forms";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  SUBSCRIPTION_MODULES,
  subscriptionBillingCycleLabels,
  subscriptionEventLabels,
  subscriptionModuleLabels,
  subscriptionStatusLabels,
  type SubscriptionModule,
} from "@/lib/validation/billing";
import { getCurrentUser } from "@/server/auth/current-user";
import { getBillingSummary, listBillingPlans } from "@/server/billing/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function OrganisationBillingPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/dashboard/organisation/${organisationId}/billing`)}`);
  }

  const supabase = await createClient();
  const { data: canView } = await supabase.rpc("has_permission", {
    p_permission: "subscription_view",
    p_organisation: organisationId,
  });
  if (!user.isSuperAdmin && !canView) {
    redirect(`/dashboard/organisation/${organisationId}`);
  }

  const { data: canManage } = await supabase.rpc("has_permission", {
    p_permission: "subscription_manage",
    p_organisation: organisationId,
  });

  const [summary, plans] = await Promise.all([
    getBillingSummary(organisationId),
    listBillingPlans(),
  ]);
  if (!summary) notFound();

  const subscription = summary.subscription;
  const plan = summary.plan;
  const readOnly =
    subscription !== null &&
    !["active", "trialing", "grace", "cancelled_active", "legacy"].includes(
      subscription.effectiveStatus,
    );
  const memberLimit = plan?.maxUsers ?? null;
  const facilityLimit = plan?.maxFacilities ?? null;
  const membersUsed = summary.usage.activeMembers + summary.usage.pendingInvitations;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organisation billing"
        title={summary.organisationName}
        description="Subscription plan, feature limits and billing history. Subscription billing is separate from training, donations and payouts."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Organisation", href: `/dashboard/organisation/${organisationId}` },
          { label: "Billing" },
        ]}
        actions={
          canManage ? (
            <>
              <ChangePlanDialogForm
                organisationId={organisationId}
                plans={plans}
                currentPlanId={plan?.id ?? null}
                currentCycle={subscription?.billingCycle ?? "monthly"}
              />
              {subscription?.cancelAtPeriodEnd ? (
                <ResumeSubscriptionButton organisationId={organisationId} />
              ) : (
                <>
                  <CancelSubscriptionButton
                    organisationId={organisationId}
                    immediate={false}
                    label="Cancel at period end"
                  />
                  <CancelSubscriptionButton
                    organisationId={organisationId}
                    immediate
                    label="Cancel immediately"
                  />
                </>
              )}
            </>
          ) : null
        }
      />

      {readOnly ? (
        <Card className="border-brand-warning/40 bg-brand-warning/5 p-5">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            This workspace is read-only
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The subscription is {subscription ? subscriptionStatusLabels[subscription.effectiveStatus as keyof typeof subscriptionStatusLabels] ?? subscription.effectiveStatus : "inactive"}.
            Existing resident, care and financial records remain readable and
            exportable. New records and changes are blocked until the
            subscription is renewed.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current plan
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-brand-strong">
                {plan?.name ?? "Legacy access"}
              </h2>
            </div>
            {subscription ? (
              <StatusBadge
                status={subscription.effectiveStatus.replaceAll("_", "-")}
                label={
                  subscriptionStatusLabels[
                    subscription.effectiveStatus as keyof typeof subscriptionStatusLabels
                  ] ?? subscription.effectiveStatus.replaceAll("_", " ")
                }
              />
            ) : (
              <StatusBadge status="legacy" label="Legacy" />
            )}
          </div>

          {plan ? (
            <>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Billing cycle</dt>
                  <dd className="font-medium text-brand-strong">
                    {subscription
                      ? subscriptionBillingCycleLabels[subscription.billingCycle]
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Monthly price</dt>
                  <dd className="font-medium text-brand-strong">
                    {plan.monthlyPriceMinorUnits === null
                      ? "Contact us"
                      : formatMoney(plan.monthlyPriceMinorUnits, plan.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Current period ends</dt>
                  <dd className="font-medium text-brand-strong">
                    {subscription ? formatDate(subscription.currentPeriodEnd) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Trial ends</dt>
                  <dd className="font-medium text-brand-strong">
                    {subscription?.trialEndsAt ? formatDate(subscription.trialEndsAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Grace ends</dt>
                  <dd className="font-medium text-brand-strong">
                    {subscription?.graceEndsAt ? formatDate(subscription.graceEndsAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cancellation</dt>
                  <dd className="font-medium text-brand-strong">
                    {subscription?.cancelAtPeriodEnd
                      ? "Cancels at period end"
                      : subscription?.cancelledAt
                        ? "Cancelled"
                        : "None"}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Included modules
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(plan.modules.length > 0 ? plan.modules : SUBSCRIPTION_MODULES).map(
                    (module) => (
                      <StatusBadge
                        key={module}
                        status="included"
                        label={
                          subscriptionModuleLabels[module as SubscriptionModule] ??
                          module
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This workspace predates subscription billing and keeps its current
              access. Choose a plan to configure limits and modules.
            </p>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Usage and limits
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="tabular-nums text-brand-strong">
                  {membersUsed}
                  {memberLimit !== null ? ` / ${memberLimit}` : " / unlimited"}
                </span>
              </div>
              {memberLimit !== null ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-teal"
                    style={{ width: `${Math.min((membersUsed / memberLimit) * 100, 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Facilities</span>
                <span className="tabular-nums text-brand-strong">
                  {summary.usage.facilities}
                  {facilityLimit !== null ? ` / ${facilityLimit}` : " / unlimited"}
                </span>
              </div>
              {facilityLimit !== null ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-teal"
                    style={{
                      width: `${Math.min((summary.usage.facilities / facilityLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Storage allowance</span>
              <span className="tabular-nums text-brand-strong">
                {plan?.storageAllowanceMb
                  ? `${plan.storageAllowanceMb.toLocaleString("en-NG")} MB`
                  : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Limits are enforced by the database, not only by the interface.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border p-5">
            <h2 className="font-heading text-lg font-semibold text-brand-strong">
              Billing history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments recorded by the platform billing team.
            </p>
          </div>
          {summary.payments.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No subscription payments recorded.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {summary.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium tabular-nums text-brand-strong">
                      {formatMoney(payment.amountMinorUnits, payment.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                      {payment.receiptReference ? ` · ${payment.receiptReference}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    status={payment.status}
                    label={payment.status === "recorded" ? "Recorded" : "Void"}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Subscription events
          </h2>
          {summary.events.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {summary.events.map((event) => (
                <li key={event.id} className="py-2.5 text-sm">
                  <p className="font-medium text-brand-strong">
                    {subscriptionEventLabels[event.eventType]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                    {event.fromStatus || event.toStatus
                      ? ` · ${event.fromStatus ?? "—"} → ${event.toStatus ?? "—"}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Button asChild variant="ghost">
        <Link href={`/dashboard/organisation/${organisationId}`}>
          Back to organisation
        </Link>
      </Button>
    </div>
  );
}
