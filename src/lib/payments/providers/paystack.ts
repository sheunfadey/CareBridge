import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  PaymentProviderError,
  type InitializePaymentInput,
  type InitializePaymentResult,
  type PaymentProvider,
  type RefundResult,
  type TransferRecipient,
  type TransferResult,
  type VerifiedPayment,
} from "@/lib/payments/types";

const PAYSTACK_API = "https://api.paystack.co";

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackTransaction = {
  id?: number;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  authorization_url?: string;
  access_code?: string;
  [key: string]: unknown;
};

type PaystackRecipient = {
  recipient_code: string;
  [key: string]: unknown;
};

type PaystackTransfer = {
  reference: string;
  status: string;
  [key: string]: unknown;
};

type PaystackRefund = {
  reference?: string;
  status: string;
  [key: string]: unknown;
};

function mapTransactionState(
  status: string,
): VerifiedPayment["state"] {
  switch (status.toLowerCase()) {
    case "success":
      return "successful";
    case "failed":
    case "reversed":
      return "failed";
    case "abandoned":
      return "abandoned";
    default:
      return "pending";
  }
}

function mapTransferState(status: string): TransferResult["status"] {
  switch (status.toLowerCase()) {
    case "success":
      return "successful";
    case "failed":
      return "failed";
    case "reversed":
      return "reversed";
    case "pending":
      return "pending";
    default:
      return "processing";
  }
}

function mapRefundState(status: string): RefundResult["status"] {
  switch (status.toLowerCase()) {
    case "processed":
    case "success":
      return "successful";
    case "failed":
      return "failed";
    case "pending":
      return "pending";
    default:
      return "processing";
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new PaymentProviderError(
      `Paystack response is missing ${field}`,
      "PROVIDER_ERROR",
    );
  }
  return value;
}

export function createPaystackProvider(options: {
  secretKey: string | undefined;
  webhookSecret: string | undefined;
  mode: "sandbox" | "live";
  transfersEnabled: boolean;
}): PaymentProvider {
  const secretKey = options.secretKey?.trim();
  const webhookSecret =
    options.webhookSecret?.trim() || options.secretKey?.trim() || "";

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    if (!secretKey) {
      throw new PaymentProviderError(
        "Payment provider is not configured.",
        "NOT_CONFIGURED",
      );
    }

    let response: Response;
    try {
      response = await fetch(`${PAYSTACK_API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
      });
    } catch {
      throw new PaymentProviderError(
        "The payment provider could not be reached.",
        "PROVIDER_ERROR",
      );
    }

    let body: PaystackEnvelope<T> | null = null;
    try {
      body = (await response.json()) as PaystackEnvelope<T>;
    } catch {
      body = null;
    }

    if (!response.ok || !body?.status) {
      throw new PaymentProviderError(
        body?.message || "The payment provider rejected the request.",
        "PROVIDER_ERROR",
      );
    }

    return body.data;
  }

  return {
    name: "paystack",
    configured: Boolean(secretKey),
    transfersEnabled: Boolean(secretKey) && options.transfersEnabled,
    mode: options.mode,

    async initializeTransaction(
      input: InitializePaymentInput,
    ): Promise<InitializePaymentResult> {
      const transaction = await request<PaystackTransaction>(
        "/transaction/initialize",
        {
          method: "POST",
          body: JSON.stringify({
            email: input.email,
            amount: input.amountMinorUnits,
            currency: input.currency,
            reference: input.reference,
            callback_url: input.callbackUrl,
            metadata: input.metadata ?? {},
          }),
        },
      );

      return {
        providerReference: requireString(transaction.reference, "reference"),
        authorizationUrl: requireString(
          transaction.authorization_url,
          "authorization_url",
        ),
        accessCode:
          typeof transaction.access_code === "string"
            ? transaction.access_code
            : null,
      };
    },

    async verifyTransaction(reference: string): Promise<VerifiedPayment> {
      const transaction = await request<PaystackTransaction>(
        `/transaction/verify/${encodeURIComponent(reference)}`,
      );

      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new PaymentProviderError(
          "Paystack returned an invalid transaction amount.",
          "PROVIDER_ERROR",
        );
      }

      return {
        state: mapTransactionState(transaction.status),
        providerReference: requireString(transaction.reference, "reference"),
        amountMinorUnits: amount,
        currency: requireString(transaction.currency, "currency").toUpperCase(),
        paidAt:
          typeof transaction.paid_at === "string" ? transaction.paid_at : null,
        raw: transaction as Record<string, unknown>,
      };
    },

    verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
      if (!signature || !webhookSecret) {
        return false;
      }

      const expected = createHmac("sha512", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

      const received = signature.trim().toLowerCase();
      if (received.length !== expected.length) {
        return false;
      }

      try {
        return timingSafeEqual(
          Buffer.from(expected, "hex"),
          Buffer.from(received, "hex"),
        );
      } catch {
        return false;
      }
    },

    async testConnection(): Promise<{ ok: boolean; message: string }> {
      try {
        const balances = await request<{ currency: string; balance: number }[]>(
          "/balance",
        );
        return {
          ok: true,
          message: `Connected to Paystack in ${options.mode} mode. ${balances.length} currency balance${balances.length === 1 ? "" : "s"} available.`,
        };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Could not reach the payment provider.",
        };
      }
    },

    async createTransferRecipient(input): Promise<TransferRecipient> {
      if (!options.transfersEnabled) {
        throw new PaymentProviderError(
          "Referral transfers are disabled until the payout arrangement is approved.",
          "TRANSFERS_DISABLED",
        );
      }

      const recipient = await request<PaystackRecipient>(
        "/transferrecipient",
        {
          method: "POST",
          body: JSON.stringify({
            type: "nuban",
            name: input.name,
            account_number: input.accountNumber,
            bank_code: input.bankCode,
            currency: input.currency,
          }),
        },
      );

      return {
        recipientCode: requireString(recipient.recipient_code, "recipient_code"),
        raw: recipient as Record<string, unknown>,
      };
    },

    async initiateTransfer(input): Promise<TransferResult> {
      if (!options.transfersEnabled) {
        throw new PaymentProviderError(
          "Referral transfers are disabled until the payout arrangement is approved.",
          "TRANSFERS_DISABLED",
        );
      }

      const transfer = await request<PaystackTransfer>("/transfer", {
        method: "POST",
        body: JSON.stringify({
          source: "balance",
          amount: input.amountMinorUnits,
          recipient: input.recipientCode,
          reason: input.reason,
          reference: input.reference,
        }),
      });

      return {
        providerReference: requireString(transfer.reference, "reference"),
        status: mapTransferState(transfer.status),
        raw: transfer as Record<string, unknown>,
      };
    },

    async verifyTransfer(reference: string): Promise<TransferResult> {
      const transfer = await request<PaystackTransfer>(
        `/transfer/verify/${encodeURIComponent(reference)}`,
      );

      return {
        providerReference: requireString(transfer.reference, "reference"),
        status: mapTransferState(transfer.status),
        raw: transfer as Record<string, unknown>,
      };
    },

    async refund(input): Promise<RefundResult> {
      const refund = await request<PaystackRefund>("/refund", {
        method: "POST",
        body: JSON.stringify({
          transaction: input.providerReference,
          ...(input.amountMinorUnits
            ? { amount: input.amountMinorUnits }
            : {}),
        }),
      });

      return {
        providerReference:
          typeof refund.reference === "string"
            ? refund.reference
            : input.providerReference,
        status: mapRefundState(refund.status),
        raw: refund as Record<string, unknown>,
      };
    },
  };
}
