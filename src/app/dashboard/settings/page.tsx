import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings");
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Review your account details and manage where you work."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Profile
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Full name</dt>
              <dd className="font-medium text-brand-strong">
                {user.fullName ?? "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-brand-strong">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium capitalize text-brand-strong">
                {user.roles.map((role) => role.replaceAll("_", " ")).join(", ") ||
                  "Caregiver"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Profile editing and password changes are not available in the
            dashboard yet. Contact platform support if your details are wrong.
          </p>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Organisations
          </h2>
          {user.organisations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not a member of an organisation yet. You can create or join
              one from the organisation page.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {user.organisations.map((organisation) => (
                <li
                  key={organisation.organisationId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="font-medium text-brand-strong">
                    {organisation.organisationName}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {organisation.roles
                      .map((role) => role.replaceAll("_", " "))
                      .join(", ") || "Member"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/organisation">Manage organisations</Link>
          </Button>
        </Card>

        <Card className="space-y-3 p-4 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Review account, learning, internship and payment notifications in
            your notification centre.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/notifications">Open notifications</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
