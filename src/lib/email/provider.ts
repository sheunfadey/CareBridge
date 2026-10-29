import "server-only";

import { createConsoleEmailProvider } from "@/lib/email/providers/console";
import { createResendEmailProvider } from "@/lib/email/providers/resend";
import type { EmailProvider } from "@/lib/email/types";

function resolveProvider(): EmailProvider {
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

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!cached) {
    cached = resolveProvider();
  }
  return cached;
}

/** True when a real (non-console) transport is configured. */
export function isEmailDeliveryConfigured(): boolean {
  return getEmailProvider().name !== "console";
}
