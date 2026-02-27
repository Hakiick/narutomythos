import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  calculateMedian,
  filterOutliers,
  calculateMarketPrice,
  calculateTrend,
  isStale,
  meetsConfidenceThreshold,
} from '@/lib/services/price-utils';
import type { PricePoint } from '@/lib/services/price-utils';

describe('convertCurrency', () => {
  it('should return same amount for same currency', () => {
    expect(convertCurrency(10, 'EUR', 'EUR')).toBe(10);
  });

  it('should convert EUR to USD', () => {
    expect(convertCurrency(10, 'EUR', 'USD')).toBe(10.9);
  });

  it('should convert USD to EUR', () => {
    expect(convertCurrency(10, 'USD', 'EUR')).toBe(9.2);
  });

  it('should convert EUR to GBP', () => {
    expect(convertCurrency(10, 'EUR', 'GBP')).toBe(8.6);
  });

  it('should convert GBP to USD', () => {
    const result = convertCurrency(10, 'GBP', 'USD');
    expect(result).toBeCloseTo(12.75, 1);
  });

  it('should handle zero amount', () => {
    expect(convertCurrency(0, 'EUR', 'USD')).toBe(0);
  });
});

describe('calculateMedian', () => {
  it('should return 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0);
  });

  it('should return single value', () => {
    expect(calculateMedian([5])).toBe(5);
  });

  it('should return median of odd count', () => {
    expect(calculateMedian([1, 3, 5])).toBe(3);
  });

  it('should return average of middle two for even count', () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
  });

  it('should handle unsorted array', () => {
    expect(calculateMedian([5, 1, 3])).toBe(3);
  });

  it('should handle duplicate values', () => {
    expect(calculateMedian([2, 2, 2, 2])).toBe(2);
  });
});

describe('filterOutliers', () => {
  it('should return original array if fewer than 4 items', () => {
    const prices = [1, 2, 3];
    expect(filterOutliers(prices)).toEqual([1, 2, 3]);
  });

  it('should return original array if all values are equal', () => {
    const prices = [5, 5, 5, 5];
    expect(filterOutliers(prices)).toEqual([5, 5, 5, 5]);
  });

  it('should remove extreme outlier', () => {
    const prices = [10, 11, 12, 10, 11, 100];
    const result = filterOutliers(prices);
    expect(result).not.toContain(100);
    expect(result.length).toBeLessThan(prices.length);
  });

  it('should keep values within 3 std deviations', () => {
    const prices = [10, 11, 12, 13, 14];
    expect(filterOutliers(prices)).toEqual([10, 11, 12, 13, 14]);
  });
});

describe('calculateMarketPrice', () => {
  it('should return 0 for empty array', () => {
    expect(calculateMarketPrice([], 'EUR')).toBe(0);
  });

  it('should calculate median of prices in same currency', () => {
    const prices: PricePoint[] = [
      { price: 10, currency: 'EUR', confidence: 0.9, createdAt: new Date(), soldAt: null },
      { price: 20, currency: 'EUR', confidence: 0.8, createdAt: new Date(), soldAt: null },
      { price: 15, currency: 'EUR', confidence: 0.85, createdAt: new Date(), soldAt: null },
    ];
    expect(calculateMarketPrice(prices, 'EUR')).toBe(15);
  });

  it('should convert prices to target currency', () => {
    const prices: PricePoint[] = [
      { price: 10, currency: 'USD', confidence: 0.9, createdAt: new Date(), soldAt: null },
    ];
    const result = calculateMarketPrice(prices, 'EUR');
    expect(result).toBe(9.2); // 10 USD -> EUR
  });
});

describe('calculateTrend', () => {
  it('should return stable when previous is 0', () => {
    expect(calculateTrend(10, 0)).toBe('stable');
  });

  it('should return up when increase > 5%', () => {
    expect(calculateTrend(11, 10)).toBe('up'); // 10% increase
  });

  it('should return down when decrease > 5%', () => {
    expect(calculateTrend(9, 10)).toBe('down'); // 10% decrease
  });

  it('should return stable within +/- 5%', () => {
    expect(calculateTrend(10.4, 10)).toBe('stable'); // 4% increase
  });

  it('should return stable at exactly 5%', () => {
    expect(calculateTrend(10.5, 10)).toBe('stable'); // 5% exactly, not > 5%
  });
});

describe('isStale', () => {
  it('should return false for today', () => {
    expect(isStale(new Date())).toBe(false);
  });

  it('should return false for 6 days ago', () => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    expect(isStale(sixDaysAgo)).toBe(false);
  });

  it('should return true for 8 days ago', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    expect(isStale(eightDaysAgo)).toBe(true);
  });

  it('should use custom threshold', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(isStale(twoDaysAgo, 1)).toBe(true);
    expect(isStale(twoDaysAgo, 3)).toBe(false);
  });
});

describe('meetsConfidenceThreshold', () => {
  it('should return false for null confidence', () => {
    expect(meetsConfidenceThreshold(null)).toBe(false);
  });

  it('should return false below threshold', () => {
    expect(meetsConfidenceThreshold(0.5)).toBe(false);
  });

  it('should return true at threshold', () => {
    expect(meetsConfidenceThreshold(0.7)).toBe(true);
  });

  it('should return true above threshold', () => {
    expect(meetsConfidenceThreshold(0.95)).toBe(true);
  });

  it('should use custom threshold', () => {
    expect(meetsConfidenceThreshold(0.5, 0.3)).toBe(true);
    expect(meetsConfidenceThreshold(0.5, 0.8)).toBe(false);
  });
});
