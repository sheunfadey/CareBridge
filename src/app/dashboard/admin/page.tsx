import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ActivityIcon,
  Building2Icon,
  CreditCardIcon,
  MessageSquareIcon,
  PlugZapIcon,
  ScaleIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/current-user";
import { adminService } from "@/server/admin/admin-service";
import { getPlatformStats } from "@/server/admin/platform-stats";

export const metadata: Metadata = {
  title: "Platform administration",
};

const sections = [
  {
    title: "User management",
    description: "Review accounts and control account status.",
    href: "/dashboard/admin/users",
    icon: UsersIcon,
  },
  {
    title: "Organisations",
    description: "Approve, verify and manage organisations across every tenant.",
    href: "/dashboard/admin/organisations",
    icon: Building2Icon,
  },
  {
    title: "Subscriptions & plans",
    description: "Plans, trials, lifecycle events, module limits and billing records.",
    href: "/dashboard/admin/subscriptions",
    icon: CreditCardIcon,
  },
  {
    title: "Payments",
    description: "Review customer payments, verification states and refunds.",
    href: "/dashboard/admin/payments",
    icon: WalletIcon,
  },
  {
    title: "Payment gateway",
    description: "Paystack credentials, connection test, webhook and paid-course testing.",
    href: "/dashboard/admin/payments/gateway",
    icon: PlugZapIcon,
  },
  {
    title: "Reconciliation",
    description: "Match provider settlements against the platform ledger.",
    href: "/dashboard/admin/reconciliation",
    icon: ScaleIcon,
  },
  {
    title: "Support messages",
    description: "Organisation-scoped support conversations and message history.",
    href: "/dashboard/messages",
    icon: MessageSquareIcon,
  },
  {
    title: "System & APIs",
    description: "Health, integrations, API endpoints and maintenance status.",
    href: "/dashboard/admin/system",
    icon: ActivityIcon,
  },
  {
    title: "Audit log",
    description: "Review platform-wide administrative and security events.",
    href: "/dashboard/admin/audit",
    icon: ScrollTextIcon,
  },
  {
    title: "Platform settings",
    description: "Configuration status and platform policy controls.",
    href: "/dashboard/admin/settings",
    icon: SettingsIcon,
  },
] as const;

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/admin");
  }

  if (!user.isSuperAdmin) {
    redirect("/dashboard");
  }

  const available = adminService.isAvailable();

  const [pendingOrgCount, userCount, stats] = available
    ? await Promise.all([
        adminService.countPendingOrganisations(),
        adminService.countProfiles(),
        getPlatformStats(),
      ])
    : [null, null, null];

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Platform"
        title="Administration"
        description="Super-admin-only capabilities that operate across every tenant. Every action is recorded in the audit log."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Administration" },
        ]}
      />

      <Alert variant={available ? "default" : "destructive"}>
        {available ? (
          <ShieldCheckIcon aria-hidden="true" />
        ) : (
          <ShieldAlertIcon aria-hidden="true" />
        )}
        <AlertTitle>
          {available
            ? "Service-role client available"
            : "Service-role client not configured"}
        </AlertTitle>
        <AlertDescription>
          {available
            ? "Cross-tenant administration is enabled. Sensitive actions require a reason and are written to the audit log."
            : "Set SUPABASE_SERVICE_ROLE_KEY in the server environment to enable cross-tenant administration. Until then, no platform-wide writes are possible."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Pending organisations
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {pendingOrgCount && pendingOrgCount.ok ? pendingOrgCount.data : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting approval or verification
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Accounts
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {userCount && userCount.ok ? userCount.data : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Visible to platform administration
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Service-role client
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {available ? "Ready" : "Off"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Required for cross-tenant writes
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Active subscriptions
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {stats ? stats.activeSubscriptions : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? `${stats.trialingSubscriptions} on trial` : "Awaiting data"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Suspended
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {stats ? stats.suspendedSubscriptions : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only workspaces
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Payments pending
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {stats ? stats.pendingPayments : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Initiated or awaiting verification
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Organisations
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {stats ? stats.organisations : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats ? `${stats.activeOrganisations} active` : "Awaiting data"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-teal">
            Support conversations
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand-strong">
            {stats ? stats.conversations : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Organisation-scoped threads
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.href} className="flex flex-col gap-3 p-4">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal"
            >
              <section.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading font-semibold text-brand-strong">
                {section.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href={section.href}>Open</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
