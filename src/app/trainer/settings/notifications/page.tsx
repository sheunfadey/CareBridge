import type { Metadata } from "next";

import { NotificationPreferencesScreen } from "@/features/account/components/notification-preferences-screen";

export const metadata: Metadata = {
  title: "Notification preferences",
};

export default function TrainerNotificationSettingsPage() {
  return (
    <NotificationPreferencesScreen
      basePath="/trainer"
      homeLabel="Dashboard"
    />
  );
}
