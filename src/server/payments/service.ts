import "server-only";

import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments/provider";
import { PaymentProviderError } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";
import type { Json } from "@/types/database";

export const REFERRAL_COOKIE = "carebridge_referral";

export type CheckoutResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; message: string; redirectTo?: string };

export type VerifyPaymentResult = {
  status: "successful" | "failed" | "pending" | "mismatch" | "unknown";
  transactionId?: string;
  message: string;
  reference: string;
};

function toJson(value: unknown): Json {
  return (value ?? {}) as Json;
}

/**
 * Creates (or reuses) a pending Paystack checkout for a paid course. The
 * browser never decides the amount: it comes from the course row, and the
 * provider verification later checks it again.
 */
export async function createCourseCheckout(
  user: CurrentUser,
  courseId: string,
): Promise<CheckoutResult> {
  const provider = getPaymentProvider();
  if (!provider.configured) {
    return {
      ok: false,
      message:
        "Online payments are not configured on this deployment yet. Please contact support.",
    };
  }

  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      "id, title, slug, price_minor_units, currency, status, is_public, organisation_id",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    return { ok: false, message: "This course could not be found." };
  }

  if (course.status !== "published" || !course.is_public) {
    return { ok: false, message: "This course is not open for enrolment." };
  }

  if (course.price_minor_units <= 0) {
    return {
      ok: false,
      message: "This course is free. Use the enrol button instead.",
    };
  }

  const { data: existingEnrolment } = await supabase
    .from("course_enrolments")
    .select("id")
    .eq("course_id", course.id)
    .eq("user_id", user.id)
    .neq("status", "withdrawn")
    .maybeSingle();

  if (existingEnrolment) {
    return {
      ok: false,
      message: "You are already enrolled in this course.",
      redirectTo: `/dashboard/academy/learning/${course.id}`,
    };
  }

  // Attribute the customer to an approved referral partner when they arrived
  // through a referral link. Failures are non-fatal: the purchase must proceed.
  const cookieStore = await cookies();
  const referralCode = cookieStore.get(REFERRAL_COOKIE)?.value;
  if (referralCode) {
    const { error: attributionError } = await supabase.rpc(
      "attribute_referral",
      { p_code: referralCode },
    );
    if (attributionError) {
      console.info("[payments] referral attribution skipped", {
        reason: attributionError.message,
      });
    }
  }

  const { data: attribution } = await supabase
    .from("referral_attributions")
    .select("id")
    .eq("customer_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // Reuse a recent pending checkout instead of creating duplicate transactions.
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from("payment_transactions")
    .select("id, reference, checkout_url, created_at")
    .eq("payer_id", user.id)
    .eq("purpose", "course_purchase")
    .eq("product_id", course.id)
    .in("status", ["initiated", "pending"])
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pending?.checkout_url) {
    return {
      ok: true,
      authorizationUrl: pending.checkout_url,
      reference: pending.reference,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Payment processing is unavailable on this server.",
    };
  }

  const reference = `cb_${crypto.randomUUID().replaceAll("-", "")}`;
  const env = getPublicEnv();

  const { data: transaction, error: insertError } = await admin
    .from("payment_transactions")
    .insert({
      reference,
      organisation_id: course.organisation_id,
      payer_id: user.id,
      payer_email: user.email,
      purpose: "course_purchase",
      product_type: "course",
      product_id: course.id,
      description: `Course purchase: ${course.title}`,
      amount_minor_units: course.price_minor_units,
      currency: course.currency,
      provider: "paystack",
      provider_mode: provider.mode,
      status: "initiated",
      referral_attribution_id: attribution?.id ?? null,
      idempotency_key: `course:${course.id}:${user.id}:${reference}`,
      metadata: {
        course_slug: course.slug,
        course_title: course.title,
      },
    })
    .select("id, reference")
    .single();

  if (insertError || !transaction) {
    console.error("[payments] could not create transaction", {
      message: insertError?.message,
    });
    return {
      ok: false,
      message: "We could not start the payment. Try again shortly.",
    };
  }

  try {
    const initialized = await provider.initializeTransaction({
      email: user.email,
      amountMinorUnits: course.price_minor_units,
      currency: course.currency,
      reference,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      metadata: {
        transaction_id: transaction.id,
        course_id: course.id,
        payer_id: user.id,
      },
    });

    const { error: updateError } = await admin
      .from("payment_transactions")
      .update({
        status: "pending",
        provider_reference: initialized.providerReference,
        checkout_url: initialized.authorizationUrl,
        access_code: initialized.accessCode,
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("[payments] could not store checkout details", {
        message: updateError.message,
      });
      return {
        ok: false,
        message: "We could not start the payment. Try again shortly.",
      };
    }

    return {
      ok: true,
      authorizationUrl: initialized.authorizationUrl,
      reference,
    };
  } catch (error) {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        metadata: {
          failure_reason:
            error instanceof Error ? error.message : "Provider initialisation failed",
        },
      })
      .eq("id", transaction.id);

    console.error("[payments] provider initialisation failed", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return {
      ok: false,
      message:
        "The payment provider could not start this transaction. Nothing has been charged.",
    };
  }
}

