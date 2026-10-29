import { brand } from "@/config/brand";

type ButtonProps = {
  label: string;
  href: string;
};

type LayoutProps = {
  heading: string;
  previewText?: string;
  children: string;
  footerNote?: string;
};

const c = brand.colors;

/**
 * Wraps body content in the CareBridge transactional email shell. All styling is
 * inlined because email clients do not support stylesheets or CSS variables.
 */
export function emailLayout({
  heading,
  previewText,
  children,
  footerNote,
}: LayoutProps): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="${brand.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${c.sky};font-family:'Inter',Helvetica,Arial,sans-serif;color:${c.ink};">
    ${
      previewText
        ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.sky};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${c.white};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(18,48,74,0.08);">
            <tr>
              <td style="background:${c.navy};padding:24px 32px;">
                <span style="font-size:20px;font-weight:700;color:${c.white};letter-spacing:-0.01em;">${brand.name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${c.navy};">${escapeHtml(heading)}</h1>
                ${children}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${c.border};">
                <p style="margin:0 0 8px;font-size:12px;color:${c.slate};line-height:1.6;">
                  ${footerNote ? escapeHtml(footerNote) : ""}
                </p>
                <p style="margin:0;font-size:12px;color:${c.slate};line-height:1.6;">
                  ${escapeHtml(brand.tagline)}<br />
                  &copy; ${year} ${escapeHtml(brand.legalName)}
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px auto 0;font-size:11px;color:${c.slate};text-align:center;">
            Need help? Contact <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${c.teal};text-decoration:none;">${escapeHtml(brand.supportEmail)}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${c.ink};">${escapeHtml(text)}</p>`;
}

export function emailButton({ label, href }: ButtonProps): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td style="background:${c.teal};border-radius:10px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${c.white};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function emailMuted(text: string): string {
  return `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${c.slate};">${escapeHtml(text)}</p>`;
}

/** Minimal HTML escaping for values interpolated into email templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
