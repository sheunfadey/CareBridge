"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon, HandCoinsIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormFieldError } from "@/features/auth/components/auth-ui";
import {
  applyReferralPartnerAction,
  requestReferralPayoutAction,
  savePayoutAccountAction,
} from "@/features/referrals/actions";
import { formatMoney } from "@/lib/format";
import type {
  PayoutAccountSummary,
  ReferralBalance,
} from "@/server/referrals/queries";

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

export function ReferralApplicationForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [displayName, setDisplayName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(() =>
      applyReferralPartnerAction({
        displayName,
        phone,
      }),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      <div className="space-y-2">
        <Label htmlFor="referral-name">Name to show on your referrals</Label>
        <Input
          id="referral-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          autoComplete="name"
          required
        />
        <FormFieldError messages={fieldErrors.displayName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referral-phone">Phone number (optional)</Label>
        <Input
          id="referral-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          inputMode="tel"
        />
        <FormFieldError messages={fieldErrors.phone} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
        {isPending ? "Submitting..." : "Apply to the programme"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Finance reviews every application. Your link only becomes active once
        your partner account is approved.
      </p>
    </form>
  );
}

export function ReferralLinkCard({
  code,
  baseUrl,
}: {
  code: string;
  baseUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${baseUrl.replace(/\/$/, "")}/r/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="break-all rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-brand-navy">
        {link}
      </p>
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? (
          <CheckIcon aria-hidden="true" />
        ) : (
          <CopyIcon aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy referral link"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Share this link with people you refer. Attribution lasts for the
        window stated in the published policy.
      </p>
    </div>
  );
}

export function PayoutAccountForm({
  account,
}: {
  account: PayoutAccountSummary | null;
}) {
  const { run, isPending, error, success, fieldErrors } = useRun();
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [bankCode, setBankCode] = useState(account?.bankCode ?? "");
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(() =>
      savePayoutAccountAction({
        bankName,
        bankCode,
        accountName,
        accountNumber,
      }),
      () => setAccountNumber(""),
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Feedback error={error} success={success} />
      {account ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Current account: {account.accountName} ·{" "}
          {account.bankName ?? account.bankCode} ·{" "}
          {account.accountNumberMasked} ·{" "}
          {account.verifiedAt ? "verified" : "not verified"}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payout-bank-name">Bank name</Label>
          <Input
            id="payout-bank-name"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
            required
          />
          <FormFieldError messages={fieldErrors.bankName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payout-bank-code">Bank code</Label>
          <Input
            id="payout-bank-code"
            value={bankCode}
            onChange={(event) => setBankCode(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 058"
            required
          />
          <FormFieldError messages={fieldErrors.bankCode} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="payout-account-name">Account name</Label>
        <Input
          id="payout-account-name"
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          required
        />
        <FormFieldError messages={fieldErrors.accountName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payout-account-number">Account number</Label>
        <Input
          id="payout-account-number"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          inputMode="numeric"
          placeholder={account ? "Enter the number again to replace it" : undefined}
          required
        />
        <FormFieldError messages={fieldErrors.accountNumber} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
        {isPending ? "Saving..." : account ? "Replace payout details" : "Save payout details"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Changing these details removes any previous verification. Finance must
        verify the account before a payout can be requested.
      </p>
    </form>
  );
}

export function RequestPayoutCard({
  balance,
  account,
  minimumPayoutMinorUnits,
  currency,
}: {
  balance: ReferralBalance;
  account: PayoutAccountSummary | null;
  minimumPayoutMinorUnits: number;
  currency: string;
}) {
  const { run, isPending, error, success } = useRun();
  const canRequest =
    Boolean(account?.verifiedAt) &&
    balance.approvedMinorUnits > 0 &&
    balance.approvedMinorUnits >= minimumPayoutMinorUnits;

  const reason = !account?.verifiedAt
    ? "Finance must verify your payout details first."
    : balance.approvedMinorUnits <= 0
      ? "You have no approved commissions yet."
      : balance.approvedMinorUnits < minimumPayoutMinorUnits
        ? `The minimum payout is ${formatMoney(minimumPayoutMinorUnits, currency)}.`
        : null;

  return (
    <div className="space-y-3">
      <Feedback error={error} success={success} />
      <p className="text-sm text-muted-foreground">
        Available to request:{" "}
        <span className="font-semibold text-brand-navy">
          {formatMoney(balance.approvedMinorUnits, currency)}
        </span>
        {minimumPayoutMinorUnits > 0
          ? ` · minimum ${formatMoney(minimumPayoutMinorUnits, currency)}`
          : null}
      </p>
      <Button
        type="button"
        disabled={isPending || !canRequest}
        onClick={() => run(() => requestReferralPayoutAction())}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : (
          <HandCoinsIcon aria-hidden="true" />
        )}
        {isPending ? "Requesting..." : "Request payout"}
      </Button>
      {reason ? <p className="text-xs text-muted-foreground">{reason}</p> : null}
      <p className="text-xs text-muted-foreground">
        A payout request holds your approved commissions until finance reviews
        it. Transfers are only sent after approval.
      </p>
    </div>
  );
}
