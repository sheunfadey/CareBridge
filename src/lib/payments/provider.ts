import "server-only";

import { createPaystackProvider } from "@/lib/payments/providers/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProvider } from "@/lib/payments/types";

type GatewaySettings = {
  mode: "sandbox" | "live";
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  publicKey: string | undefined;
};

async function loadGatewaySettings(): Promise<GatewaySettings> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("payment_gateway_settings")
      .select("mode, public_key, secret_key, webhook_secret")
      .eq("id", true)
      .maybeSingle();

    if (data) {
      return {
        mode: data.mode === "live" ? "live" : "sandbox",
        secretKey: data.secret_key?.trim() || process.env.PAYSTACK_SECRET_KEY,
        webhookSecret:
          data.webhook_secret?.trim() ||
          process.env.PAYSTACK_WEBHOOK_SECRET ||
          data.secret_key?.trim() ||
          process.env.PAYSTACK_SECRET_KEY,
        publicKey:
          data.public_key?.trim() || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      };
    }
  }

  return {
    mode: process.env.PAYSTACK_MODE?.toLowerCase() === "live" ? "live" : "sandbox",
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };
}

export async function getPaymentProvider(): Promise<PaymentProvider> {
  const settings = await loadGatewaySettings();
  return createPaystackProvider({
    secretKey: settings.secretKey,
    webhookSecret: settings.webhookSecret,
    mode: settings.mode,
    transfersEnabled: process.env.PAYSTACK_TRANSFERS_ENABLED === "true",
  });
}

export async function getPaymentGatewaySettings(): Promise<{
  mode: "sandbox" | "live";
  publicKey: string;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
  source: "database" | "environment";
}> {
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("payment_gateway_settings")
      .select("mode, public_key, secret_key, webhook_secret")
      .eq("id", true)
      .maybeSingle();

    if (data) {
      const hasDatabaseKey = Boolean(
        data.secret_key?.trim() ||
          data.public_key?.trim() ||
          data.webhook_secret?.trim(),
      );
      return {
        mode: data.mode === "live" ? "live" : "sandbox",
        publicKey:
          data.public_key?.trim() ||
          process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
          "",
        hasSecret: Boolean(
          data.secret_key?.trim() || process.env.PAYSTACK_SECRET_KEY,
        ),
        hasWebhookSecret: Boolean(
          data.webhook_secret?.trim() ||
            data.secret_key?.trim() ||
            process.env.PAYSTACK_WEBHOOK_SECRET ||
            process.env.PAYSTACK_SECRET_KEY,
        ),
        source: hasDatabaseKey ? "database" : "environment",
      };
    }
  }

  return {
    mode: process.env.PAYSTACK_MODE?.toLowerCase() === "live" ? "live" : "sandbox",
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
    hasSecret: Boolean(process.env.PAYSTACK_SECRET_KEY),
    hasWebhookSecret: Boolean(
      process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY,
    ),
    source: "environment",
  };
}

/** True when a real provider secret is configured on the server. */
export async function isPaymentProviderConfigured(): Promise<boolean> {
  return (await getPaymentProvider()).configured;
}

/** True only when provider transfers have been explicitly enabled. */
export async function areTransfersEnabled(): Promise<boolean> {
  return (await getPaymentProvider()).transfersEnabled;
}
