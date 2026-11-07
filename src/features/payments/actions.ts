"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  MoneyParseError,
  parseMoneyToMinorUnits,
} from "@/lib/money";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/server/audit/record-audit";
import { assertPermission, AuthorisationError } from "@/server/auth/guards";
import { getCurrentUser, requireUser } from "@/server/auth/current-user";
import {
  createCourseCheckout,
  verifyPaymentByReference,
} from "@/server/payments/service";
import { refundPaymentSchema } from "@/lib/validation/payments";
import {
  paymentGatewaySettingsSchema,
  type PaymentGatewaySettingsInput,
} from "@/lib/validation/payments";

export type PaymentActionResult =
  | { ok: true; message: string; redirectTo?: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      redirectTo?: string;
    };

function friendlyError(error: unknown): PaymentActionResult {
  if (error instanceof AuthorisationError) {
    return { ok: false, message: "You do not have permission for this action." };
  }
  console.error("[payments] action failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  return { ok: false, message: "Something went wrong. Try again shortly." };
}

export async function startCoursePaymentAction(
  courseId: string,
): Promise<PaymentActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        ok: false,
        message: "Sign in to buy this course.",
        redirectTo: "/login?redirectTo=/courses",
      };
    }
    const result = await createCourseCheckout(user, courseId);

    if (!result.ok) {
      if (result.redirectTo) redirect(result.redirectTo);
      return { ok: false, message: result.message };
    }

    await recordAudit({
      actorId: user.id,
      action: "payment.checkout_started",
      entityType: "payment_transaction",
      entityId: result.reference,
      metadata: { courseId, reference: result.reference },
    });

    redirect(result.authorizationUrl);
  } catch (error) {
    // Next.js redirects throw a special error that must be re-thrown.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return friendlyError(error);
  }
}

export async function verifyPaymentAction(
  reference: string,
): Promise<PaymentActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "payment_review");

    const result = await verifyPaymentByReference(reference);

    if (result.status === "successful") {
      await recordAudit({
        actorId: user.id,
        action: "payment.verified",
        entityType: "payment_transaction",
        entityId: result.transactionId ?? reference,
        metadata: { reference },
      });
    } else if (result.status === "failed") {
      await recordAudit({
        actorId: user.id,
        action: "payment.failed",
        entityType: "payment_transaction",
        entityId: reference,
        metadata: { reference },
      });
    }

    revalidatePath("/dashboard/admin/payments");
    revalidatePath("/dashboard/admin/reconciliation");
    revalidatePath("/dashboard/academy/learning");

    return {
      ok: result.status === "successful",
      message: result.message,
    };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function savePaymentGatewaySettingsAction(
  input: PaymentGatewaySettingsInput,
): Promise<PaymentActionResult> {
  const parsed = paymentGatewaySettingsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const user = await requireUser();
    if (!user.isSuperAdmin) {
      return {
        ok: false,
        message: "Only a platform super administrator can update payment keys.",
      };
    }

    const admin = createAdminClient();
    if (!admin) {
      return {
        ok: false,
        message: "Payment settings require the service-role client.",
      };
    }

    const payload: Record<string, unknown> = {
      id: true,
      provider: "paystack",
      mode: parsed.data.mode,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const updated: string[] = ["mode"];
    if (parsed.data.publicKey) {
      payload.public_key = parsed.data.publicKey;
      updated.push("public_key");
    }
    if (parsed.data.secretKey) {
      payload.secret_key = parsed.data.secretKey;
      updated.push("secret_key");
    }
    if (parsed.data.webhookSecret) {
      payload.webhook_secret = parsed.data.webhookSecret;
      updated.push("webhook_secret");
    }

    const { error } = await admin
      .from("payment_gateway_settings")
      .upsert(payload as never, { onConflict: "id" });

    if (error) {
      return { ok: false, message: "We could not save the payment settings." };
    }

    await recordAudit({
      actorId: user.id,
      action: "payment.gateway_settings_updated",
      entityType: "payment_gateway_settings",
      entityId: "paystack",
      metadata: { mode: parsed.data.mode, updated },
    });

    revalidatePath("/dashboard/admin/payments/gateway");
    revalidatePath("/dashboard/admin/settings");
    revalidatePath("/dashboard/admin/system");
    return { ok: true, message: "Paystack settings saved." };
  } catch (error) {
    return friendlyError(error);
  }
}

