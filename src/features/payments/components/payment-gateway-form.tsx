"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { savePaymentGatewaySettingsAction } from "@/features/payments/actions";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PaymentGatewayForm({
  mode,
  publicKey,
}: {
  mode: "sandbox" | "live";
  publicKey: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [values, setValues] = useState({
    mode,
    publicKey,
    secretKey: "",
    webhookSecret: "",
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      const outcome = await savePaymentGatewaySettingsAction(values);
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
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gateway-mode">Mode</Label>
        <select
          id="gateway-mode"
          className={selectClass}
          value={values.mode}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              mode: event.target.value as "sandbox" | "live",
            }))
          }
        >
          <option value="sandbox">Sandbox / test</option>
          <option value="live">Live</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gateway-public-key">Public key</Label>
        <Input
          id="gateway-public-key"
          value={values.publicKey}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              publicKey: event.target.value,
            }))
          }
          placeholder="pk_test_..."
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gateway-secret-key">Secret key</Label>
        <PasswordInput
          id="gateway-secret-key"
          value={values.secretKey}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              secretKey: event.target.value,
            }))
          }
          placeholder="Leave blank to keep the current secret"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gateway-webhook-secret">Webhook secret</Label>
        <PasswordInput
          id="gateway-webhook-secret"
          value={values.webhookSecret}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              webhookSecret: event.target.value,
            }))
          }
          placeholder="Leave blank to use the secret key"
          autoComplete="new-password"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Keys are stored server-side and are never returned to the browser after
        saving. Leave the secret fields blank to keep the existing values.
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

      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
        Save Paystack settings
      </Button>
    </form>
  );
}
