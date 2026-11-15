import type { Metadata } from "next";

import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { listNotifications } from "@/server/notifications/service";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const notifications = await listNotifications(50);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <PortalPageHeader tone="sky"
        eyebrow="Account"
        title="Notifications"
        description="In-app notifications for account, learning, employment, referral and payment events."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
      />

      {notifications.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No notifications yet"
            description="When something happens on your account — from enrolment to payments — it will appear here."
          />
        </Card>
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </div>
  );
}