export async function testPaymentGatewayAction(): Promise<{
  ok: boolean;
  message: string;
}> {  try {
    const user = await requireUser();
    if (!user.isSuperAdmin) {
      return {
        ok: false,
        message: "Only a platform super administrator can test the payment gateway.",
      };
    }

    const provider = await getPaymentProvider();
    if (!provider.configured) {
      return {
        ok: false,
        message:
          "Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment.",
      };
    }

    return await provider.testConnection();
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "The payment gateway test failed.",
    };
  }
}

export async function refundPaymentAction(input: {
  reference: string;
  amount: string;
  reason: string;
}): Promise<PaymentActionResult> {
  try {
    const user = await requireUser();
    await assertPermission(user.id, "refund_process");

    const parsed = refundPaymentSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
      return {
        ok: false,
        message: "Check the refund details.",
        fieldErrors,
      };
    }

    let amountMinorUnits: number;
    try {
      amountMinorUnits = parseMoneyToMinorUnits(parsed.data.amount);
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof MoneyParseError
            ? error.message
            : "Enter a valid refund amount.",
        fieldErrors: { amount: ["Enter a valid refund amount."] },
      };
    }

    if (amountMinorUnits <= 0) {
      return { ok: false, message: "Enter a refund amount above zero." };
    }

    const admin = createAdminClient();
    if (!admin) {
      return { ok: false, message: "Refund processing is unavailable." };
    }

    const { data: transaction } = await admin
      .from("payment_transactions")
      .select(
        "id, reference, status, amount_minor_units, refunded_amount_minor_units, currency, provider_reference, organisation_id",
      )
      .eq("reference", input.reference)
      .maybeSingle();

    if (!transaction) {
      return { ok: false, message: "Payment not found." };
    }

    if (!["successful", "partially_refunded"].includes(transaction.status)) {
      return { ok: false, message: "Only successful payments can be refunded." };
    }

    const remaining =
      Number(transaction.amount_minor_units) -
      Number(transaction.refunded_amount_minor_units);
    if (amountMinorUnits > remaining) {
      return {
        ok: false,
        message: "The refund is larger than the remaining refundable amount.",
      };
    }

    const provider = await getPaymentProvider(transaction.organisation_id);
    if (!provider.configured) {
      return { ok: false, message: "Payments are not configured for this organisation." };
    }
    if (!transaction.provider_reference) {
      return {
        ok: false,
        message: "This payment has no provider reference and cannot be refunded online.",
      };
    }

    const { data: refund, error: refundInsertError } = await admin
      .from("payment_refunds")
      .insert({
        transaction_id: transaction.id,
        amount_minor_units: amountMinorUnits,
        reason: parsed.data.reason,
        status: "requested",
        initiated_by: user.id,
      })
      .select("id")
      .single();

    if (refundInsertError || !refund) {
      return { ok: false, message: "Could not record the refund request." };
    }

    try {
      const result = await provider.refund({
        providerReference: transaction.provider_reference,
        amountMinorUnits,
      });

      if (result.status === "successful") {
        const { error } = await admin.rpc("apply_payment_refund", {
          p_reference: transaction.reference,
          p_amount_minor_units: amountMinorUnits,
          p_provider_reference: result.providerReference,
        });
        if (error) throw new Error(error.message);

        await admin
          .from("payment_refunds")
          .update({
            status: "succeeded",
            provider_reference: result.providerReference,
            provider_payload: result.raw as never,
            processed_at: new Date().toISOString(),
          })
          .eq("id", refund.id);
      } else {
        await admin
          .from("payment_refunds")
          .update({
            status: result.status === "failed" ? "failed" : "processing",
            provider_reference: result.providerReference,
            provider_payload: result.raw as never,
          })
          .eq("id", refund.id);
      }

      await recordAudit({
        actorId: user.id,
        action: "payment.refunded",
        entityType: "payment_transaction",
        entityId: transaction.id,
        metadata: {
          reference: transaction.reference,
          amountMinorUnits,
          providerReference: result.providerReference,
          providerStatus: result.status,
        },
      });

      revalidatePath("/dashboard/admin/payments");
      revalidatePath("/dashboard/admin/reconciliation");

      return {
        ok: true,
        message:
          result.status === "successful"
            ? "Refund processed and recorded."
            : "Refund submitted to the provider. It will be confirmed by webhook.",
      };
    } catch (error) {
      await admin
        .from("payment_refunds")
        .update({
          status: "failed",
          provider_payload: {
            error: error instanceof Error ? error.message : "unknown",
          } as never,
        })
        .eq("id", refund.id);

      return {
        ok: false,
        message:
          error instanceof Error
            ? `The refund could not be completed: ${error.message}`
            : "The refund could not be completed.",
      };
    }
  } catch (error) {
    return friendlyError(error);
  }
}
