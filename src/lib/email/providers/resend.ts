import type {
  EmailAddress,
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from "@/lib/email/types";

type ResendConfig = {
  apiKey: string;
  fromAddress: string;
  fromName?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function formatAddress(address: EmailAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

/**
 * Resend HTTP API transport. Uses fetch so there is no SDK dependency. Network
 * failures are returned as { ok: false } rather than thrown.
 */
export function createResendEmailProvider(config: ResendConfig): EmailProvider {
  return {
    name: "resend",
    isConfigured() {
      return Boolean(config.apiKey && config.fromAddress);
    },
    async send(message: EmailMessage): Promise<EmailSendResult> {
      const from = formatAddress({
        email: config.fromAddress,
        name: config.fromName ?? "CareBridge",
      });
      const to = (Array.isArray(message.to) ? message.to : [message.to]).map(
        formatAddress,
      );

      try {
        const response = await fetch(RESEND_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            reply_to: message.replyTo?.email,
          }),
        });

        if (!response.ok) {
          return {
            ok: false,
            provider: "resend",
            reason: `Resend responded with ${response.status}`,
          };
        }

        const data = (await response.json()) as { id?: string };
        return { ok: true, provider: "resend", providerId: data.id ?? null };
      } catch (error) {
        return {
          ok: false,
          provider: "resend",
          reason: error instanceof Error ? error.message : "Unknown network error",
        };
      }
    },
  };
}
