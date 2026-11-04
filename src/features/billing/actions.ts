"use server";

import { revalidatePath } from "next/cache";

import { parseMoneyToMinorUnits } from "@/lib/money";
import {
  cancelSubscriptionSchema,
  changePlanSchema,
  planSchema,
  recordSubscriptionPaymentSchema,
  resumeSubscriptionSchema,
  setSubscriptionStatusSchema,
} from "@/lib/validation/billing";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/server/audit/record-audit";
import { assertPermission, AuthorisationError } from "@/server/auth/guards";
import { requireUser } from "@/server/auth/current-user";

export type BillingActionResult =
  | { ok: true; message: string; id?: string; redirectTo?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

function invalid(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): BillingActionResult {
  return {
    ok: false,
    message: "Check the highlighted fields.",
    fieldErrors: fieldErrorsFromZod(error.issues),
  };
}

function friendlyError(error: unknown): BillingActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission for this action." };
  }
  console.error("[billing] action failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return { ok: false, message: "Something went wrong. Try again shortly." };
}

function parseOptionalMoney(value: string | undefined): number | null | undefined {
  if (!value?.trim()) return null;
  try {
    const minor = parseMoneyToMinorUnits(value);
    return minor > 0 ? minor : null;
  } catch {
    return undefined;
  }
}

function revalidateBilling(organisationId: string) {
  revalidatePath(`/dashboard/organisation/${organisationId}/billing`);
  revalidatePath("/dashboard/admin/subscriptions");
  revalidatePath("/dashboard");
}

async function assertSubscriptionManager(
  userId: string,
  organisationId: string,
): Promise<void> {
  try {
    await assertPermission(userId, "subscription_manage", organisationId);
    return;
  } catch {
    await assertPermission(userId, "billing_manage", null);
  }
}

// Organisation billing ---------------------------------------------------------

export async function changeSubscriptionPlanAction(input: {
  organisationId: string;
  planId: string;
  billingCycle: "monthly" | "annual";
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = changePlanSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertSubscriptionManager(user.id, input.organisationId);

    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("organisation_subscriptions")
      .select("id, plan_id, billing_cycle, status")
      .eq("organisation_id", input.organisationId)
      .maybeSingle();

    if (!subscription) {
      return { ok: false, message: "This organisation has no subscription to change." };
    }

    const { error } = await supabase
      .from("organisation_subscriptions")
      .update({
        plan_id: parsed.data.planId,
        billing_cycle: parsed.data.billingCycle,
      })
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: error.message };

    await supabase.from("subscription_events").insert({
      subscription_id: subscription.id,
      organisation_id: input.organisationId,
      event_type: "plan_changed",
      from_status: subscription.status,
      to_status: subscription.status,
      actor_id: user.id,
      metadata: {
        from_plan_id: subscription.plan_id,
        to_plan_id: parsed.data.planId,
        billing_cycle: parsed.data.billingCycle,
      },
    });

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "billing.subscription_plan_changed",
      entityType: "organisation_subscription",
      entityId: subscription.id,
      metadata: { planId: parsed.data.planId, billingCycle: parsed.data.billingCycle },
    });
    revalidateBilling(input.organisationId);
    return { ok: true, message: "Subscription plan updated." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function cancelSubscriptionAction(input: {
  organisationId: string;
  immediate: boolean;
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = cancelSubscriptionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertSubscriptionManager(user.id, input.organisationId);

    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("organisation_subscriptions")
      .select("id, status")
      .eq("organisation_id", input.organisationId)
      .maybeSingle();
    if (!subscription) {
      return { ok: false, message: "This organisation has no subscription." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("organisation_subscriptions")
      .update(
        parsed.data.immediate
          ? {
              status: "cancelled",
              cancel_at_period_end: false,
              cancelled_at: now,
              ended_at: now,
            }
          : {
              cancel_at_period_end: true,
              cancelled_at: now,
            },
      )
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: error.message };

    await supabase.from("subscription_events").insert({
      subscription_id: subscription.id,
      organisation_id: input.organisationId,
      event_type: "cancelled",
      from_status: subscription.status,
      to_status: parsed.data.immediate ? "cancelled" : subscription.status,
      actor_id: user.id,
      metadata: { immediate: parsed.data.immediate },
    });

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "billing.subscription_cancelled",
      entityType: "organisation_subscription",
      entityId: subscription.id,
      metadata: { immediate: parsed.data.immediate },
    });
    revalidateBilling(input.organisationId);
    return {
      ok: true,
      message: parsed.data.immediate
        ? "Subscription cancelled immediately. The workspace is now read-only."
        : "Subscription will cancel at the end of the current period.",
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function resumeSubscriptionAction(input: {
  organisationId: string;
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = resumeSubscriptionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertSubscriptionManager(user.id, input.organisationId);

    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("organisation_subscriptions")
      .select("id, status, current_period_end")
      .eq("organisation_id", input.organisationId)
      .maybeSingle();
    if (!subscription) {
      return { ok: false, message: "This organisation has no subscription." };
    }

    const periodActive =
      new Date(subscription.current_period_end).getTime() >= Date.now();
    const nextStatus =
      subscription.status === "cancelled"
        ? periodActive
          ? "active"
          : "past_due"
        : subscription.status;

    const { error } = await supabase
      .from("organisation_subscriptions")
      .update({
        status: nextStatus,
        cancel_at_period_end: false,
        cancelled_at: null,
      })
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: error.message };

    await supabase.from("subscription_events").insert({
      subscription_id: subscription.id,
      organisation_id: input.organisationId,
      event_type: "reactivated",
      from_status: subscription.status,
      to_status: nextStatus,
      actor_id: user.id,
    });

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "billing.subscription_resumed",
      entityType: "organisation_subscription",
      entityId: subscription.id,
    });
    revalidateBilling(input.organisationId);
    return { ok: true, message: "Subscription resumed." };
  } catch (error) {
    return friendlyError(error);
  }
}

