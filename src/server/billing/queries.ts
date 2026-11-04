import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  SubscriptionBillingCycle,
  SubscriptionEventType,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
} from "@/types/database";

export type BillingPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceMinorUnits: number | null;
  annualPriceMinorUnits: number | null;
  currency: string;
  modules: string[];
  maxUsers: number | null;
  maxFacilities: number | null;
  storageAllowanceMb: number | null;
  trialDays: number;
  graceDays: number;
  isActive: boolean;
  sortOrder: number;
};

export type EffectiveSubscriptionStatus =
  | SubscriptionStatus
  | "legacy"
  | "cancelled_active";

export function computeEffectiveStatus(subscription: {
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string;
  grace_ends_at: string | null;
  ended_at?: string | null;
}): EffectiveSubscriptionStatus {
  const now = Date.now();
  if (subscription.status === "trialing") {
    return subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() < now
      ? "expired"
      : "trialing";
  }
  if (subscription.status === "active") {
    return new Date(subscription.current_period_end).getTime() < now
      ? "past_due"
      : "active";
  }
  if (subscription.status === "past_due" || subscription.status === "grace") {
    return subscription.grace_ends_at &&
      new Date(subscription.grace_ends_at).getTime() >= now
      ? "grace"
      : "suspended";
  }
  if (subscription.status === "cancelled") {
    if (subscription.ended_at) return "expired";
    return new Date(subscription.current_period_end).getTime() >= now
      ? "cancelled_active"
      : "expired";
  }
  return subscription.status;
}

export type BillingSummary = {
  organisationId: string;
  organisationName: string;
  plan: BillingPlan | null;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    effectiveStatus: EffectiveSubscriptionStatus;
    billingCycle: SubscriptionBillingCycle;
    startedAt: string;
    trialEndsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    graceEndsAt: string | null;
    suspendedAt: string | null;
    notes: string | null;
  } | null;
  usage: {
    activeMembers: number;
    pendingInvitations: number;
    facilities: number;
  };
  events: {
    id: string;
    eventType: SubscriptionEventType;
    fromStatus: string | null;
    toStatus: string | null;
    createdAt: string;
  }[];
  payments: {
    id: string;
    amountMinorUnits: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    status: SubscriptionPaymentStatus;
    receiptReference: string | null;
    createdAt: string;
  }[];
};

