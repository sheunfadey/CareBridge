"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/features/auth/components/auth-ui";
import { acceptInvitationAction } from "@/features/organisations/actions";

export function AcceptInvitationPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { ok: true; message?: string } | { ok: false; message: string } | null
  >(null);

  const onAccept = () => {
    setResult(null);
    startTransition(async () => {
      const outcome = await acceptInvitationAction(token);
      setResult(outcome);
      if (outcome.ok && outcome.redirectTo) {
        window.location.assign(outcome.redirectTo);
      }
    });
  };

  if (!token) {
    return (
      <Card className="space-y-4 p-6">
        <FormAlert tone="error">
          This invitation link is missing its token. Ask the organisation to
          resend it.
        </FormAlert>
        <Button variant="outline" asChild>
          <Link href="/dashboard/organisation">Back to organisations</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-5 p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-sky text-brand-teal">
          <MailCheckIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="font-heading text-lg font-semibold text-brand-strong">
            Organisation invitation
          </h1>
          <p className="text-sm text-muted-foreground">
            Accept to join this workspace. Your access is limited to the role the
            organisation assigned you.
          </p>
        </div>
      </div>

      {result && !result.ok ? (
        <FormAlert tone="error">{result.message}</FormAlert>
      ) : null}
      {result?.ok ? (
        <FormAlert tone="success">
          {result.message ?? "Invitation accepted."}
        </FormAlert>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={onAccept} disabled={isPending}>
          {isPending ? "Accepting…" : "Accept invitation"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/organisation">Not now</Link>
        </Button>
      </div>
    </Card>
  );
}
