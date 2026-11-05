"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/components/auth-ui";
import { formatDateTime } from "@/lib/format";
import {
  markConversationReadAction,
  sendMessageAction,
} from "@/features/messages/actions";
import type { ConversationDetail } from "@/server/messages/queries";

export function MessageThread({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void markConversationReadAction(conversation.id).then(() => {
      if (!cancelled) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [conversation.id, router]);

  const send = () => {
    setError(null);
    if (!body.trim()) {
      setError("Write a message before sending.");
      return;
    }

    startTransition(async () => {
      const result = await sendMessageAction({
        conversationId: conversation.id,
        body,
      });
      if (result.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="font-heading text-base font-semibold text-brand-navy">
          {conversation.subject}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {conversation.organisationName} ·{" "}
          {conversation.participants
            .map((participant) => participant.name)
            .join(", ")}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={
              message.mine
                ? "ml-auto max-w-[85%] rounded-lg bg-brand-teal/10 p-3"
                : "mr-auto max-w-[85%] rounded-lg bg-muted/60 p-3"
            }
          >
            <p className="text-xs font-medium text-brand-navy">
              {message.mine ? "You" : message.senderName}
              <span className="ml-2 font-normal text-muted-foreground">
                {formatDateTime(message.createdAt)}
              </span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy">
              {message.body}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t p-4">
        {error ? <FormAlert tone="error">{error}</FormAlert> : null}
        <Textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a reply..."
          maxLength={4000}
          aria-label="Message"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Messages are permanent and visible to everyone in this conversation.
          </p>
          <Button type="button" onClick={send} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SendIcon />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
