import type { Metadata } from "next";
import { MessageSquareIcon } from "lucide-react";

import { ModulePlaceholder } from "@/components/feedback/module-placeholder";

export const metadata: Metadata = {
  title: "Messages",
};

export default function MessagesPage() {
  return (
    <ModulePlaceholder
      eyebrow="Communication"
      title="Messages"
      description="Secure conversations between caregivers, providers and employers."
      icon={MessageSquareIcon}
      phase="a later phase"
      planned={[
        "Organisation-scoped conversations with read receipts",
        "Safeguarding-aware message retention and reporting",
        "Email and in-app notifications for new messages",
      ]}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Messages" },
      ]}
    />
  );
}