/**
 * Server-side verification. Never trust the browser redirect: the provider is
 * asked directly, and the database applies the result idempotently.
 */
export async function verifyPaymentByReference(
  reference: string,
): Promise<VerifyPaymentResult> {
  const provider = getPaymentProvider();
  if (!provider.configured) {
    return {
      status: "unknown",
      reference,
      message: "Payments are not configured on this deployment.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      status: "unknown",
      reference,
      message: "Payment verification is unavailable on this server.",
    };
  }

  try {
    const verified = await provider.verifyTransaction(reference);

    if (verified.state === "successful") {
      const { data, error } = await admin.rpc("apply_payment_success", {
        p_reference: reference,
        p_provider_reference: verified.providerReference,
        p_amount_minor_units: verified.amountMinorUnits,
        p_currency: verified.currency,
        p_provider_payload: toJson(verified.raw),
      });

      if (error) {
        console.error("[payments] apply success failed", {
          reference,
          message: error.message,
        });
        return {
          status: "unknown",
          reference,
          message: "The payment could not be recorded. Support has been notified.",
        };
      }

      const result = data as {
        status?: string;
        transactionId?: string;
      } | null;

      if (result?.status === "mismatch") {
        return {
          status: "mismatch",
          transactionId: result.transactionId,
          reference,
          message:
            "The provider confirmed a different amount than expected. This payment is flagged for review.",
        };
      }

      return {
        status: "successful",
        transactionId: result?.transactionId,
        reference,
        message: "Payment confirmed.",
      };
    }

    if (verified.state === "failed" || verified.state === "abandoned") {
      await admin.rpc("apply_payment_failure", {
        p_reference: reference,
        p_status: verified.state === "abandoned" ? "cancelled" : "failed",
        p_reason: "Provider verification reported a non-successful transaction",
      });

      return {
        status: "failed",
        reference,
        message:
          verified.state === "abandoned"
            ? "The payment was cancelled."
            : "The payment was not successful.",
      };
    }

    return {
      status: "pending",
      reference,
      message: "The payment is still awaiting confirmation.",
    };
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      return { status: "unknown", reference, message: error.message };
    }
    console.error("[payments] verification error", {
      reference,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      status: "unknown",
      reference,
      message: "We could not verify the payment right now.",
    };
  }
}

export type WebhookResult = { status: number; message: string };

type PaystackWebhookPayload = {
  event?: unknown;
  data?: Record<string, unknown>;
};

function webhookEventId(
  event: string,
  data: Record<string, unknown>,
): string {
  const identifier =
    data.id ??
    data.reference ??
    data.transfer_code ??
    data.transaction_reference ??
    "unknown";
  const state = data.status ?? "";
  return `${event}:${String(identifier)}:${String(state)}`;
}

/**
 * Signature-verified, idempotent webhook processing. A duplicate delivery is a
 * no-op; a failed attempt is retried because Paystack retries non-2xx responses.
 */
