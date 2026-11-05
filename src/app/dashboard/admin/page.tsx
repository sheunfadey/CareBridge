import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2Icon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/current-user";
import { adminService } from "@/server/admin/admin-service";

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

  const [pendingOrgCount, userCount] = available
    ? await Promise.all([
        adminService.countPendingOrganisations(),
        adminService.countProfiles(),
      ])
    : [null, null];

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
