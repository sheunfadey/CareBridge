"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  refundPaymentAction,
  verifyPaymentAction,
} from "@/features/payments/actions";
import { formatMinorUnits } from "@/lib/money";

function useRun() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const run = (
    task: () => Promise<{
      ok: boolean;
      message: string;
      fieldErrors?: Record<string, string[]>;
    }>,
    onSuccess?: () => void,
  ) => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setSuccess(result.message);
        onSuccess?.();
        router.refresh();
      } else {
        setError(result.message);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return { run, isPending, error, success, fieldErrors };
}

export function VerifyPaymentButton({ reference }: { reference: string }) {
  const { run, isPending } = useRun();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => run(() => verifyPaymentAction(reference))}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCwIcon aria-hidden="true" />
      )}
      {isPending ? "Verifying..." : "Verify"}
    </Button>
  );
}

export function RefundPaymentDialog({
  reference,
  amountMinorUnits,
  refundedMinorUnits,
  currency,
}: {
  reference: string;
  amountMinorUnits: number;
  refundedMinorUnits: number;
  currency: string;
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    formatMinorUnits(amountMinorUnits - refundedMinorUnits),
  );
  const [reason, setReason] = useState("");

  const remaining = amountMinorUnits - refundedMinorUnits;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={remaining <= 0}>
          <RotateCcwIcon aria-hidden="true" />
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
          <DialogDescription>
            Request a refund for {reference}. The provider is called first; the
            ledger only changes when the provider confirms. Remaining refundable
            amount: {formatMinorUnits(remaining)} {currency}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error ? <FormAlert tone="error">{error}</FormAlert> : null}
          {success ? <FormAlert tone="success">{success}</FormAlert> : null}
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund amount</Label>
            <Input
              id="refund-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
            />
            <FormFieldError messages={fieldErrors.amount} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Why is this payment being refunded?"
            />
            <FormFieldError messages={fieldErrors.reason} />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(async () => {
                const result = await refundPaymentAction({
                  reference,
                  amount,
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Processing..." : "Request refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
