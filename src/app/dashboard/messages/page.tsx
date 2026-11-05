import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquareIcon, PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  getConversation,
  listConversations,
  listMessageableMembers,
} from "@/server/messages/queries";
import { formatDateTime } from "@/lib/format";
import { NewConversationDialog } from "@/features/messages/components/new-conversation-dialog";
import { MessageThread } from "@/features/messages/components/message-thread";

export const metadata: Metadata = {
  title: "Messages",
};

type MessagesPageProps = {
  searchParams: Promise<{ conversation?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard%2Fmessages");
  }

  const { conversation: requestedConversation } = await searchParams;
  const [conversations, members] = await Promise.all([
    listConversations(user.id),
    listMessageableMembers(user),
  ]);

  const conversationId =
    requestedConversation ?? conversations[0]?.id ?? null;
  const conversation = conversationId
    ? await getConversation(conversationId, user.id)
    : null;

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Communication"
        title="Messages"
        description="Private conversations with active members of your organisations. Messages are permanent, organisation-scoped and visible only to the people in the conversation."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Messages" },
        ]}
        actions={
          <NewConversationDialog members={members}>
            <Button>
              <PlusIcon />
              New conversation
            </Button>
          </NewConversationDialog>
        }
      />

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b p-4">
            <h2 className="font-heading text-base font-semibold text-brand-strong">
              Conversations
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {conversations.length === 0
                ? "No conversations yet."
                : `${conversations.length} conversation${
                    conversations.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {conversations.length === 0 ? (
            <div className="p-5 text-center">
              <MessageSquareIcon className="mx-auto size-8 text-brand-teal" />
              <p className="mt-2 text-sm font-medium text-brand-strong">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start a conversation with a colleague in one of your
                organisations.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((item) => {
                const active = conversation?.id === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/messages?conversation=${item.id}`}
                      className={
                        active
                          ? "block bg-brand-teal/5 p-4"
                          : "block p-4 transition hover:bg-muted/50"
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-brand-strong">
                          {item.subject}
                        </p>
                        {item.unreadCount > 0 ? (
                          <Badge variant="default">
                            {item.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.organisationName}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {item.lastMessagePreview ?? "No messages yet."}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {item.participants
                          .filter((participant) => participant.userId !== user.id)
                          .map((participant) => participant.name)
                          .join(", ") || "Only you"}{" "}
                        · {formatDateTime(item.lastMessageAt)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="min-h-[420px] overflow-hidden p-0">
          {conversation ? (
            <MessageThread conversation={conversation} />
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <MessageSquareIcon className="size-10 text-brand-teal" />
              <p className="mt-3 font-heading text-base font-semibold text-brand-strong">
                Select a conversation
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a conversation from the list, or start a new one with a
                colleague in your organisation.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
