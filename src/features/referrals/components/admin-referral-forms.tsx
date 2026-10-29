"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BanIcon,
  CheckIcon,
  Loader2Icon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  reviewCommissionAction,
  reviewPayoutAction,
  reviewReferralPartnerAction,
  saveReferralPolicyAction,
  sendPayoutTransferAction,
  verifyPayoutAccountAction,
} from "@/features/referrals/actions";
import { formatMinorUnits } from "@/lib/money";
import {
  PAYMENT_PURPOSES,
  paymentPurposeLabels,
  referralCommissionTypeLabels,
} from "@/lib/validation/payments";
import type { ReferralPolicySummary } from "@/server/referrals/queries";
import type { ReferralPartnerStatus } from "@/types/database";

type ActionResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function useRun() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const run = (task: () => Promise<ActionResult>, onSuccess?: () => void) => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setSuccess(result.message ?? "Saved.");
        onSuccess?.();
        router.refresh();
      } else {
        setError(result.message ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return { run, isPending, error, success, fieldErrors };
}

function Feedback({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) return <FormAlert tone="error">{error}</FormAlert>;
  if (success) return <FormAlert tone="success">{success}</FormAlert>;
  return null;
}

function ReasonField({
  id,
  value,
  onChange,
  label = "Reason or notes (optional)",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Recorded in the audit log"
        rows={3}
      />
    </div>
  );
}

export function PartnerReviewActions({
  partnerId,
  partnerName,
  status,
}: {
  partnerId: string;
  partnerName: string;
  status: ReferralPartnerStatus;
}) {
  const { run, isPending, error, fieldErrors } = useRun();
  const [reason, setReason] = useState("");

  const canApprove = status !== "approved";
  const canReject = status === "pending" || status === "approved";
  const canSuspend = status === "approved";

  return (
    <div className="space-y-2">
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      <FormFieldError messages={fieldErrors.reason} />
      <div className="flex flex-wrap justify-end gap-2">
        {canApprove ? (
          <DecisionDialog
            triggerLabel="Approve"
            title={`Approve ${partnerName}?`}
            description="The partner can share a referral link and earn commissions under the published policy."
            confirmLabel="Approve"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewReferralPartnerAction({
                  partnerId,
                  decision: "approve",
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
        {canReject ? (
          <DecisionDialog
            triggerLabel="Reject"
            title={`Reject ${partnerName}?`}
            description="The application will be rejected. A reason is strongly recommended."
            confirmLabel="Reject"
            variant="destructive"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewReferralPartnerAction({
                  partnerId,
                  decision: "reject",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
        {canSuspend ? (
          <DecisionDialog
            triggerLabel="Suspend"
            title={`Suspend ${partnerName}?`}
            description="The partner keeps their history but cannot request payouts while suspended."
            confirmLabel="Suspend"
            variant="destructive"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewReferralPartnerAction({
                  partnerId,
                  decision: "suspend",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function DecisionDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
  reason,
  setReason,
  variant = "outline",
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  pending: boolean;
  reason: string;
  setReason: (value: string) => void;
  variant?: "outline" | "destructive";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" disabled={pending}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ReasonField id="review-reason" value={reason} onChange={setReason} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={pending}
          >
            {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            {pending ? "Working..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CommissionReviewActions({
  commissionId,
  status,
}: {
  commissionId: string;
  status: string;
}) {
  const { run, isPending, error } = useRun();
  const [reason, setReason] = useState("");
  const canApprove = status === "eligible";
  const canReject = status === "pending" || status === "eligible";

  return (
    <div className="space-y-2">
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      <div className="flex flex-wrap justify-end gap-2">
        {canApprove ? (
          <DecisionDialog
            triggerLabel="Approve"
            title="Approve this commission?"
            description="The amount becomes part of the partner's approved balance and can be included in a payout request."
            confirmLabel="Approve"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewCommissionAction({
                  commissionId,
                  decision: "approve",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
        {canReject ? (
          <DecisionDialog
            triggerLabel="Reject"
            title="Reject this commission?"
            description="The ledger keeps the entry and records the rejection. Amounts are never deleted."
            confirmLabel="Reject"
            variant="destructive"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewCommissionAction({
                  commissionId,
                  decision: "reject",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

export function VerifyPayoutAccountButton({
  partnerId,
  verified,
}: {
  partnerId: string;
  verified: boolean;
}) {
  const { run, isPending, error } = useRun();

  return (
    <div className="space-y-1">
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          run(() =>
            verifyPayoutAccountAction({ partnerId, verified: !verified }),
          )
        }
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : (
          <ShieldCheckIcon aria-hidden="true" />
        )}
        {verified ? "Remove verification" : "Verify account"}
      </Button>
    </div>
  );
}

export function PayoutReviewActions({
  payoutId,
  status,
  accountVerified,
  transfersEnabled,
}: {
  payoutId: string;
  status: string;
  accountVerified: boolean;
  transfersEnabled: boolean;
}) {
  const { run, isPending, error, success } = useRun();
  const [reason, setReason] = useState("");
  const canReview = status === "pending";
  const canSend = status === "approved";

  return (
    <div className="space-y-2">
      <Feedback error={error} success={success} />
      <div className="flex flex-wrap justify-end gap-2">
        {canReview ? (
          <DecisionDialog
            triggerLabel="Approve"
            title="Approve this payout request?"
            description="Approval does not move money. The transfer is a separate step and requires verified beneficiary details."
            confirmLabel="Approve"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewPayoutAction({
                  payoutId,
                  decision: "approve",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
        {canReview ? (
          <DecisionDialog
            triggerLabel="Reject"
            title="Reject this payout request?"
            description="The held commissions return to the partner's approved balance."
            confirmLabel="Reject"
            variant="destructive"
            pending={isPending}
            reason={reason}
            setReason={setReason}
            onConfirm={() =>
              run(async () => {
                const result = await reviewPayoutAction({
                  payoutId,
                  decision: "reject",
                  reason,
                });
                if (result.ok) setReason("");
                return result;
              })
            }
          />
        ) : null}
        {canSend ? (
          <Button
            type="button"
            size="sm"
            disabled={isPending || !accountVerified || !transfersEnabled}
            onClick={() => run(() => sendPayoutTransferAction(payoutId))}
            title={
              !transfersEnabled
                ? "Provider transfers are disabled until PAYSTACK_TRANSFERS_ENABLED=true."
                : !accountVerified
                  ? "The beneficiary account must be verified first."
                  : undefined
            }
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <SendIcon aria-hidden="true" />
            )}
            {isPending ? "Sending..." : "Send transfer"}
          </Button>
        ) : null}
      </div>
      {status === "approved" && !transfersEnabled ? (
        <p className="text-right text-xs text-muted-foreground">
          Transfers are disabled until the payout arrangement is approved and
          PAYSTACK_TRANSFERS_ENABLED=true.
        </p>
      ) : null}
    </div>
  );
}

export function PolicyDialog({
  policy,
  triggerLabel,
}: {
  policy?: ReferralPolicySummary;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={policy ? "outline" : "default"}>
          {policy ? <BanIcon aria-hidden="true" /> : <CheckIcon aria-hidden="true" />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <PolicyForm
          policy={policy}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PolicyForm({
  policy,
  onSuccess,
  onCancel,
}: {
  policy?: ReferralPolicySummary;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { run, isPending, error, fieldErrors } = useRun();
  const [name, setName] = useState(policy?.name ?? "");
  const [description, setDescription] = useState(policy?.description ?? "");
  const [commissionType, setCommissionType] = useState<"percentage" | "fixed">(
    policy?.commissionType ?? "percentage",
  );
  const [percentage, setPercentage] = useState(
    policy?.percentageBps != null ? formatMinorUnits(policy.percentageBps) : "",
  );
  const [fixedAmount, setFixedAmount] = useState(
    policy?.fixedAmountMinorUnits != null
      ? formatMinorUnits(policy.fixedAmountMinorUnits)
      : "",
  );
  const [purposes, setPurposes] = useState<string[]>(
    policy?.eligiblePurposes ?? ["course_purchase", "training_fee"],
  );
  const [attributionWindowDays, setAttributionWindowDays] = useState(
    String(policy?.attributionWindowDays ?? 30),
  );
  const [payoutDelayDays, setPayoutDelayDays] = useState(
    String(policy?.payoutDelayDays ?? 14),
  );
  const [minimumPayout, setMinimumPayout] = useState(
    policy ? formatMinorUnits(policy.minimumPayoutMinorUnits) : "0",
  );
  const [refundPolicy, setRefundPolicy] = useState(policy?.refundPolicy ?? "");
  const [isActive, setIsActive] = useState(policy?.isActive ?? true);

  const togglePurpose = (purpose: string) => {
    setPurposes((current) =>
      current.includes(purpose)
        ? current.filter((value) => value !== purpose)
        : [...current, purpose],
    );
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(
      () =>
        saveReferralPolicyAction({
          policyId: policy?.id,
          name,
          description,
          commissionType,
          percentage,
          fixedAmount,
          eligiblePurposes: purposes,
          attributionWindowDays: Number(attributionWindowDays),
          payoutDelayDays: Number(payoutDelayDays),
          minimumPayout,
          refundPolicy,
          isActive,
        }),
      onSuccess,
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-brand-navy">
          {policy ? "Edit commission policy" : "Publish a commission policy"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Policies are published, not hard-coded. Payments are only attributed
          and commissioned when an active policy covers the payment purpose.
        </p>
      </div>

      <Feedback error={error} success={null} />

      <div className="space-y-2">
        <Label htmlFor="policy-name">Policy name</Label>
        <Input
          id="policy-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <FormFieldError messages={fieldErrors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-description">Description (optional)</Label>
        <Textarea
          id="policy-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
        />
        <FormFieldError messages={fieldErrors.description} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="policy-type">Commission type</Label>
          <select
            id="policy-type"
            value={commissionType}
            onChange={(event) =>
              setCommissionType(event.target.value as "percentage" | "fixed")
            }
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="percentage">
              {referralCommissionTypeLabels.percentage}
            </option>
            <option value="fixed">{referralCommissionTypeLabels.fixed}</option>
          </select>
          <FormFieldError messages={fieldErrors.commissionType} />
        </div>
        {commissionType === "percentage" ? (
          <div className="space-y-2">
            <Label htmlFor="policy-percentage">Percentage</Label>
            <Input
              id="policy-percentage"
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
              inputMode="decimal"
              placeholder="e.g. 10"
            />
            <FormFieldError messages={fieldErrors.percentage} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="policy-fixed">Fixed amount (NGN)</Label>
            <Input
              id="policy-fixed"
              value={fixedAmount}
              onChange={(event) => setFixedAmount(event.target.value)}
              inputMode="decimal"
              placeholder="e.g. 2500"
            />
            <FormFieldError messages={fieldErrors.fixedAmount} />
          </div>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brand-navy">
          Eligible payment purposes
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_PURPOSES.map((purpose) => (
            <label
              key={purpose}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
            >
              <input
                type="checkbox"
                checked={purposes.includes(purpose)}
                onChange={() => togglePurpose(purpose)}
                className="size-4 rounded border-input"
              />
              {paymentPurposeLabels[purpose]}
            </label>
          ))}
        </div>
        <FormFieldError messages={fieldErrors.eligiblePurposes} />
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="policy-window">Attribution window (days)</Label>
          <Input
            id="policy-window"
            value={attributionWindowDays}
            onChange={(event) => setAttributionWindowDays(event.target.value)}
            inputMode="numeric"
          />
          <FormFieldError messages={fieldErrors.attributionWindowDays} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-delay">Payout delay (days)</Label>
          <Input
            id="policy-delay"
            value={payoutDelayDays}
            onChange={(event) => setPayoutDelayDays(event.target.value)}
            inputMode="numeric"
          />
          <FormFieldError messages={fieldErrors.payoutDelayDays} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="policy-minimum">Minimum payout (NGN)</Label>
          <Input
            id="policy-minimum"
            value={minimumPayout}
            onChange={(event) => setMinimumPayout(event.target.value)}
            inputMode="decimal"
          />
          <FormFieldError messages={fieldErrors.minimumPayout} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-refund">Refund policy (optional)</Label>
        <Textarea
          id="policy-refund"
          value={refundPolicy}
          onChange={(event) => setRefundPolicy(event.target.value)}
          rows={2}
          placeholder="How refunds affect commission eligibility"
        />
        <FormFieldError messages={fieldErrors.refundPolicy} />
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-navy">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="size-4 rounded border-input"
        />
        Active and published to partners
      </label>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
          {isPending ? "Saving..." : policy ? "Save policy" : "Publish policy"}
        </Button>
      </div>
    </form>
  );
}
