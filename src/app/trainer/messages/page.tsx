import type { Metadata } from "next";

import { MessagesWorkspace } from "@/features/messages/components/messages-workspace";

export const metadata: Metadata = {
  title: "Messages",
};

export default function TrainerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  return (
    <MessagesWorkspace
      searchParams={searchParams}
      basePath="/trainer"
      eyebrow="Trainer workspace"
    />
  );
}
