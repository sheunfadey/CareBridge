"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormAlert } from "@/features/auth/components/auth-ui";
import {
  updateNotificationPreferencesAction,
  type AccountActionResult,
} from "@/features/account/actions";
import type { NotificationPreferences } from "@/server/account/queries";

function PreferenceRow({
  id,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </div>
  );
}

export function NotificationPreferencesForm({
  initial,
  emailDeliveryAvailable,
}: {
  initial: NotificationPreferences;
  emailDeliveryAvailable: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AccountActionResult | null>(null);
  const [values, setValues] = useState(initial);

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setResult(null);
  };

  const save = () => {
    setResult(null);
    startTransition(async () => {
      const outcome = await updateNotificationPreferencesAction(values);
      setResult(outcome);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <PreferenceRow
          id="in-app-notifications"
          title="In-app notifications"
          description="Notices in your notification centre. High-priority account, payment and care notices are always delivered."
          checked={values.inAppEnabled}
          onCheckedChange={(value) => update("inAppEnabled", value)}
        />
        <PreferenceRow
          id="email-notifications"
          title="Email notifications"
          description={
            emailDeliveryAvailable
              ? "Email updates about your account and activity."
              : "Email delivery is not switched on for this deployment yet. Your choice is saved for when it is."
          }
          checked={values.emailEnabled}
          onCheckedChange={(value) => update("emailEnabled", value)}
        />
        <PreferenceRow
          id="sms-notifications"
          title="SMS notifications"
          description="SMS delivery is not available yet. Your choice is saved for when it is enabled."
          checked={values.smsEnabled}
          onCheckedChange={(value) => update("smsEnabled", value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Account and security messages, such as password resets and payment
        receipts, are always sent where the law or the service requires them.
      </p>

      {result ? (
        <FormAlert tone={result.ok ? "success" : "error"}>
          {result.message}
        </FormAlert>
      ) : null}

      <Button type="button" onClick={save} disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
        Save preferences
      </Button>
    </div>
  );
}
