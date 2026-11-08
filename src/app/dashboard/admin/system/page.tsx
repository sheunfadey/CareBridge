import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import { adminService } from "@/server/admin/admin-service";
import { getPlatformStats } from "@/server/admin/platform-stats";
import { isEmailDeliveryConfigured } from "@/lib/email/provider";
import {
  areTransfersEnabled,
  getPaymentGatewaySettings,
  isPaymentProviderConfigured,
} from "@/lib/payments/provider";

export const metadata: Metadata = {
  title: "System and APIs",
};

export default async function SystemPage() {
  await requireSuperAdminPage("/dashboard/admin/system");

  const stats = await getPlatformStats();
  const serviceRole = adminService.isAvailable();
  const payments = await isPaymentProviderConfigured();
  const transfers = await areTransfersEnabled();
  const gateway = await getPaymentGatewaySettings();
  const email = isEmailDeliveryConfigured();
  const paystackMode = gateway.mode === "live" ? "Live" : "Sandbox";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checks: {
    label: string;
    detail: string;
    ok: boolean;
    okLabel?: string;
    offLabel?: string;
  }[] = [
    {
      label: "Supabase database and auth",
      detail: "Project connection and RLS-backed data access.",
      ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: "Service-role client",
      detail: "Cross-tenant administration and verified payment writes.",
      ok: serviceRole,
    },
    {
      label: "Paystack provider",
      detail: `Checkout and refunds in ${paystackMode.toLowerCase()} mode.`,
      ok: payments,
    },
    {
      label: "Paystack webhook secret",
      detail: "Required for signed, idempotent webhook processing.",
      ok: Boolean(process.env.PAYSTACK_WEBHOOK_SECRET),
    },
    {
      label: "Provider transfers",
      detail: "Referral payouts remain off until approved.",
      ok: transfers,
      okLabel: "Enabled",
      offLabel: "Disabled",
    },
    {
      label: "Transactional email",
      detail: "Console logging until Resend is configured.",
      ok: email,
      okLabel: "Delivery enabled",
      offLabel: "Console only",
    },
  ];

  const endpoints = [
    ["Health", `${appUrl}/api/health`],
    ["Paystack callback", `${appUrl}/api/payments/callback`],
    ["Paystack webhook", `${appUrl}/api/payments/webhook/paystack`],
  ];

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Platform operations"
        title="System & APIs"
        description="Health, integrations, API endpoints and maintenance status for the HillCrest platform."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "System & APIs" },
        ]}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Organisations", stats.organisations],
          ["Users", stats.users],
          ["Active subscriptions", stats.activeSubscriptions],
          ["Pending payments", stats.pendingPayments],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
              {label}
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
              {value}
            </p>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Integration status
        </h2>
        <Card className="divide-y divide-border p-0">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-brand-strong">
                  {check.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {check.detail}
                </p>
              </div>
              <StatusBadge
                status={check.ok ? "active" : "inactive"}
                label={
                  check.ok
                    ? (check.okLabel ?? "Configured")
                    : (check.offLabel ?? "Not configured")
                }
                tone={check.ok ? "success" : "neutral"}
                showDot
              />
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          API endpoints
        </h2>
        <Card className="divide-y divide-border p-0">
          {endpoints.map(([label, url]) => (
            <div key={label} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-brand-strong">{label}</p>
              <code className="break-all rounded bg-muted/60 px-2 py-1 text-xs text-brand-strong">
                {url}
              </code>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-brand-strong">
          Maintenance notes
        </h2>
        <Card className="space-y-2 p-4 text-sm text-muted-foreground">
          <p>Database migrations are applied through `0037`.</p>
          <p>Course resources use the private `course-resources` storage bucket.</p>
          <p>
            Paystack test payments remain blocked until the provider enables a
            payment channel. Register the webhook endpoint above in Paystack.
          </p>
          <p>
            Email delivery is console-only until a Resend key and verified sender
            are configured.
          </p>
        </Card>
      </section>
    </div>
  );
}
