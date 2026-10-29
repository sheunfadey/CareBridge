import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { verifyPaymentByReference } from "@/server/payments/service";

/**
 * Provider redirect target. The redirect is only a hint: the payment is
 * verified with the provider before any status is shown or enrolment unlocks.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";

  if (!reference) {
    return NextResponse.redirect(
      `${origin}/dashboard/academy/learning?payment=missing`,
    );
  }

  const result = await verifyPaymentByReference(reference);

  if (result.status === "successful") {
    const supabase = await createClient();
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("product_id, purpose")
      .eq("reference", reference)
      .maybeSingle();

    if (
      transaction?.purpose === "course_purchase" &&
      transaction.product_id
    ) {
      return NextResponse.redirect(
        `${origin}/dashboard/academy/learning/${transaction.product_id}?payment=success`,
      );
    }

    return NextResponse.redirect(
      `${origin}/dashboard/academy/learning?payment=success`,
    );
  }

  const status =
    result.status === "pending"
      ? "pending"
      : result.status === "mismatch"
        ? "review"
        : "failed";

  return NextResponse.redirect(
    `${origin}/dashboard/academy/learning?payment=${status}&reference=${encodeURIComponent(reference)}`,
  );
}
