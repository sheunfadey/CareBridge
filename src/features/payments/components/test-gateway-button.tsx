"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, PlugZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { testPaymentGatewayAction } from "@/features/payments/actions";

export function TestPaymentGatewayButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  const test = () => {
    startTransition(async () => {
      setResult(await testPaymentGatewayAction());
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" onClick={test} disabled={isPending}>
        {isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <PlugZapIcon />
        )}
        Test Paystack connection
      </Button>
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
    </div>
  );
}
