// ── Currency Formatting ──

const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number; locale: string }> = {
  INR: { symbol: "₹", decimals: 2, locale: "en-IN" },
  USD: { symbol: "$", decimals: 2, locale: "en-US" },
  EUR: { symbol: "€", decimals: 2, locale: "en-DE" },
  GBP: { symbol: "£", decimals: 2, locale: "en-GB" },
};

/**
 * Convert from major currency unit to smallest unit (e.g., ₹1200 → 120000 paise).
 */
export function toSmallestUnit(amount: number, currency: string = "INR"): number {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;
  return Math.round(amount * Math.pow(10, config.decimals));
}

/**
 * Convert from smallest unit to major currency unit (e.g., 120000 paise → ₹1200).
 */
export function fromSmallestUnit(amount: number, currency: string = "INR"): number {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;
  return amount / Math.pow(10, config.decimals);
}

/**
 * Format a smallest-unit amount for display: 120000 → "₹1,200.00"
 */
export function formatCurrency(amountSmallestUnit: number, currency: string = "INR"): string {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;
  const majorAmount = amountSmallestUnit / Math.pow(10, config.decimals);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(majorAmount);
}

/**
 * Format a major-unit amount for display: 1200 → "₹1,200.00"
 */
export function formatMajorCurrency(amount: number, currency: string = "INR"): string {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.INR;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? currency;
}

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_CONFIG);
