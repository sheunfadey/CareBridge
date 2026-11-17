import { PortalPageHeader } from "@/features/portal/components/portal-page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { listNotifications } from "@/server/notifications/service";

/**
 * Notification centre shared by the personal portals and the trainer workspace.
 */
export async function NotificationsScreen({
  homeHref = "/dashboard",
  homeLabel = "Dashboard",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  const notifications = await listNotifications(50);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <PortalPageHeader
        tone="sky"
        eyebrow="Account"
        title="Notifications"
        description="In-app notifications for account, learning, employment, referral and payment events."
        breadcrumbs={[{ label: homeLabel, href: homeHref }, { label: "Notifications" }]}
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
