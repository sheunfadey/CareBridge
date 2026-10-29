import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/module-placeholder";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Notification preferences",
};

export default function NotificationSettingsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Account"
      title="Notification preferences"
      description="Choose which updates you receive and where they are delivered."
      icon={BellIcon}
      phase="a later phase"
      planned={[
        "Per-category email and in-app preferences",
        "Quiet hours and digest frequency",
        "Mandatory safeguarding and payment notices that cannot be disabled",
      ]}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings", href: "/dashboard/settings" },
        { label: "Notifications" },
      ]}
    >
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/notifications">View notifications</Link>
      </Button>
    </ModulePlaceholder>
  );
}
