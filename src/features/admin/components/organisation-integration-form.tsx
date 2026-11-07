"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { saveOrganisationIntegrationAction } from "@/features/admin/organisation-integration-actions";
import {
  organisationIntegrationKindLabels,
  type OrganisationIntegrationInput,
} from "@/lib/validation/organisation";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type IntegrationInitial = {
  provider: string;
  mode: "sandbox" | "live" | "";
  publicKey: string;
  senderId: string;
  senderName: string;
  config: Record<string, unknown>;
  isEnabled: boolean;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
};

export function OrganisationIntegrationForm({
  organisationId,
  kind,
  initial,
}: {
  organisationId: string;
  kind: OrganisationIntegrationInput["kind"];
  initial: IntegrationInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [values, setValues] = useState({
    provider: initial.provider,
    mode: initial.mode,
    publicKey: initial.publicKey,
    secretKey: "",
    webhookSecret: "",
    senderId: initial.senderId,
    senderName: initial.senderName,
    configText:
      Object.keys(initial.config).length > 0
        ? JSON.stringify(initial.config, null, 2)
        : "",
    isEnabled: initial.isEnabled,
  });

  const set = (key: keyof typeof values, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await saveOrganisationIntegrationAction({
        organisationId,
        kind,
        ...values,
      });
      setResult(outcome);
      if (outcome.ok) {
        setValues((current) => ({
          ...current,
          secretKey: "",
          webhookSecret: "",
        }));
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading text-sm font-semibold text-brand-strong">
            {organisationIntegrationKindLabels[kind]}
          </p>
          <p className="text-xs text-muted-foreground">
            {initial.hasSecret ? "Secret configured" : "No secret yet"}
            {kind === "paystack"
              ? initial.hasWebhookSecret
                ? " · webhook ready"
                : " · webhook missing"
              : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={values.isEnabled}
            onCheckedChange={(checked) => set("isEnabled", checked === true)}
          />
          Enabled
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-provider`}>Provider</Label>
          <Input
            id={`${kind}-provider`}
            value={values.provider}
            onChange={(event) => set("provider", event.target.value)}
            placeholder={
              kind === "paystack"
                ? "paystack"
                : kind === "sms"
                  ? "Termii, Twilio..."
                  : kind === "email"
                    ? "resend, smtp..."
                    : "Provider or service name"
            }
          />
        </div>

        {kind === "paystack" ? (
          <div className="space-y-1.5">
            <Label htmlFor="integration-mode">Mode</Label>
            <select
              id="integration-mode"
              className={selectClass}
              value={values.mode}
              onChange={(event) => set("mode", event.target.value)}
            >
              <option value="sandbox">Sandbox / test</option>
              <option value="live">Live</option>
            </select>
          </div>
        ) : null}

        {kind === "email" || kind === "sms" ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${kind}-sender`}>
              {kind === "email" ? "From address" : "Sender ID"}
            </Label>
            <Input
              id={`${kind}-sender`}
              value={values.senderId}
              onChange={(event) => set("senderId", event.target.value)}
              placeholder={
                kind === "email"
                  ? "training@example.com"
                  : "CAREBRIDGE"
              }
            />
          </div>
        ) : null}

        {kind === "email" ? (
          <div className="space-y-1.5">
            <Label htmlFor="email-sender-name">From name</Label>
            <Input
              id="email-sender-name"
              value={values.senderName}
              onChange={(event) => set("senderName", event.target.value)}
              placeholder="CareBridge Training"
            />
          </div>
        ) : null}
      </div>

      {kind === "paystack" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="integration-public-key">Public key</Label>
            <Input
              id="integration-public-key"
              value={values.publicKey}
              onChange={(event) => set("publicKey", event.target.value)}
              placeholder="pk_test_..."
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="integration-webhook">Webhook secret</Label>
            <PasswordInput
              id="integration-webhook"
              value={values.webhookSecret}
              onChange={(event) => set("webhookSecret", event.target.value)}
              placeholder="Leave blank to keep existing"
              autoComplete="new-password"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={`${kind}-secret`}>
          {kind === "paystack"
            ? "Secret key"
            : kind === "custom_api"
              ? "API key / token"
              : "API key"}
        </Label>
        <PasswordInput
          id={`${kind}-secret`}
          value={values.secretKey}
          onChange={(event) => set("secretKey", event.target.value)}
          placeholder="Leave blank to keep existing"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${kind}-config`}>
          Additional configuration (JSON)
        </Label>
        <Textarea
          id={`${kind}-config`}
          rows={3}
          value={values.configText}
          onChange={(event) => set("configText", event.target.value)}
          placeholder={
            kind === "custom_api"
              ? '{"base_url":"https://api.example.com"}'
              : '{"region":"ng"}'
          }
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Credentials are stored server-side and never returned to the browser.
        Leave secret fields blank to keep existing values.
      </p>

      {result ? (
        <p
          className={
            result.ok
              ? "text-sm text-brand-success"
              : "text-sm text-destructive"
          }
        >
          {result.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
        Save integration
      </Button>
    </form>
  );
}