// Platform billing -------------------------------------------------------------

export async function recordSubscriptionPaymentAction(input: {
  organisationId: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  providerReference?: string;
  receiptReference?: string;
  notes?: string;
  renew: boolean;
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = recordSubscriptionPaymentSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertPermission(user.id, "billing_manage", null);

    const amount = parseMoneyToMinorUnits(parsed.data.amount);
    if (amount <= 0) {
      return {
        ok: false,
        message: "Enter a valid amount.",
        fieldErrors: { amount: ["Enter a valid amount."] },
      };
    }
    if (parsed.data.periodEnd < parsed.data.periodStart) {
      return {
        ok: false,
        message: "The period end must be on or after the start.",
        fieldErrors: { periodEnd: ["The period end must be on or after the start."] },
      };
    }

    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("organisation_subscriptions")
      .select("id, status")
      .eq("organisation_id", input.organisationId)
      .maybeSingle();
    if (!subscription) {
      return { ok: false, message: "This organisation has no subscription." };
    }

    const { data: payment, error } = await supabase
      .from("subscription_payments")
      .insert({
        subscription_id: subscription.id,
        organisation_id: input.organisationId,
        amount_minor_units: amount,
        currency: parsed.data.currency.toUpperCase(),
        period_start: parsed.data.periodStart,
        period_end: parsed.data.periodEnd,
        provider_reference: parsed.data.providerReference || null,
        receipt_reference: parsed.data.receiptReference || null,
        notes: parsed.data.notes || null,
        recorded_by: user.id,
      })
      .select("id")
      .single();
    if (error || !payment) {
      return { ok: false, message: error?.message ?? "Could not record the payment." };
    }

    if (parsed.data.renew) {
      const { error: renewError } = await supabase
        .from("organisation_subscriptions")
        .update({
          status: "active",
          current_period_start: `${parsed.data.periodStart}T00:00:00.000Z`,
          current_period_end: `${parsed.data.periodEnd}T23:59:59.999Z`,
          trial_ends_at: null,
          cancel_at_period_end: false,
          cancelled_at: null,
          grace_ends_at: null,
          suspended_at: null,
          ended_at: null,
        })
        .eq("organisation_id", input.organisationId);
      if (renewError) return { ok: false, message: renewError.message };

      await supabase.from("subscription_events").insert({
        subscription_id: subscription.id,
        organisation_id: input.organisationId,
        event_type: "renewed",
        from_status: subscription.status,
        to_status: "active",
        actor_id: user.id,
        metadata: {
          payment_id: payment.id,
          period_start: parsed.data.periodStart,
          period_end: parsed.data.periodEnd,
        },
      });
    }

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "billing.payment_recorded",
      entityType: "subscription_payment",
      entityId: payment.id,
      metadata: { amount, renew: parsed.data.renew },
    });
    revalidateBilling(input.organisationId);
    return { ok: true, message: "Subscription payment recorded.", id: payment.id };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function setSubscriptionStatusAction(input: {
  organisationId: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "grace"
    | "suspended"
    | "cancelled"
    | "expired";
  notes?: string;
  graceDays?: number;
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = setSubscriptionStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertPermission(user.id, "billing_manage", null);

    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("organisation_subscriptions")
      .select("id, status")
      .eq("organisation_id", input.organisationId)
      .maybeSingle();
    if (!subscription) {
      return { ok: false, message: "This organisation has no subscription." };
    }

    const now = new Date();
    const payload: {
      status: typeof parsed.data.status;
      notes: string | null;
      grace_ends_at?: string | null;
      suspended_at?: string | null;
      ended_at?: string | null;
    } = {
      status: parsed.data.status,
      notes: parsed.data.notes || null,
    };

    if (parsed.data.status === "grace") {
      payload.grace_ends_at = new Date(
        now.getTime() + (parsed.data.graceDays ?? 7) * 24 * 60 * 60 * 1000,
      ).toISOString();
    }
    if (parsed.data.status === "suspended") {
      payload.suspended_at = now.toISOString();
    }
    if (parsed.data.status === "expired" || parsed.data.status === "cancelled") {
      payload.ended_at = now.toISOString();
    }

    const { error } = await supabase
      .from("organisation_subscriptions")
      .update(payload)
      .eq("organisation_id", input.organisationId);
    if (error) return { ok: false, message: error.message };

    await supabase.from("subscription_events").insert({
      subscription_id: subscription.id,
      organisation_id: input.organisationId,
      event_type:
        parsed.data.status === "suspended"
          ? "suspended"
          : parsed.data.status === "grace"
            ? "grace_started"
            : parsed.data.status === "expired"
              ? "expired"
              : "settings_updated",
      from_status: subscription.status,
      to_status: parsed.data.status,
      actor_id: user.id,
      metadata: { notes: parsed.data.notes || null },
    });

    await recordAudit({
      actorId: user.id,
      organisationId: input.organisationId,
      action: "billing.status_changed",
      entityType: "organisation_subscription",
      entityId: subscription.id,
      metadata: { status: parsed.data.status },
    });
    revalidateBilling(input.organisationId);
    return { ok: true, message: `Subscription marked ${parsed.data.status}.` };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function savePlanAction(input: {
  planId?: string;
  code: string;
  name: string;
  description?: string;
  monthlyPrice?: string;
  annualPrice?: string;
  currency: string;
  modules?: string;
  maxUsers?: number;
  maxFacilities?: number;
  storageAllowanceMb?: number;
  trialDays: number;
  graceDays: number;
  isActive: boolean;
  sortOrder: number;
}): Promise<BillingActionResult> {
  try {
    const user = await requireUser();
    const parsed = planSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    await assertPermission(user.id, "billing_manage", null);

    const monthly = parseOptionalMoney(parsed.data.monthlyPrice);
    const annual = parseOptionalMoney(parsed.data.annualPrice);
    if (monthly === undefined || annual === undefined) {
      return { ok: false, message: "Enter valid prices or leave them blank." };
    }

    const modules = (parsed.data.modules ?? "")
      .split(",")
      .map((module) => module.trim())
      .filter(Boolean);

    const supabase = await createClient();
    const payload = {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      monthly_price_minor_units: monthly,
      annual_price_minor_units: annual,
      currency: parsed.data.currency.toUpperCase(),
      permitted_modules: modules,
      max_users: parsed.data.maxUsers ?? null,
      max_facilities: parsed.data.maxFacilities ?? null,
      storage_allowance_mb: parsed.data.storageAllowanceMb ?? null,
      trial_days: parsed.data.trialDays,
      grace_days: parsed.data.graceDays,
      is_active: parsed.data.isActive,
      sort_order: parsed.data.sortOrder,
    };

    const { data: plan, error } = parsed.data.planId
      ? await supabase
          .from("subscription_plans")
          .update(payload)
          .eq("id", parsed.data.planId)
          .select("id")
          .single()
      : await supabase.from("subscription_plans").insert(payload).select("id").single();

    if (error || !plan) {
      return { ok: false, message: error?.message ?? "Could not save the plan." };
    }

    await recordAudit({
      actorId: user.id,
      action: "billing.plan_saved",
      entityType: "subscription_plan",
      entityId: plan.id,
      metadata: { code: parsed.data.code },
    });
    revalidatePath("/dashboard/admin/subscriptions");
    return { ok: true, message: "Subscription plan saved.", id: plan.id };
  } catch (error) {
    return friendlyError(error);
  }
}

