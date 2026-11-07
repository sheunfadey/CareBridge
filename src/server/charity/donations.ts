import "server-only";

import { getPublicEnv } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";

export const MIN_DONATION_MINOR_UNITS = 10_000;
export const MAX_DONATION_MINOR_UNITS = 50_000_000;

export type DonationCheckoutResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; message: string };

/**
 * Starts a donation checkout. The donor chooses the amount, but the campaign,
 * currency and amount bounds are resolved server-side and verified again by the
 * payment callback/webhook. A donation row is only created from a verified
 * payment transaction.
 */
export async function createDonationCheckout(
  user: CurrentUser,
  input: {
    campaignId: string;
    amountMinorUnits: number;
    publicAcknowledgement: boolean;
    donorDisplayName?: string;
    message?: string;
  },
): Promise<DonationCheckoutResult> {
  const provider = await getPaymentProvider();
  if (!provider.configured) {
    return {
      ok: false,
      message:
        "Online donations are not configured on this deployment yet. Please try again later.",
    };
  }

  if (
    !Number.isInteger(input.amountMinorUnits) ||
    input.amountMinorUnits < MIN_DONATION_MINOR_UNITS
  ) {
    return {
      ok: false,
      message: "The minimum online donation is ₦100.",
    };
  }
  if (input.amountMinorUnits > MAX_DONATION_MINOR_UNITS) {
    return {
      ok: false,
      message: "That amount is above the online donation limit. Contact the charity directly.",
    };
  }

  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("charity_campaigns")
    .select(
      "id, organisation_id, slug, title, status, is_public, starts_on, ends_on, currency",
    )
    .eq("id", input.campaignId)
    .maybeSingle();

  if (error || !campaign) {
    return { ok: false, message: "This campaign could not be found." };
  }
  if (campaign.status !== "approved" || !campaign.is_public) {
    return { ok: false, message: "This campaign is not open for donations." };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (campaign.starts_on > today) {
    return { ok: false, message: "This campaign has not started yet." };
  }
  if (campaign.ends_on && campaign.ends_on < today) {
    return { ok: false, message: "This campaign has closed." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Donations are unavailable on this server." };
  }

  const reference = `cb_don_${crypto.randomUUID().replaceAll("-", "")}`;
  const env = getPublicEnv();

  const { data: transaction, error: insertError } = await admin
    .from("payment_transactions")
    .insert({
      reference,
      organisation_id: campaign.organisation_id,
      payer_id: user.id,
      payer_email: user.email,
      purpose: "donation",
      product_type: "charity_campaign",
      product_id: campaign.id,
      description: `Donation: ${campaign.title}`,
      amount_minor_units: input.amountMinorUnits,
      currency: campaign.currency,
      provider: "paystack",
      provider_mode: provider.mode,
      status: "initiated",
      idempotency_key: `donation:${campaign.id}:${user.id}:${reference}`,
      metadata: {
        campaign_slug: campaign.slug,
        campaign_title: campaign.title,
        public_acknowledgement: input.publicAcknowledgement,
        donor_display_name: input.donorDisplayName?.trim() || null,
        donor_message: input.message?.trim() || null,
      },
    })
    .select("id, reference")
    .single();

  if (insertError || !transaction) {
    console.error("[charity] could not create donation transaction", {
      message: insertError?.message,
    });
    return { ok: false, message: "We could not start the donation. Try again shortly." };
  }

  try {
    const initialized = await provider.initializeTransaction({
      email: user.email,
      amountMinorUnits: input.amountMinorUnits,
      currency: campaign.currency,
      reference,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      metadata: {
        transaction_id: transaction.id,
        campaign_id: campaign.id,
        donor_id: user.id,
      },
    });

    const { error: updateError } = await admin
      .from("payment_transactions")
      .update({
        status: "pending",
        provider_reference: initialized.providerReference,
        checkout_url: initialized.authorizationUrl,
        access_code: initialized.accessCode,
      })
      .eq("id", transaction.id);

    if (updateError) {
      return { ok: false, message: "We could not start the donation. Try again shortly." };
    }

    return {
      ok: true,
      authorizationUrl: initialized.authorizationUrl,
      reference,
    };
  } catch (error) {
    await admin
      .from("payment_transactions")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        metadata: {
          failure_reason:
            error instanceof Error ? error.message : "Provider initialisation failed",
        },
      })
      .eq("id", transaction.id);

    console.error("[charity] donation provider initialisation failed", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return {
      ok: false,
      message: "The payment provider could not start this donation. Nothing has been charged.",
    };
  }
}
