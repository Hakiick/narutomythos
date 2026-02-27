export type PriceTrend = 'up' | 'down' | 'stable';

export interface PricePoint {
  price: number;
  currency: 'EUR' | 'USD' | 'GBP';
  confidence: number | null;
  createdAt: Date;
  soldAt: Date | null;
}

export interface MarketPriceResult {
  marketPrice: number;
  currency: 'EUR' | 'USD' | 'GBP';
  trend: PriceTrend;
  sampleSize: number;
  isStale: boolean;
  confidence: number;
  lastUpdated: Date | null;
}

// Static conversion rates (upgradeable to live ECB API later)
const RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
};

const RATES_FROM_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.86,
};

export function convertCurrency(
  amount: number,
  from: 'EUR' | 'USD' | 'GBP',
  to: 'EUR' | 'USD' | 'GBP'
): number {
  if (from === to) return amount;
  const inEur = amount * RATES_TO_EUR[from];
  return Math.round(inEur * RATES_FROM_EUR[to] * 100) / 100;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
}

export function filterOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  if (iqr === 0) return prices;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return prices.filter((p) => p >= lower && p <= upper);
}

export function calculateMarketPrice(
  prices: PricePoint[],
  targetCurrency: 'EUR' | 'USD' | 'GBP'
): number {
  if (prices.length === 0) return 0;
  const converted = prices.map((p) =>
    convertCurrency(p.price, p.currency, targetCurrency)
  );
  const filtered = filterOutliers(converted);
  return calculateMedian(filtered);
}

export function calculateTrend(
  currentMedian: number,
  previousMedian: number
): PriceTrend {
  if (previousMedian === 0) return 'stable';
  const changePercent =
    ((currentMedian - previousMedian) / previousMedian) * 100;
  if (changePercent > 5) return 'up';
  if (changePercent < -5) return 'down';
  return 'stable';
}

export function isStale(latestDate: Date, thresholdDays: number = 7): boolean {
  const now = new Date();
  const diffMs = now.getTime() - latestDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

export function meetsConfidenceThreshold(
  confidence: number | null,
  threshold: number = 0.7
): boolean {
  if (confidence === null) return false;
  return confidence >= threshold;
}
