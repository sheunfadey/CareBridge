import "server-only";

import { createPaystackProvider } from "@/lib/payments/providers/paystack";
import type { PaymentProvider } from "@/lib/payments/types";

function resolveMode(): "sandbox" | "live" {
  return process.env.PAYSTACK_MODE?.toLowerCase() === "live"
    ? "live"
    : "sandbox";
}

function resolveProvider(): PaymentProvider {
  return createPaystackProvider({
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    mode: resolveMode(),
    transfersEnabled: process.env.PAYSTACK_TRANSFERS_ENABLED === "true",
  });
}

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!cached) {
    cached = resolveProvider();
  }
  return cached;
}

/** True when a real provider secret is configured on the server. */
export function isPaymentProviderConfigured(): boolean {
  return getPaymentProvider().configured;
}

/** True only when provider transfers have been explicitly enabled. */
export function areTransfersEnabled(): boolean {
  return getPaymentProvider().transfersEnabled;
}
