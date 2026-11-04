"use client";

import {
  CareActionButton,
  CareDialogForm,
  type CareField,
} from "@/features/care/components/care-form";
import {
  cancelSubscriptionAction,
  changeSubscriptionPlanAction,
  recordSubscriptionPaymentAction,
  resumeSubscriptionAction,
  savePlanAction,
  setSubscriptionStatusAction,
} from "@/features/billing/actions";
import type { BillingActionResult } from "@/features/billing/actions";
import {
  SUBSCRIPTION_BILLING_CYCLES,
  SUBSCRIPTION_MODULES,
  SUBSCRIPTION_STATUSES,
  subscriptionBillingCycleLabels,
  subscriptionModuleLabels,
  subscriptionStatusLabels,
} from "@/lib/validation/billing";
import type { BillingPlan } from "@/server/billing/queries";

type Values = Record<string, unknown>;
type InputOf<T> = T extends (input: infer I) => Promise<BillingActionResult> ? I : never;

function cast<T>(values: Values, extra: Values): InputOf<T> {
  return { ...extra, ...values } as unknown as InputOf<T>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ChangePlanDialogForm({
  organisationId,
  plans,
  currentPlanId,
  currentCycle,
}: {
  organisationId: string;
  plans: BillingPlan[];
  currentPlanId: string | null;
  currentCycle: "monthly" | "annual";
}) {
  const fields: CareField[] = [
    {
      name: "planId",
      label: "Plan",
      type: "select",
      required: true,
      defaultValue: currentPlanId ?? plans[0]?.id,
      options: plans.map((plan) => ({
        value: plan.id,
        label: `${plan.name} · ${plan.modules.length === 0 ? "all modules" : plan.modules.join(", ")}`,
      })),
    },
    {
      name: "billingCycle",
      label: "Billing cycle",
      type: "select",
      required: true,
      defaultValue: currentCycle,
      options: SUBSCRIPTION_BILLING_CYCLES.map((cycle) => ({
        value: cycle,
        label: subscriptionBillingCycleLabels[cycle],
      })),
    },
  ];
  return (
    <CareDialogForm
      trigger="Change plan"
      triggerVariant="outline"
      title="Change subscription plan"
      description="Changing plan updates module access and limits immediately. Billing amounts are configured by the platform team."
      submitLabel="Save plan"
      fields={fields}
      action={(values) =>
        changeSubscriptionPlanAction(
          cast<typeof changeSubscriptionPlanAction>(values, { organisationId }),
        )
      }
    />
  );
}

export function CancelSubscriptionButton({
  organisationId,
  immediate,
  label,
}: {
  organisationId: string;
  immediate: boolean;
  label: string;
}) {
  return (
    <CareActionButton
      label={label}
      variant="ghost"
      confirm={
        immediate
          ? "Cancel immediately? The workspace will become read-only, but existing records remain readable and exportable."
          : "Cancel at the end of the current period?"
      }
      extra={{ organisationId, immediate }}
      action={(values) => cancelSubscriptionAction(cast<typeof cancelSubscriptionAction>(values, {}))}
    />
  );
}

export function ResumeSubscriptionButton({ organisationId }: { organisationId: string }) {
  return (
    <CareActionButton
      label="Resume subscription"
      extra={{ organisationId }}
      action={(values) => resumeSubscriptionAction(cast<typeof resumeSubscriptionAction>(values, {}))}
    />
  );
}

export function RecordSubscriptionPaymentDialogForm({
  organisationId,
  currency,
  periodStart,
  periodEnd,
}: {
  organisationId: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
}) {
  const fields: CareField[] = [
    { name: "amount", label: `Amount (${currency})`, required: true, placeholder: "0.00" },
    { name: "currency", label: "Currency", required: true, defaultValue: currency },
    { name: "periodStart", label: "Period start", type: "date", required: true, defaultValue: periodStart || today() },
    { name: "periodEnd", label: "Period end", type: "date", required: true, defaultValue: periodEnd },
    { name: "providerReference", label: "Provider reference" },
    { name: "receiptReference", label: "Receipt reference" },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "renew", label: "Renew the subscription period", type: "checkbox", defaultValue: true },
  ];
  return (
    <CareDialogForm
      trigger="Record payment"
      title="Record a subscription payment"
      description="Subscription payments are separate from training purchases, donations and payouts."
      submitLabel="Record payment"
      fields={fields}
      action={(values) =>
        recordSubscriptionPaymentAction(
          cast<typeof recordSubscriptionPaymentAction>(values, { organisationId }),
        )
      }
    />
  );
}

