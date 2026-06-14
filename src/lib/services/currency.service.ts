import { prisma } from "@/lib/db";

/**
 * Currency service with DB-backed caching and Frankfurter API fallback.
 * Historical rates are immutable — once fetched, they never change.
 */
export class CurrencyService {
  /**
   * Get exchange rate for a currency pair on a specific date.
   * Uses DB cache first, then falls back to API.
   *
   * @returns Rate where 1 base = rate × target
   */
  static async getRate(
    baseCurrency: string,
    targetCurrency: string,
    date: Date
  ): Promise<number> {
    if (baseCurrency === targetCurrency) return 1;

    const dateOnly = new Date(date.toISOString().slice(0, 10));

    // Check DB cache
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_targetCurrency_date: {
          baseCurrency,
          targetCurrency,
          date: dateOnly,
        },
      },
    });

    if (cached) return cached.rate;

    // Fetch from API
    try {
      const dateStr = dateOnly.toISOString().slice(0, 10);
      const response = await fetch(
        `https://api.frankfurter.app/${dateStr}?from=${baseCurrency}&to=${targetCurrency}`,
        { next: { revalidate: 86400 } } // cache for 24h at the fetch level too
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const rate = data.rates[targetCurrency];

      if (!rate) {
        throw new Error(`No rate found for ${targetCurrency}`);
      }

      // Cache in DB (upsert handles race conditions)
      await prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency_date: {
            baseCurrency,
            targetCurrency,
            date: dateOnly,
          },
        },
        create: {
          baseCurrency,
          targetCurrency,
          rate,
          date: dateOnly,
          source: "frankfurter",
        },
        update: {},
      });

      return rate;
    } catch (error) {
      // Fallback: use nearest available rate
      const nearest = await prisma.exchangeRate.findFirst({
        where: { baseCurrency, targetCurrency },
        orderBy: { date: "desc" },
      });

      if (nearest) {
        console.warn(
          `Using fallback rate from ${nearest.date.toISOString().slice(0, 10)} for ${baseCurrency}→${targetCurrency} on ${dateOnly.toISOString().slice(0, 10)}`
        );
        return nearest.rate;
      }

      // Hard fallback for known pairs
      if (baseCurrency === "USD" && targetCurrency === "INR") return 84.5;
      if (baseCurrency === "INR" && targetCurrency === "USD") return 1 / 84.5;

      throw new Error(
        `Cannot get exchange rate for ${baseCurrency}→${targetCurrency} on ${dateOnly.toISOString().slice(0, 10)}`
      );
    }
  }

  /**
   * Batch prefetch rates for multiple (currency, date) pairs.
   * Used during CSV import to minimize API calls.
   */
  static async prefetchRates(
    pairs: { base: string; target: string; date: Date }[]
  ): Promise<Map<string, number>> {
    const rateMap = new Map<string, number>();

    for (const pair of pairs) {
      const key = `${pair.base}:${pair.date.toISOString().slice(0, 10)}`;
      if (!rateMap.has(key)) {
        const rate = await this.getRate(pair.base, pair.target, pair.date);
        rateMap.set(key, rate);
      }
    }

    return rateMap;
  }
}
