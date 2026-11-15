import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import { adminService } from "@/server/admin/admin-service";
import { isEmailDeliveryConfigured } from "@/lib/email/provider";
import {
  areTransfersEnabled,
  getPaymentGatewaySettings,
  isPaymentProviderConfigured,
} from "@/lib/payments/provider";

export const metadata: Metadata = {
  title: "Platform settings",
};

type SettingRow = {
  label: string;
  description: string;
  configured: boolean;
  configuredLabel: string;
  unconfiguredLabel: string;
};

export default async function AdminSettingsPage() {
  await requireSuperAdminPage("/dashboard/admin/settings");

  const serviceRole = adminService.isAvailable();
  const email = isEmailDeliveryConfigured();
  const paymentProvider = await isPaymentProviderConfigured();
  const transfers = await areTransfersEnabled();
  const gateway = await getPaymentGatewaySettings();
  const paystackMode = gateway.mode === "live" ? "Live" : "Sandbox";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/payments/webhook/paystack`;

  const rows: SettingRow[] = [
    {
      label: "Service-role client",
      description:
        "Required for cross-tenant administration such as approving organisations and changing account status.",
      configured: serviceRole,
      configuredLabel: "Configured",
      unconfiguredLabel: "Not configured",
    },
    {
      label: "Transactional email provider",
      description:
        "Delivers branded emails such as organisation invitations. Falls back to console logging when unset.",
      configured: email,
      configuredLabel: "Delivery enabled",
      unconfiguredLabel: "Console only",
    },
    {
      label: "Payment provider (Paystack)",
      description:
        "Handles customer payments, refunds and reconciliation. Register the webhook below in the Paystack dashboard.",
      configured: paymentProvider,
      configuredLabel: "Configured",
      unconfiguredLabel: "Not configured",
    },
    {
      label: "Paystack webhook secret",
      description:
        "Used to verify webhook signatures. Set PAYSTACK_WEBHOOK_SECRET to the Paystack secret key.",
      configured: Boolean(process.env.PAYSTACK_WEBHOOK_SECRET),
      configuredLabel: "Configured",
      unconfiguredLabel: "Not configured",
    },
    {
      label: "Provider transfers",
      description:
        "Referral payouts remain disabled until the business approves transfers and enables PAYSTACK_TRANSFERS_ENABLED.",
      configured: transfers,
      configuredLabel: "Enabled",
      unconfiguredLabel: "Disabled",
    },
  ];

  const policyNotes = [
    "Financial policy changes never rewrite commissions or transactions that were already recorded.",
    "Privileged role assignment, organisation deletion and manual financial adjustments require explicit controls and are audit-logged.",
    "Sensitive resident-record access is restricted and recorded; it is not part of ordinary platform administration.",
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <AdminPageHeader
        eyebrow="Platform administration"
        title="Platform settings"
        description="Read-only configuration status for the current environment, and platform policy safeguards."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration", href: "/dashboard/admin" },
          { label: "Settings" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Configuration status
        </h2>
        <Card className="divide-y divide-border p-0">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-brand-strong">
                  {row.label}
                </p>
                <p className="max-w-2xl text-xs text-muted-foreground">
                  {row.description}
                </p>
              </div>
              <StatusBadge
                status={row.configured ? "active" : "inactive"}
                label={
                  row.configured ? row.configuredLabel : row.unconfiguredLabel
                }
                tone={row.configured ? "success" : "neutral"}
                showDot
              />
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Paystack
        </h2>
        <Card className="space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Mode</span>
            <StatusBadge
              status={paystackMode.toLowerCase()}
              label={paystackMode}
              tone={paystackMode === "Live" ? "success" : "info"}
              showDot
            />
          </div>
          <div>
            <p className="font-medium text-brand-strong">Webhook endpoint</p>
            <code className="mt-1 block break-all rounded-md bg-muted/60 px-2.5 py-2 text-xs text-brand-strong">
              {webhookUrl}
            </code>
            <p className="mt-1 text-xs text-muted-foreground">
              Add this URL in Paystack → Settings → API Keys &amp; Webhooks.
              Failed or unregistered webhooks still fall back to server-side
              verification when the customer returns from checkout.
            </p>
          </div>
          <div>
            <p className="font-medium text-brand-strong">Test transactions</p>
            <p className="mt-1 text-xs text-muted-foreground">
              If Paystack returns “No active channel”, enable a test payment
              channel in the Paystack dashboard before trying checkout.
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Policy safeguards
        </h2>
        <Card className="p-4">
          <ul className="space-y-3">
            {policyNotes.map((note) => (
              <li key={note} className="flex gap-3 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green"
                />
                {note}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Editable branding, organisation types and feature flags are introduced in
        a later phase. This page reports configuration status only, so that
        nothing unverified is presented as active.
      </p>
    </div>
  );
}
