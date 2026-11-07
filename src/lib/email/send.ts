import "server-only";

import { getEmailProvider, isEmailDeliveryConfigured } from "@/lib/email/provider";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

/**
 * Sends a transactional email through the configured provider. Never throws:
 * delivery failures are returned so the calling flow can decide whether to
 * surface them. Recipient addresses are not logged in full.
 */
export async function sendEmail(
  message: EmailMessage,
  organisationId?: string | null,
): Promise<EmailSendResult> {
  const provider = await getEmailProvider(organisationId);

  if (!provider.isConfigured()) {
    return {
      ok: false,
      provider: provider.name,
      reason: "Email provider is not configured.",
    };
  }

  const result = await provider.send(message);

  if (!result.ok) {
    console.warn("[email] delivery not completed", {
      provider: result.provider,
      reason: result.reason,
      subject: message.subject,
    });
  }

  return result;
}

export function emailDeliveryAvailable(): boolean {
  return isEmailDeliveryConfigured();
}
