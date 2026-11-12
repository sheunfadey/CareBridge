import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileSettings } from "@/features/account/components/profile-settings";
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
        description="Manage your profile, password and notification preferences."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4 lg:col-span-2">
          <div>
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Profile
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep your name and contact details up to date so organisations can
              reach you.
            </p>
          </div>
          <ProfileSettings
            initial={{
              fullName: user.fullName ?? "",
              phone: user.phone ?? "",
              state: user.state ?? "",
              city: user.city ?? "",
              email: user.email,
              avatarUrl: user.avatarUrl,
            }}
          />
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Account
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="max-w-[60%] break-all text-right font-medium text-brand-strong">
                {user.email}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="text-right font-medium capitalize text-brand-strong">
                {user.roles.map((role) => role.replaceAll("_", " ")).join(", ") ||
                  "Caregiver"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Time zone</dt>
              <dd className="font-medium text-brand-strong">{user.timezone}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Password
            </h2>
            <p className="text-sm text-muted-foreground">
              Confirm your current password to choose a new one.
            </p>
          </div>
          <PasswordForm />
        </Card>

        <Card className="space-y-3 p-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-brand-strong">
                Notification preferences
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose which channels we may use, then review past notices in
                your notification centre.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/notifications">
                  Choose channels
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notifications">Open notifications</Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-4 lg:col-span-2">
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
      </div>
    </div>
  );
}
