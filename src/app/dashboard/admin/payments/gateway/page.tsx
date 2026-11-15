import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon, KeyRoundIcon, WebhookIcon } from "lucide-react";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSuperAdminPage } from "@/server/admin/require-super-admin";
import {
  areTransfersEnabled,
  getPaymentGatewaySettings,
  isPaymentProviderConfigured,
} from "@/lib/payments/provider";
import { TestPaymentGatewayButton } from "@/features/payments/components/test-gateway-button";
import { PaymentGatewayForm } from "@/features/payments/components/payment-gateway-form";

export const metadata: Metadata = {
  title: "Payment gateway",
};

export default async function PaymentGatewayPage() {
  await requireSuperAdminPage("/dashboard/admin/payments/gateway");

  const configured = await isPaymentProviderConfigured();
  const transfers = await areTransfersEnabled();
  const gateway = await getPaymentGatewaySettings();
  const mode = gateway.mode === "live" ? "Live" : "Sandbox";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/payments/webhook/paystack`;
  const keyHint = gateway.publicKey
    ? `•••• ${gateway.publicKey.slice(-4)}`
    : "Not configured";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <AdminPageHeader
        eyebrow="Platform payments"
        title="Paystack payment gateway"
        description="Connection status and configuration for organisation course payments, donations and reconciliation."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Payments", href: "/dashboard/admin/payments" },
          { label: "Payment gateway" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/courses/medication-support-in-care">
              Open paid test course
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Provider", configured ? "Paystack" : "Not configured"],
          ["Mode", mode],
          ["Public key", keyHint],
          ["Transfers", transfers ? "Enabled" : "Disabled"],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
              {label}
            </p>
            <p className="mt-2 font-heading text-lg font-semibold text-brand-strong">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              API credentials
            </h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Enter or rotate Paystack keys here. Saved keys are server-side only
              and are never returned to the browser.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Secret key</Badge>
              <StatusBadge
                status={gateway.hasSecret ? "active" : "inactive"}
                label={gateway.hasSecret ? "Configured" : "Missing"}
                tone={gateway.hasSecret ? "success" : "error"}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Webhook secret</Badge>
              <StatusBadge
                status={gateway.hasWebhookSecret ? "active" : "inactive"}
                label={gateway.hasWebhookSecret ? "Configured" : "Missing"}
                tone={gateway.hasWebhookSecret ? "success" : "error"}
              />
            </div>
            <p className="text-xs">
              Active source:{" "}
              {gateway.source === "database"
                ? "saved gateway settings"
                : "environment variables"}
            </p>
          </div>

          <PaymentGatewayForm
            mode={gateway.mode}
            publicKey={gateway.publicKey}
          />
          <TestPaymentGatewayButton />
        </Card>

        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <WebhookIcon className="size-5 text-brand-teal" aria-hidden="true" />
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Webhook
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Register this endpoint in Paystack → Settings → API Keys &amp;
            Webhooks. Use the test secret key as the webhook secret.
          </p>
          <code className="block break-all rounded-md bg-muted/60 px-2.5 py-2 text-xs text-brand-strong">
            {webhookUrl}
          </code>
          <div className="rounded-md border border-brand-warning/30 bg-brand-warning/5 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-brand-strong">Before testing checkout</p>
            <p className="mt-1">
              Enable at least one payment channel in the Paystack test dashboard.
              Otherwise Paystack returns “No active channel to process
              transaction”.
            </p>
          </div>
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2Icon className="size-5 text-brand-green" aria-hidden="true" />
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Paid course test
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the seed paid course “Medication Support in Care” (₦5,000) to test
          checkout. Sign in as a student, open the course and choose the paid
          enrolment action. Payment success is only shown after server-side
          Paystack verification.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/courses/medication-support-in-care">
              Open course
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/payments">Review payments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/reconciliation">Reconciliation</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paystack test card: 4084 0840 8408 4081 · CVV 408 · PIN 0000 · OTP
          123456. Use test mode only.
        </p>
      </Card>
    </div>
  );
}
