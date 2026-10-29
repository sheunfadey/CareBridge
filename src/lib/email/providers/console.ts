import type {
  EmailMessage,
  EmailProvider,
  EmailSendResult,
} from "@/lib/email/types";

/**
 * Development/test transport. It never claims to deliver: it logs a redacted
 * summary so developers can confirm what would have been sent, and reports
 * `ok: false` so callers do not treat unconfigured email as delivered.
 */
export function createConsoleEmailProvider(): EmailProvider {
  return {
    name: "console",
    isConfigured() {
      return true;
    },
    async send(message: EmailMessage): Promise<EmailSendResult> {
      const recipients = (Array.isArray(message.to) ? message.to : [message.to])
        .map((address) => address.email)
        .join(", ");

      console.info("[email:console] would send", {
        to: recipients,
        subject: message.subject,
        textLength: message.text.length,
      });

      return {
        ok: false,
        provider: "console",
        reason: "No email provider configured; message was not delivered.",
      };
    },
  };
}
