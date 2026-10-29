import { brand } from "@/config/brand";
import {
  emailButton,
  emailLayout,
  emailMuted,
  emailParagraph,
} from "@/lib/email/templates/layout";

export type InvitationEmailInput = {
  organisationName: string;
  roleLabel: string;
  inviterName?: string | null;
  acceptUrl: string;
  expiresAt: Date;
};

export function organisationInvitationEmail(input: InvitationEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = input.expiresAt.toLocaleDateString(brand.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: brand.timeZone,
  });

  const invitedBy = input.inviterName
    ? `${input.inviterName} invited you`
    : "You have been invited";

  const subject = `You're invited to ${input.organisationName} on ${brand.name}`;

  const html = emailLayout({
    heading: `Join ${input.organisationName}`,
    previewText: `${invitedBy} to join ${input.organisationName} as ${input.roleLabel}.`,
    footerNote: `This invitation expires on ${expiry}. If you were not expecting it, you can safely ignore this email.`,
    children: [
      emailParagraph(
        `${invitedBy} to join ${input.organisationName} on ${brand.name} as ${input.roleLabel}.`,
      ),
      emailButton({ label: "Accept invitation", href: input.acceptUrl }),
      emailMuted(
        `If the button does not work, paste this link into your browser: ${input.acceptUrl}`,
      ),
    ].join(""),
  });

  const text = [
    `${invitedBy} to join ${input.organisationName} on ${brand.name} as ${input.roleLabel}.`,
    "",
    `Accept the invitation: ${input.acceptUrl}`,
    "",
    `This invitation expires on ${expiry}.`,
    `${brand.tagline}`,
  ].join("\n");

  return { subject, html, text };
}
