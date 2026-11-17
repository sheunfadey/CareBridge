import type { Metadata } from "next";

import { MessagesWorkspace } from "@/features/messages/components/messages-workspace";

export const metadata: Metadata = {
  title: "Messages",
};

export default function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  return <MessagesWorkspace searchParams={searchParams} basePath="/dashboard" />;
}
