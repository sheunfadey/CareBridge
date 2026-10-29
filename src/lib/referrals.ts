export const REFERRAL_COOKIE = "carebridge_referral";

export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code.trim().toUpperCase());
}

export function referralLink(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, "")}/r/${code}`;
}
