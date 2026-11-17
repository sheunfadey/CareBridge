import type { Metadata } from "next";

import { NotificationsScreen } from "@/features/notifications/components/notifications-screen";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function TrainerNotificationsPage() {
  return <NotificationsScreen homeHref="/trainer" homeLabel="Trainer home" />;
}
