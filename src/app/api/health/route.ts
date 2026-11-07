import { NextResponse } from "next/server";
import { connection } from "next/server";

import {
  areTransfersEnabled,
  getPaymentGatewaySettings,
} from "@/lib/payments/provider";

/**
 * Lightweight production health signal. It reports configuration booleans only
 * and never exposes secrets. Database reachability is checked by the smoke test
 * and provider dashboards rather than on every health probe.
 */
export async function GET() {
  await connection();

  const gateway = await getPaymentGatewaySettings();
  const checks = {
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    paymentsConfigured: gateway.hasSecret,
    webhookSecretConfigured: gateway.hasWebhookSecret,
    transfersEnabled: await areTransfersEnabled(),
    emailProvider: process.env.EMAIL_PROVIDER === "resend" ? "resend" : "console",
  };

  const ok = checks.supabaseConfigured;

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
