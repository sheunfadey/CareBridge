import "server-only";

export type PaymentProviderName = "paystack";

export type InitializePaymentInput = {
  email: string;
  amountMinorUnits: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export type InitializePaymentResult = {
  providerReference: string;
  authorizationUrl: string;
  accessCode: string | null;
};

export type VerifiedPayment = {
  state: "successful" | "failed" | "pending" | "abandoned";
  providerReference: string;
  amountMinorUnits: number;
  currency: string;
  paidAt: string | null;
  raw: Record<string, unknown>;
};

export type TransferRecipient = {
  recipientCode: string;
  raw: Record<string, unknown>;
};

export type TransferResult = {
  providerReference: string;
  status: "pending" | "processing" | "successful" | "failed" | "reversed";
  raw: Record<string, unknown>;
};

export type RefundResult = {
  providerReference: string;
  status: "pending" | "processing" | "successful" | "failed";
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  readonly configured: boolean;
  readonly transfersEnabled: boolean;
  readonly mode: "sandbox" | "live";
  initializeTransaction(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult>;
  verifyTransaction(reference: string): Promise<VerifiedPayment>;
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean;
  createTransferRecipient(input: {
    name: string;
    accountNumber: string;
    bankCode: string;
    currency: string;
  }): Promise<TransferRecipient>;
  initiateTransfer(input: {
    amountMinorUnits: number;
    recipientCode: string;
    reason: string;
    reference: string;
  }): Promise<TransferResult>;
  verifyTransfer(reference: string): Promise<TransferResult>;
  refund(input: {
    providerReference: string;
    amountMinorUnits?: number;
  }): Promise<RefundResult>;
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_CONFIGURED"
      | "PROVIDER_ERROR"
      | "INVALID_SIGNATURE"
      | "TRANSFERS_DISABLED",
  ) {
    super(message);
    this.name = "PaymentProviderError";
  }
}
