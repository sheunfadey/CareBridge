import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ActivityIcon,
  ArrowUpRightIcon,
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

function AdminStat({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full p-3.5 transition group-hover:-translate-y-0.5 group-hover:ring-brand-teal/40">
        <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-brand-teal">
          {label}
        </p>
        <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-brand-strong sm:text-3xl">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </Card>
    </Link>
  );
}

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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AdminStat
          href="/dashboard/admin/organisations"
          label="Pending organisations"
          value={pendingOrgCount && pendingOrgCount.ok ? pendingOrgCount.data : "—"}
          hint="Awaiting approval or verification"
        />
        <AdminStat
          href="/dashboard/admin/users"
          label="Accounts"
          value={userCount && userCount.ok ? userCount.data : "—"}
          hint="Visible to platform administration"
        />
        <AdminStat
          href="/dashboard/admin/system"
          label="Service-role client"
          value={available ? "Ready" : "Off"}
          hint="Required for cross-tenant writes"
        />
        <AdminStat
          href="/dashboard/admin/subscriptions"
          label="Active subscriptions"
          value={stats ? stats.activeSubscriptions : "—"}
          hint={stats ? `${stats.trialingSubscriptions} on trial` : "Awaiting data"}
        />
        <AdminStat
          href="/dashboard/admin/subscriptions"
          label="Suspended"
          value={stats ? stats.suspendedSubscriptions : "—"}
          hint="Read-only workspaces"
        />
        <AdminStat
          href="/dashboard/admin/payments"
          label="Payments pending"
          value={stats ? stats.pendingPayments : "—"}
          hint="Initiated or awaiting verification"
        />
        <AdminStat
          href="/dashboard/admin/organisations"
          label="Organisations"
          value={stats ? stats.organisations : "—"}
          hint={stats ? `${stats.activeOrganisations} active` : "Awaiting data"}
        />
        <AdminStat
          href="/dashboard/messages"
          label="Support conversations"
          value={stats ? stats.conversations : "—"}
          hint="Organisation-scoped threads"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="flex h-full flex-col gap-2.5 p-3.5 transition group-hover:-translate-y-0.5 group-hover:ring-brand-teal/40">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-md bg-brand-sky text-brand-teal"
              >
                <section.icon className="size-4.5" />
              </span>
              <div>
                <p className="font-heading font-semibold text-brand-strong">
                  {section.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-brand-teal">
                Open
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
