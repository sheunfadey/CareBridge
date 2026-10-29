import { NextResponse, type NextRequest } from "next/server";

import { processPaymentWebhook } from "@/server/payments/service";

/**
 * Paystack webhook endpoint. The raw body is read before parsing so the HMAC
 * signature can be checked. Processing is idempotent by provider event id.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const result = await processPaymentWebhook(rawBody, signature);

  return NextResponse.json(
    { status: result.message },
    { status: result.status },
  );
}
