/**
 * Money helpers. CareBridge stores every amount as integer minor units (kobo
 * for NGN) and never uses floating point for financial arithmetic.
 */

export class MoneyParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyParseError";
  }
}

/**
 * Parse a user-entered decimal amount into integer minor units (2 decimals).
 * Accepts "1", "1.5", "1.50", "1,500.25" and rejects anything with more than
 * two decimal places, negative values or exponent notation.
 */
export function parseMoneyToMinorUnits(input: string): number {
  const cleaned = input.trim().replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new MoneyParseError("Enter an amount with at most two decimal places.");
  }

  const [whole, fraction = ""] = cleaned.split(".");
  const minor = Number(`${whole}${fraction.padEnd(2, "0")}`);

  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new MoneyParseError("Enter a valid amount.");
  }

  return minor;
}

/** Format integer minor units as a plain decimal string (no symbol). */
export function formatMinorUnits(minorUnits: number): string {
  const sign = minorUnits < 0 ? "-" : "";
  const absolute = Math.abs(minorUnits);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

/** Percentage as basis points (1% = 100 bps). */
export function percentageToBps(percentage: string): number {
  const cleaned = percentage.trim();
  if (!/^\d{1,2}(\.\d{1,2})?$|^100(\.0{1,2})?$/.test(cleaned)) {
    throw new MoneyParseError("Enter a percentage between 0 and 100.");
  }
  const [whole, fraction = ""] = cleaned.split(".");
  const bps = Number(`${whole}${fraction.padEnd(2, "0")}`);
  if (!Number.isSafeInteger(bps) || bps < 0 || bps > 10_000) {
    throw new MoneyParseError("Enter a percentage between 0 and 100.");
  }
  return bps;
}
