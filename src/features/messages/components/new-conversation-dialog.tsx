"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormAlert } from "@/features/auth/components/auth-ui";
import { startConversationAction } from "@/features/messages/actions";
import type { MessageableMember } from "@/server/messages/queries";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function NewConversationDialog({
  members,
  children,
}: {
  members: MessageableMember[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const organisations = Array.from(
    new Map(
      members.map((member) => [
        member.organisationId,
        member.organisationName,
      ]),
    ).entries(),
  ).map(([id, name]) => ({ id, name }));

  const [organisationId, setOrganisationId] = useState(
    organisations[0]?.id ?? "",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const available = members.filter(
    (member) => member.organisationId === organisationId,
  );

  const reset = () => {
    setSelected(new Set());
    setSubject("");
    setBody("");
    setError(null);
  };

  const toggle = (userId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const submit = () => {
    setError(null);
    if (!organisationId) {
      setError("Select an organisation.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one recipient.");
      return;
    }

    startTransition(async () => {
      const result = await startConversationAction({
        organisationId,
        participantIds: Array.from(selected),
        subject,
        body,
      });

      if (result.ok) {
        reset();
        setOpen(false);
        if (result.conversationId) {
          router.push(
            `/dashboard/messages?conversation=${result.conversationId}`,
          );
        }
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            Conversations are limited to active members of the same
            organisation. Messages cannot be edited or deleted after sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}

          <div className="space-y-2">
            <Label htmlFor="message-organisation">Organisation</Label>
            <select
              id="message-organisation"
              className={selectClass}
              value={organisationId}
              onChange={(event) => {
                setOrganisationId(event.target.value);
                setSelected(new Set());
              }}
            >
              {organisations.map((organisation) => (
                <option key={organisation.id} value={organisation.id}>
                  {organisation.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {available.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No other active members in this organisation.
                </p>
              ) : (
                available.map((member) => (
                  <label
                    key={member.userId}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={selected.has(member.userId)}
                      onCheckedChange={() => toggle(member.userId)}
                    />
                    <span>
                      <span className="font-medium text-brand-navy">
                        {member.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-subject">Subject</Label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-body">Message</Label>
            <Textarea
              id="message-body"
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SendIcon />
            )}
            Start conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
