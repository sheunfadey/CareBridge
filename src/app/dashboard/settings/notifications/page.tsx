import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/features/account/components/notification-preferences-form";
import { emailDeliveryAvailable } from "@/lib/email/send";
import { getCurrentUser } from "@/server/auth/current-user";
import { getNotificationPreferences } from "@/server/account/queries";

export const metadata: Metadata = {
  title: "Notification preferences",
};

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard/settings/notifications");
  }

  const preferences = await getNotificationPreferences();
  const emailAvailable = emailDeliveryAvailable();

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Notification preferences"
        description="Choose which updates you receive and where they are delivered."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Notifications" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="space-y-4 p-4">
          <NotificationPreferencesForm
            initial={preferences}
            emailDeliveryAvailable={emailAvailable}
          />
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold text-brand-strong">
            Delivery status
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">In-app</dt>
              <dd className="font-medium text-brand-success">Available</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-right font-medium text-brand-strong">
                {emailAvailable ? "Available" : "Not configured yet"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">SMS</dt>
              <dd className="text-right font-medium text-brand-strong">
                Not available yet
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Preferences for unavailable channels are stored and used once that
            channel is enabled. Account and security messages are always sent
            where the service requires them.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/notifications">View notifications</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
