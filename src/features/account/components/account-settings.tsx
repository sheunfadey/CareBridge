import Link from "next/link";
import { redirect } from "next/navigation";

import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/features/account/components/password-form";
import { ProfileSettings } from "@/features/account/components/profile-settings";
import { switchPortalAction } from "@/features/portal/actions";
import {
  canUseTrainerWorkspace,
  getCurrentUser,
} from "@/server/auth/current-user";

type AccountSettingsProps = {
  basePath: "/dashboard" | "/trainer";
  homeLabel?: string;
  /** The trainer workspace has no organisation navigation of its own. */
  showOrganisations?: boolean;
};

export async function AccountSettings({
  basePath,
  homeLabel = "Dashboard",
  showOrganisations = true,
}: AccountSettingsProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`${basePath}/settings`)}`);
  }

  const isTrainerSurface = basePath === "/trainer";
  const trainerWorkspace = canUseTrainerWorkspace(user);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <PortalPageHeader
        tone="lavender"
        eyebrow={isTrainerSurface ? "Trainer workspace" : "Account"}
        title="Settings"
        description="Manage your profile, password and notification preferences."
        breadcrumbs={[{ label: homeLabel, href: basePath }, { label: "Settings" }]}
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
                <Link href={`${basePath}/settings/notifications`}>
                  Choose channels
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${basePath}/notifications`}>Open notifications</Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-4 lg:col-span-2">
          <div>
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              {isTrainerSurface ? "Personal portals" : "Portal"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTrainerSurface
                ? "Switch to your personal student or caregiver portal. Your trainer workspace and permissions stay as they are."
                : "Choose the home that matches what you are doing today. Your permissions and records do not change."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={switchPortalAction}>
              <input type="hidden" name="portal" value="student" />
              <Button
                type="submit"
                variant={
                  !isTrainerSurface && user.activePortal === "student"
                    ? "default"
                    : "outline"
                }
                disabled={!isTrainerSurface && user.activePortal === "student"}
              >
                Student portal
              </Button>
            </form>
            <form action={switchPortalAction}>
              <input type="hidden" name="portal" value="caregiver" />
              <Button
                type="submit"
                variant={
                  !isTrainerSurface && user.activePortal === "caregiver"
                    ? "default"
                    : "outline"
                }
                disabled={!isTrainerSurface && user.activePortal === "caregiver"}
              >
                Caregiver portal
              </Button>
            </form>
            {trainerWorkspace ? (
              isTrainerSurface ? (
                <Button type="button" disabled>
                  Trainer workspace
                </Button>
              ) : (
                <form action={switchPortalAction}>
                  <input type="hidden" name="portal" value="trainer" />
                  <Button type="submit" variant="outline">
                    Trainer workspace
                  </Button>
                </form>
              )
            ) : null}
          </div>
        </Card>

        {showOrganisations ? (
          <Card className="space-y-3 p-4 lg:col-span-2">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Organisations
            </h2>
            {user.organisations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are not a member of an organisation yet. You can create or
                join one from the organisation page.
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
        ) : null}
      </div>
    </div>
  );
}
