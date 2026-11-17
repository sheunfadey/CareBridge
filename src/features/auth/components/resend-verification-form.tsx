"use client";

import { useState, useTransition, type FormEvent } from "react";
import { MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormAlert,
  FormFieldError,
} from "@/features/auth/components/auth-ui";
import {
  resendVerificationAction,
  type ActionResult,
} from "@/features/auth/actions";

export function ResendVerificationForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      setResult(await resendVerificationAction({ email }));
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {result ? (
        <FormAlert tone={result.ok ? "success" : "error"}>
          {result.message}
        </FormAlert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="resend-email">Email address</Label>
        <Input
          id="resend-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <FormFieldError
          messages={
            result && !result.ok ? result.fieldErrors?.email : undefined
          }
        />
      </div>

      <Button type="submit" variant="outline" className="w-full" disabled={isPending}>
        <MailIcon />
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