export function SetSubscriptionStatusDialogForm({
  organisationId,
  currentStatus,
}: {
  organisationId: string;
  currentStatus: string;
}) {
  const fields: CareField[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      defaultValue: currentStatus,
      options: SUBSCRIPTION_STATUSES.map((status) => ({
        value: status,
        label: subscriptionStatusLabels[status],
      })),
    },
    { name: "graceDays", label: "Grace days (if marking grace)", type: "number", min: 0, defaultValue: 7 },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  return (
    <CareDialogForm
      trigger="Set status"
      triggerVariant="outline"
      title="Set subscription status"
      description="Suspended or expired subscriptions keep records readable and exportable but block writes."
      submitLabel="Save status"
      fields={fields}
      action={(values) =>
        setSubscriptionStatusAction(
          cast<typeof setSubscriptionStatusAction>(values, { organisationId }),
        )
      }
    />
  );
}

export function PlanDialogForm({ plan }: { plan?: BillingPlan }) {
  const fields: CareField[] = [
    { name: "code", label: "Plan code", required: true, defaultValue: plan?.code },
    { name: "name", label: "Plan name", required: true, defaultValue: plan?.name },
    { name: "monthlyPrice", label: "Monthly price", defaultValue: plan?.monthlyPriceMinorUnits ? String(plan.monthlyPriceMinorUnits / 100) : "" },
    { name: "annualPrice", label: "Annual price", defaultValue: plan?.annualPriceMinorUnits ? String(plan.annualPriceMinorUnits / 100) : "" },
    { name: "currency", label: "Currency", required: true, defaultValue: plan?.currency ?? "NGN" },
    {
      name: "modules",
      label: "Modules",
      defaultValue: plan?.modules.join(", ") ?? "",
      help: `Comma separated: ${SUBSCRIPTION_MODULES.map((module) => subscriptionModuleLabels[module]).join(", ")}. Use codes: ${SUBSCRIPTION_MODULES.join(", ")}.`,
    },
    { name: "maxUsers", label: "Max users", type: "number", min: 1, defaultValue: plan?.maxUsers ?? "" },
    { name: "maxFacilities", label: "Max facilities", type: "number", min: 1, defaultValue: plan?.maxFacilities ?? "" },
    { name: "storageAllowanceMb", label: "Storage allowance (MB)", type: "number", min: 1, defaultValue: plan?.storageAllowanceMb ?? "" },
    { name: "trialDays", label: "Trial days", type: "number", min: 0, defaultValue: plan?.trialDays ?? 14 },
    { name: "graceDays", label: "Grace days", type: "number", min: 0, defaultValue: plan?.graceDays ?? 7 },
    { name: "sortOrder", label: "Sort order", type: "number", min: 0, defaultValue: plan?.sortOrder ?? 0 },
    { name: "isActive", label: "Active", type: "checkbox", defaultValue: plan?.isActive ?? true },
  ];
  return (
    <CareDialogForm
      trigger={plan ? "Edit plan" : "New plan"}
      triggerVariant={plan ? "outline" : "default"}
      title={plan ? "Edit subscription plan" : "Create a subscription plan"}
      description="Plans configure modules, user limits, facility limits, storage and trial/grace periods."
      submitLabel="Save plan"
      fields={fields}
      action={(values) =>
        savePlanAction(cast<typeof savePlanAction>(values, { planId: plan?.id }))
      }
    />
  );
}