export async function processPaymentWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  const provider = getPaymentProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return { status: 401, message: "Invalid signature" };
  }

  let payload: PaystackWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    return { status: 400, message: "Invalid payload" };
  }

  const event = typeof payload.event === "string" ? payload.event : "";
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;

  if (!event || !data) {
    return { status: 400, message: "Missing event data" };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { status: 503, message: "Server not configured" };
  }

  const eventId = webhookEventId(event, data);

  const { data: existing } = await admin
    .from("payment_webhook_events")
    .select("id, processing_status, attempts")
    .eq("provider", "paystack")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (existing?.processing_status === "processed") {
    return { status: 200, message: "Already processed" };
  }

  if (existing?.processing_status === "ignored") {
    return { status: 200, message: "Already ignored" };
  }

  let recordId = existing?.id;
  if (recordId) {
    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: "received",
        attempts: (existing?.attempts ?? 1) + 1,
        error_message: null,
      })
      .eq("id", recordId);
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("payment_webhook_events")
      .insert({
        provider: "paystack",
        event_type: event,
        provider_event_id: eventId,
        payload: toJson(data),
        signature_valid: true,
        processing_status: "received",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[payments] webhook event insert failed", {
        message: insertError?.message,
      });
      return { status: 500, message: "Could not record event" };
    }
    recordId = inserted.id;
  }

  try {
    let outcome: "processed" | "ignored" = "ignored";

    if (event === "charge.success") {
      const reference =
        typeof data.reference === "string" ? data.reference : "";
      if (!reference) throw new Error("charge.success without reference");

      const verified = await provider.verifyTransaction(reference);
      if (verified.state !== "successful") {
        throw new Error(`Provider verification returned ${verified.state}`);
      }

      const { error } = await admin.rpc("apply_payment_success", {
        p_reference: reference,
        p_provider_reference: verified.providerReference,
        p_amount_minor_units: verified.amountMinorUnits,
        p_currency: verified.currency,
        p_provider_payload: toJson(verified.raw),
      });
      if (error) throw new Error(error.message);
      outcome = "processed";
    } else if (
      event === "transfer.success" ||
      event === "transfer.failed" ||
      event === "transfer.reversed"
    ) {
      const transferReference =
        typeof data.reference === "string" ? data.reference : "";
      if (!transferReference) throw new Error("transfer event without reference");

      const { data: payout } = await admin
        .from("referral_payout_requests")
        .select("id, status")
        .eq("provider_transfer_reference", transferReference)
        .maybeSingle();

      if (payout) {
        if (event === "transfer.success") {
          const { error } = await admin.rpc(
            "record_referral_payout_transfer",
            {
              p_payout: payout.id,
              p_status: "paid",
              p_provider_reference: transferReference,
              p_reason: undefined,
            },
          );
          if (error) throw new Error(error.message);
          outcome = "processed";
        } else if (event === "transfer.failed") {
          const { error } = await admin.rpc(
            "record_referral_payout_transfer",
            {
              p_payout: payout.id,
              p_status: "failed",
              p_provider_reference: transferReference,
              p_reason: "Provider reported a failed transfer",
            },
          );
          if (error) throw new Error(error.message);
          outcome = "processed";
        } else {
          // A reversed transfer after payment needs manual reconciliation; do
          // not pretend the payout returned to an approved state silently.
          outcome = "ignored";
        }
      }
    } else if (event === "refund.processed") {
      const transaction =
        (typeof data.transaction_reference === "string"
          ? data.transaction_reference
          : typeof data.transaction === "string"
            ? data.transaction
            : null) ?? null;
      const amount = Number(data.amount);

      if (!transaction || !Number.isFinite(amount) || amount <= 0) {
        throw new Error("refund event without transaction or amount");
      }

      const { error } = await admin.rpc("apply_payment_refund", {
        p_reference: transaction,
        p_amount_minor_units: amount,
        p_provider_reference:
          typeof data.reference === "string" ? data.reference : undefined,
      });
      if (error) throw new Error(error.message);
      outcome = "processed";
    }

    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: outcome,
        processed_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    return { status: 200, message: outcome };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    await admin
      .from("payment_webhook_events")
      .update({
        processing_status: "failed",
        error_message: message.slice(0, 1000),
      })
      .eq("id", recordId);

    console.error("[payments] webhook processing failed", { event, message });
    return { status: 500, message: "Processing failed" };
  }
}
