import { describe, expect, it } from "vitest";

import { escapeHtml } from "@/lib/email/templates/layout";
import { organisationInvitationEmail } from "@/lib/email/templates/organisation-invitation";

describe("escapeHtml", () => {
  it("escapes all HTML-significant characters", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
    );
  });
});

describe("organisationInvitationEmail", () => {
  const input = {
    organisationName: "Lagos Care Home",
    roleLabel: "Care staff",
    inviterName: "Ada Obi",
    acceptUrl: "https://app.carebridge.ng/dashboard/organisation/accept?token=abc",
    expiresAt: new Date("2026-12-01T00:00:00Z"),
  };

  it("includes the organisation, role and accept link", () => {
    const email = organisationInvitationEmail(input);
    expect(email.subject).toContain("Lagos Care Home");
    expect(email.html).toContain(input.acceptUrl);
    expect(email.text).toContain(input.acceptUrl);
    expect(email.text).toContain("Care staff");
  });

  it("escapes interpolated organisation names", () => {
    const email = organisationInvitationEmail({
      ...input,
      organisationName: '<img src=x onerror=alert(1)>',
    });
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img src=x");
  });

  it("produces a non-empty plaintext alternative", () => {
    const email = organisationInvitationEmail(input);
    expect(email.text.trim().length).toBeGreaterThan(0);
  });
});
