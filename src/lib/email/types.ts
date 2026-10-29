export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailMessage = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text: string;
  replyTo?: EmailAddress;
  tags?: Record<string, string>;
};

export type EmailSendResult =
  | { ok: true; providerId: string | null; provider: string }
  | { ok: false; provider: string; reason: string };

/**
 * Provider-agnostic email transport. Implementations must:
 *  - never throw for a delivery failure (return { ok: false }),
 *  - never log recipient-identifying secrets,
 *  - be safe to call on the server only.
 */
export type EmailProvider = {
  name: string;
  isConfigured(): boolean;
  send(message: EmailMessage): Promise<EmailSendResult>;
};
