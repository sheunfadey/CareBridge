import "server-only";

import { createConsoleEmailProvider } from "@/lib/email/providers/console";
import { createResendEmailProvider } from "@/lib/email/providers/resend";
import type { EmailProvider } from "@/lib/email/types";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveProvider(
  organisationId?: string | null,
): Promise<EmailProvider> {
  const admin = createAdminClient();
  if (admin && organisationId) {
    const { data } = await admin
      .from("organisation_integrations")
      .select("provider, secret_key, sender_id, sender_name")
      .eq("organisation_id", organisationId)
      .eq("kind", "email")
      .eq("is_enabled", true)
      .maybeSingle();

    if (
      data?.provider?.toLowerCase() === "resend" &&
      data.secret_key &&
      data.sender_id
    ) {
      return createResendEmailProvider({
        apiKey: data.secret_key,
        fromAddress: data.sender_id,
        fromName: data.sender_name ?? undefined,
      });
    }
  }

  const providerName = process.env.EMAIL_PROVIDER?.toLowerCase();
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (providerName === "resend" && apiKey && fromAddress) {
    return createResendEmailProvider({
      apiKey,
      fromAddress,
      fromName: process.env.EMAIL_FROM_NAME,
    });
  }

  return createConsoleEmailProvider();
}

export async function getEmailProvider(
  organisationId?: string | null,
): Promise<EmailProvider> {
  return resolveProvider(organisationId);
}

/** True when a real (non-console) transport is configured. */
export function isEmailDeliveryConfigured(): boolean {
  return (
    process.env.EMAIL_PROVIDER?.toLowerCase() === "resend" &&
    Boolean(process.env.EMAIL_PROVIDER_API_KEY) &&
    Boolean(process.env.EMAIL_FROM_ADDRESS)
  );
}
