const currencySymbols: Record<string, string> = {
  NGN: "\u20A6",
  USD: "$",
  GBP: "\u00A3",
  EUR: "\u20AC",
};

export function formatMoney(
  minorUnits: number | null,
  currency = "NGN",
): string {
  if (minorUnits === null || minorUnits === undefined) return "Not disclosed";
  const symbol = currencySymbols[currency] ?? `${currency} `;
  const amount = minorUnits / 100;
  return `${symbol}${amount.toLocaleString("en-NG", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSalaryRange(
  minMinorUnits: number | null,
  maxMinorUnits: number | null,
  currency: string,
  disclosed: boolean,
): string {
  if (!disclosed) return "Salary not disclosed";
  if (minMinorUnits === null && maxMinorUnits === null) return "Salary not disclosed";
  if (minMinorUnits !== null && maxMinorUnits !== null) {
    if (minMinorUnits === maxMinorUnits) return formatMoney(minMinorUnits, currency);
    return `${formatMoney(minMinorUnits, currency)} \u2013 ${formatMoney(maxMinorUnits, currency)}`;
  }
  if (minMinorUnits !== null) return `From ${formatMoney(minMinorUnits, currency)}`;
  return `Up to ${formatMoney(maxMinorUnits, currency)}`;
}

export function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDeadline(value: string | null): string {
  if (!value) return "Open until filled";
  return `Apply by ${formatDate(value)}`;
}

/** Formats a timestamptz for financial history and administrative tables. */
export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
