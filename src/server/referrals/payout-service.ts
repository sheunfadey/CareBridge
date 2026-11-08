import "server-only";

import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient } from "@/lib/supabase/admin";

export type PayoutTransferResult = {
  ok: boolean;
  message: string;
};

/**
 * Starts or reconciles a provider transfer for an approved payout request.
 *
 * Safety:
 *  - transfers must be explicitly enabled in the environment;
 *  - the beneficiary must have been verified by finance;
 *  - the provider retrieval code is reused so retries cannot create a second
 *    recipient;
 *  - an existing provider reference is verified before a new transfer is sent,
 *    avoiding duplicate payments after an ambiguous network failure.
 */
export async function attemptPayoutTransfer(
  payoutId: string,
): Promise<PayoutTransferResult> {
  const provider = await getPaymentProvider();
  if (!provider.configured) {
    return { ok: false, message: "Payments are not configured on this server." };
  }
  if (!provider.transfersEnabled) {
    return {
      ok: false,
      message:
        "Transfers are disabled. Approve the payout arrangement and set PAYSTACK_TRANSFERS_ENABLED=true before sending money.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Payout processing is unavailable." };
  }
  const client = admin;

  const { data: payout } = await admin
    .from("referral_payout_requests")
    .select(
      "id, partner_id, amount_minor_units, currency, status, provider_transfer_reference",
    )
    .eq("id", payoutId)
    .maybeSingle();

  if (!payout) return { ok: false, message: "Payout request not found." };
  if (payout.status !== "approved") {
    return {
      ok: false,
      message: "Only an approved payout can be sent to the provider.",
    };
  }

  const [{ data: partner }, { data: account }] = await Promise.all([
    admin
      .from("referral_partners")
      .select("id, user_id, display_name, status")
      .eq("id", payout.partner_id)
      .maybeSingle(),
    admin
      .from("referral_payout_accounts")
      .select(
        "id, bank_code, bank_name, account_name, account_number, provider_recipient_code, verified_at",
      )
      .eq("partner_id", payout.partner_id)
      .maybeSingle(),
  ]);

  if (!partner || partner.status !== "approved") {
    return { ok: false, message: "The referral partner is no longer approved." };
  }
  if (!account || !account.verified_at) {
    return {
      ok: false,
      message: "The beneficiary account has not been verified by finance.",
    };
  }

  const transferReference =
    payout.provider_transfer_reference ??
    `cbp_${payout.id.replaceAll("-", "").slice(0, 32)}`;

  async function verifyExisting(): Promise<PayoutTransferResult | null> {
    try {
      const verified = await provider.verifyTransfer(transferReference);
      if (verified.status === "successful") {
        const { error } = await client.rpc("record_referral_payout_transfer", {
          p_payout: payout!.id,
          p_status: "paid",
          p_provider_reference: verified.providerReference,
          p_reason: undefined,
        });
        if (error) throw new Error(error.message);
        return { ok: true, message: "Transfer confirmed by the provider." };
      }
      if (verified.status === "failed") {
        const { error } = await client.rpc("record_referral_payout_transfer", {
          p_payout: payout!.id,
          p_status: "failed",
          p_provider_reference: verified.providerReference,
          p_reason: "Provider reported a failed transfer",
        });
        if (error) throw new Error(error.message);
        return { ok: false, message: "The provider reported a failed transfer." };
      }
      return {
        ok: true,
        message: "The transfer is still processing at the provider.",
      };
    } catch {
      return null;
    }
  }

  if (payout.provider_transfer_reference) {
    const existing = await verifyExisting();
    if (existing) return existing;
  }

  try {
    let recipientCode = account.provider_recipient_code;

    if (!recipientCode) {
      const recipient = await provider.createTransferRecipient({
        name: account.account_name,
        accountNumber: account.account_number,
        bankCode: account.bank_code,
        currency: payout.currency,
      });
      recipientCode = recipient.recipientCode;

      await admin
        .from("referral_payout_accounts")
        .update({ provider_recipient_code: recipientCode })
        .eq("id", account.id);
    }

    await admin
      .from("referral_payout_requests")
      .update({ provider_transfer_reference: transferReference })
      .eq("id", payout.id)
      .eq("status", "approved");

    const transfer = await provider.initiateTransfer({
      amountMinorUnits: Number(payout.amount_minor_units),
      recipientCode,
      reason: `HillCrest referral payout ${payout.id.slice(0, 8)}`,
      reference: transferReference,
    });

    if (transfer.status === "successful") {
      const { error } = await client.rpc("record_referral_payout_transfer", {
        p_payout: payout.id,
        p_status: "paid",
        p_provider_reference: transfer.providerReference,
        p_reason: undefined,
      });
      if (error) throw new Error(error.message);
      return { ok: true, message: "Payout sent and confirmed by the provider." };
    }

    if (transfer.status === "failed" || transfer.status === "reversed") {
      const { error } = await client.rpc("record_referral_payout_transfer", {
        p_payout: payout.id,
        p_status: "failed",
        p_provider_reference: transfer.providerReference,
        p_reason: "Provider rejected the transfer",
      });
      if (error) throw new Error(error.message);
      return { ok: false, message: "The provider rejected the transfer." };
    }

    const { error } = await client.rpc("record_referral_payout_transfer", {
      p_payout: payout.id,
      p_status: "processing",
      p_provider_reference: transfer.providerReference,
      p_reason: undefined,
    });
    if (error) throw new Error(error.message);

    return {
      ok: true,
      message:
        "Transfer submitted. It will be marked paid when the provider confirms.",
    };
  } catch (error) {
    // The provider call may have succeeded even if the response was lost. Check
    // the reference before reporting failure; never retry blindly.
    const reconciled = await verifyExisting();
    if (reconciled) return reconciled;

    console.error("[referrals] payout transfer failed", {
      payoutId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      message:
        "The transfer status is unknown. It was not retried automatically; check the provider before trying again.",
    };
  }
}