export async function getBillingSummary(
  organisationId: string,
): Promise<BillingSummary | null> {
  const supabase = await createClient();

  const [{ data: organisation }, { data: subscription }] = await Promise.all([
    supabase
      .from("organisations")
      .select("id, name")
      .eq("id", organisationId)
      .maybeSingle(),
    supabase
      .from("organisation_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("organisation_id", organisationId)
      .maybeSingle(),
  ]);

  if (!organisation) return null;

  const planRow = subscription?.subscription_plans as
    | Record<string, unknown>
    | null
    | undefined;

  const plan: BillingPlan | null = planRow
    ? {
        id: String(planRow.id),
        code: String(planRow.code),
        name: String(planRow.name),
        description: (planRow.description as string | null) ?? null,
        monthlyPriceMinorUnits:
          planRow.monthly_price_minor_units === null
            ? null
            : Number(planRow.monthly_price_minor_units),
        annualPriceMinorUnits:
          planRow.annual_price_minor_units === null
            ? null
            : Number(planRow.annual_price_minor_units),
        currency: String(planRow.currency ?? "NGN"),
        modules: (planRow.permitted_modules as string[] | null) ?? [],
        maxUsers:
          planRow.max_users === null ? null : Number(planRow.max_users),
        maxFacilities:
          planRow.max_facilities === null
            ? null
            : Number(planRow.max_facilities),
        storageAllowanceMb:
          planRow.storage_allowance_mb === null
            ? null
            : Number(planRow.storage_allowance_mb),
        trialDays: Number(planRow.trial_days ?? 14),
        graceDays: Number(planRow.grace_days ?? 7),
        isActive: Boolean(planRow.is_active),
        sortOrder: Number(planRow.sort_order ?? 0),
      }
    : null;

  const [{ data: memberships }, { data: invitations }, { data: facilities }] =
    await Promise.all([
      supabase
        .from("organisation_memberships")
        .select("status")
        .eq("organisation_id", organisationId)
        .in("status", ["active", "invited"]),
      supabase
        .from("organisation_invitations")
        .select("id")
        .eq("organisation_id", organisationId)
        .eq("status", "pending"),
      supabase
        .from("care_facilities")
        .select("id")
        .eq("organisation_id", organisationId),
    ]);

  let events: BillingSummary["events"] = [];
  let payments: BillingSummary["payments"] = [];

  if (subscription?.id) {
    const [{ data: eventRows }, { data: paymentRows }] = await Promise.all([
      supabase
        .from("subscription_events")
        .select("id, event_type, from_status, to_status, created_at")
        .eq("subscription_id", subscription.id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("subscription_payments")
        .select(
          "id, amount_minor_units, currency, period_start, period_end, status, receipt_reference, created_at",
        )
        .eq("subscription_id", subscription.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    events = (eventRows ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type as SubscriptionEventType,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      createdAt: row.created_at,
    }));

    payments = (paymentRows ?? []).map((row) => ({
      id: row.id,
      amountMinorUnits: Number(row.amount_minor_units),
      currency: row.currency,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      status: row.status as SubscriptionPaymentStatus,
      receiptReference: row.receipt_reference,
      createdAt: row.created_at,
    }));
  }

  const effectiveStatus: EffectiveSubscriptionStatus = subscription
    ? computeEffectiveStatus({
        status: subscription.status as SubscriptionStatus,
        trial_ends_at: subscription.trial_ends_at,
        current_period_end: subscription.current_period_end,
        grace_ends_at: subscription.grace_ends_at,
        ended_at: subscription.ended_at,
      })
    : "legacy";

  return {
    organisationId,
    organisationName: organisation.name,
    plan,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status as SubscriptionStatus,
          effectiveStatus,
          billingCycle: subscription.billing_cycle as SubscriptionBillingCycle,
          startedAt: subscription.started_at,
          trialEndsAt: subscription.trial_ends_at,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelledAt: subscription.cancelled_at,
          graceEndsAt: subscription.grace_ends_at,
          suspendedAt: subscription.suspended_at,
          notes: subscription.notes,
        }
      : null,
    usage: {
      activeMembers: (memberships ?? []).length,
      pendingInvitations: (invitations ?? []).length,
      facilities: (facilities ?? []).length,
    },
    events,
    payments,
  };
}

export async function listBillingPlans(
  options: { includeInactive?: boolean } = {},
): Promise<BillingPlan[]> {
  const supabase = await createClient();
  let query = supabase
    .from("subscription_plans")
    .select(
      "id, code, name, description, monthly_price_minor_units, annual_price_minor_units, currency, permitted_modules, max_users, max_facilities, storage_allowance_mb, trial_days, grace_days, is_active, sort_order",
    )
    .order("sort_order");
  if (!options.includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    monthlyPriceMinorUnits:
      row.monthly_price_minor_units === null
        ? null
        : Number(row.monthly_price_minor_units),
    annualPriceMinorUnits:
      row.annual_price_minor_units === null
        ? null
        : Number(row.annual_price_minor_units),
    currency: row.currency,
    modules: row.permitted_modules,
    maxUsers: row.max_users,
    maxFacilities: row.max_facilities,
    storageAllowanceMb: row.storage_allowance_mb,
    trialDays: row.trial_days,
    graceDays: row.grace_days,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export type PlatformSubscriptionRow = {
  organisationId: string;
  organisationName: string;
  organisationSlug: string;
  planName: string | null;
  planCode: string | null;
  status: SubscriptionStatus | "none";
  effectiveStatus: EffectiveSubscriptionStatus;
  billingCycle: SubscriptionBillingCycle | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

export async function listPlatformSubscriptions(): Promise<
  PlatformSubscriptionRow[]
> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("organisations")
    .select(
      "id, name, slug, organisation_subscriptions(*, subscription_plans(code, name))",
    )
    .order("name");

  if (error || !data) return [];

  return data.map((organisation) => {
    const subscription = Array.isArray(organisation.organisation_subscriptions)
      ? organisation.organisation_subscriptions[0]
      : organisation.organisation_subscriptions;
    const plan = subscription?.subscription_plans as
      | { code?: string; name?: string }
      | null
      | undefined;

    return {
      organisationId: organisation.id,
      organisationName: organisation.name,
      organisationSlug: organisation.slug,
      planName: plan?.name ?? null,
      planCode: plan?.code ?? null,
      status: (subscription?.status as SubscriptionStatus | undefined) ?? "none",
      effectiveStatus: subscription
        ? computeEffectiveStatus({
            status: subscription.status as SubscriptionStatus,
            trial_ends_at: subscription.trial_ends_at,
            current_period_end: subscription.current_period_end,
            grace_ends_at: subscription.grace_ends_at,
            ended_at: subscription.ended_at,
          })
        : "legacy",
      billingCycle:
        (subscription?.billing_cycle as SubscriptionBillingCycle | undefined) ??
        null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      trialEndsAt: subscription?.trial_ends_at ?? null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    };
  });
}

export type PlatformBillingSummary = {
  organisations: number;
  activeOrTrial: number;
  pastDue: number;
  suspendedOrExpired: number;
  recordedPaymentsMinorUnits: number;
  recordedPaymentsCount: number;
};

export async function getPlatformBillingSummary(): Promise<PlatformBillingSummary> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      organisations: 0,
      activeOrTrial: 0,
      pastDue: 0,
      suspendedOrExpired: 0,
      recordedPaymentsMinorUnits: 0,
      recordedPaymentsCount: 0,
    };
  }

  const [{ count: organisations }, { data: subscriptions }, { data: payments }] =
    await Promise.all([
      admin.from("organisations").select("id", { count: "exact", head: true }),
      admin
        .from("organisation_subscriptions")
        .select(
          "status, trial_ends_at, current_period_end, grace_ends_at, ended_at",
        ),
      admin
        .from("subscription_payments")
        .select("amount_minor_units, status")
        .eq("status", "recorded"),
    ]);

  let activeOrTrial = 0;
  let pastDue = 0;
  let suspendedOrExpired = 0;

  for (const row of subscriptions ?? []) {
    const effective = computeEffectiveStatus({
      status: row.status as SubscriptionStatus,
      trial_ends_at: row.trial_ends_at,
      current_period_end: row.current_period_end,
      grace_ends_at: row.grace_ends_at,
      ended_at: row.ended_at,
    });
    if (effective === "active" || effective === "trialing" || effective === "grace" || effective === "cancelled_active") {
      activeOrTrial += 1;
    } else if (effective === "past_due") {
      pastDue += 1;
    } else {
      suspendedOrExpired += 1;
    }
  }

  return {
    organisations: organisations ?? 0,
    activeOrTrial,
    pastDue,
    suspendedOrExpired,
    recordedPaymentsMinorUnits: (payments ?? []).reduce(
      (sum, row) => sum + Number(row.amount_minor_units),
      0,
    ),
    recordedPaymentsCount: (payments ?? []).length,
  };
}
