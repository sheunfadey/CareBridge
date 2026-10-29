import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PaymentReconciliationStatus,
  PaymentStatus,
} from "@/types/database";

export type PaymentSummary = {
  id: string;
  reference: string;
  payerId: string;
  payerName: string | null;
  payerEmail: string;
  purpose: string;
  description: string | null;
  amountMinorUnits: number;
  refundedMinorUnits: number;
  currency: string;
  status: PaymentStatus;
  reconciliationStatus: PaymentReconciliationStatus;
  providerReference: string | null;
  createdAt: string;
  paidAt: string | null;
  lastVerifiedAt: string | null;
  productId: string | null;
  organisationId: string | null;
};

export type PaymentFilters = {
  status?: PaymentStatus | "all";
  statuses?: PaymentStatus[];
  reconciliation?: PaymentReconciliationStatus | "all";
  search?: string;
  limit?: number;
};

export type PaymentDetail = PaymentSummary & {
  metadata: Record<string, unknown>;
  providerPayload: Record<string, unknown>;
  refunds: {
    id: string;
    amountMinorUnits: number;
    reason: string;
    status: string;
    providerReference: string | null;
    createdAt: string;
  }[];
  webhookEvents: {
    id: string;
    eventType: string;
    processingStatus: string;
    attempts: number;
    errorMessage: string | null;
    receivedAt: string;
  }[];
};

function mapPayment(row: {
  id: string;
  reference: string;
  payer_id: string;
  payer_email: string;
  purpose: string;
  description: string | null;
  amount_minor_units: number;
  refunded_amount_minor_units: number;
  currency: string;
  status: string;
  reconciliation_status: string;
  provider_reference: string | null;
  created_at: string;
  paid_at: string | null;
  last_verified_at: string | null;
  product_id: string | null;
  organisation_id: string | null;
}): PaymentSummary {
  return {
    id: row.id,
    reference: row.reference,
    payerId: row.payer_id,
    payerName: null,
    payerEmail: row.payer_email,
    purpose: row.purpose,
    description: row.description,
    amountMinorUnits: row.amount_minor_units,
    refundedMinorUnits: row.refunded_amount_minor_units,
    currency: row.currency,
    status: row.status as PaymentStatus,
    reconciliationStatus:
      row.reconciliation_status as PaymentReconciliationStatus,
    providerReference: row.provider_reference,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    lastVerifiedAt: row.last_verified_at,
    productId: row.product_id,
    organisationId: row.organisation_id,
  };
}

async function attachPayerNames(
  payments: PaymentSummary[],
): Promise<PaymentSummary[]> {
  if (payments.length === 0) return payments;
  const supabase = await createClient();
  const ids = Array.from(new Set(payments.map((payment) => payment.payerId)));
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const names = new Map(
    (data ?? []).map((profile) => [profile.id, profile.full_name]),
  );

  return payments.map((payment) => ({
    ...payment,
    payerName: names.get(payment.payerId) ?? null,
  }));
}

export async function listMyPayments(limit = 25): Promise<PaymentSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      "id, reference, payer_id, payer_email, purpose, description, amount_minor_units, refunded_amount_minor_units, currency, status, reconciliation_status, provider_reference, created_at, paid_at, last_verified_at, product_id, organisation_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapPayment);
}

export async function listAdminPayments(
  filters: PaymentFilters = {},
): Promise<PaymentSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("payment_transactions")
    .select(
      "id, reference, payer_id, payer_email, purpose, description, amount_minor_units, refunded_amount_minor_units, currency, status, reconciliation_status, provider_reference, created_at, paid_at, last_verified_at, product_id, organisation_id",
    )
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in("status", filters.statuses);
  } else if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.reconciliation && filters.reconciliation !== "all") {
    query = query.eq("reconciliation_status", filters.reconciliation);
  }
  if (filters.search?.trim()) {
    const search = filters.search.trim();
    query = query.or(
      `reference.ilike.%${search}%,payer_email.ilike.%${search}%,provider_reference.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return attachPayerNames(data.map(mapPayment));
}

export async function getPaymentDetail(
  reference: string,
): Promise<PaymentDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_transactions")
    .select(
      "id, reference, payer_id, payer_email, purpose, description, amount_minor_units, refunded_amount_minor_units, currency, status, reconciliation_status, provider_reference, created_at, paid_at, last_verified_at, product_id, organisation_id, metadata, provider_payload",
    )
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;

  const [refundsResult, eventsResult, payerResult] = await Promise.all([
    supabase
      .from("payment_refunds")
      .select(
        "id, amount_minor_units, reason, status, provider_reference, created_at",
      )
      .eq("transaction_id", data.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_webhook_events")
      .select(
        "id, event_type, processing_status, attempts, error_message, received_at",
      )
      .order("received_at", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.payer_id)
      .maybeSingle(),
  ]);

  return {
    ...mapPayment(data),
    payerName: payerResult.data?.full_name ?? null,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    providerPayload: (data.provider_payload ?? {}) as Record<string, unknown>,
    refunds: (refundsResult.data ?? []).map((refund) => ({
      id: refund.id,
      amountMinorUnits: refund.amount_minor_units,
      reason: refund.reason,
      status: refund.status,
      providerReference: refund.provider_reference,
      createdAt: refund.created_at,
    })),
    webhookEvents: (eventsResult.data ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      processingStatus: event.processing_status,
      attempts: event.attempts,
      errorMessage: event.error_message,
      receivedAt: event.received_at,
    })),
  };
}

export type ReconciliationSummary = {
  successfulMinorUnits: number;
  refundedMinorUnits: number;
  pendingCount: number;
  mismatchCount: number;
  successfulCount: number;
};

export async function getReconciliationSummary(): Promise<ReconciliationSummary> {
  const supabase = await createClient();

  const [successful, refunded, pending, mismatch, successCount] =
    await Promise.all([
      supabase
        .from("payment_transactions")
        .select("amount_minor_units")
        .in("status", ["successful", "partially_refunded", "refunded"]),
      supabase
        .from("payment_transactions")
        .select("refunded_amount_minor_units")
        .gt("refunded_amount_minor_units", 0),
      supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .in("status", ["initiated", "pending"]),
      supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("reconciliation_status", "mismatch"),
      supabase
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "successful"),
    ]);

  const successfulMinorUnits = (successful.data ?? []).reduce(
    (total, row) => total + Number(row.amount_minor_units),
    0,
  );
  const refundedMinorUnits = (refunded.data ?? []).reduce(
    (total, row) => total + Number(row.refunded_amount_minor_units),
    0,
  );

  return {
    successfulMinorUnits,
    refundedMinorUnits,
    pendingCount: pending.count ?? 0,
    mismatchCount: mismatch.count ?? 0,
    successfulCount: successCount.count ?? 0,
  };
}
