import { NextResponse, type NextRequest } from "next/server";

import { REFERRAL_COOKIE, isValidReferralCode } from "@/lib/referrals";

/**
 * Public referral link entry point. Stores the code in an httpOnly cookie so it
 * can be attributed to the signed-in customer at registration or checkout. The
 * code itself is validated server-side by the attribution function.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  const destination = new URL("/courses", request.url);

  if (!isValidReferralCode(normalized)) {
    return NextResponse.redirect(destination);
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(REFERRAL_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
