import { describe, it, expect } from 'vitest';
import {
  priceQuerySchema,
  collectionValueQuerySchema,
  deckValueQuerySchema,
} from '@/lib/validators/price';

describe('priceQuerySchema', () => {
  it('should accept empty object with defaults', () => {
    const result = priceQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('EUR');
      expect(result.data.limit).toBe(10);
      expect(result.data.source).toBeUndefined();
    }
  });

  it('should accept EBAY source', () => {
    const result = priceQuerySchema.safeParse({ source: 'EBAY' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('EBAY');
    }
  });

  it('should accept CARDMARKET source', () => {
    const result = priceQuerySchema.safeParse({ source: 'CARDMARKET' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid source', () => {
    const result = priceQuerySchema.safeParse({ source: 'AMAZON' });
    expect(result.success).toBe(false);
  });

  it('should accept USD currency', () => {
    const result = priceQuerySchema.safeParse({ currency: 'USD' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
    }
  });

  it('should accept GBP currency', () => {
    const result = priceQuerySchema.safeParse({ currency: 'GBP' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid currency', () => {
    const result = priceQuerySchema.safeParse({ currency: 'JPY' });
    expect(result.success).toBe(false);
  });

  it('should coerce string limit to number', () => {
    const result = priceQuerySchema.safeParse({ limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it('should reject limit below 1', () => {
    const result = priceQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit above 50', () => {
    const result = priceQuerySchema.safeParse({ limit: 51 });
    expect(result.success).toBe(false);
  });

  it('should accept all valid fields together', () => {
    const result = priceQuerySchema.safeParse({
      source: 'EBAY',
      currency: 'GBP',
      limit: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('EBAY');
      expect(result.data.currency).toBe('GBP');
      expect(result.data.limit).toBe(20);
    }
  });
});

describe('collectionValueQuerySchema', () => {
  it('should accept empty object with EUR default', () => {
    const result = collectionValueQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('EUR');
    }
  });

  it('should accept valid currency', () => {
    const result = collectionValueQuerySchema.safeParse({ currency: 'USD' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid currency', () => {
    const result = collectionValueQuerySchema.safeParse({ currency: 'CHF' });
    expect(result.success).toBe(false);
  });
});

describe('deckValueQuerySchema', () => {
  it('should accept empty object with EUR default', () => {
    const result = deckValueQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('EUR');
    }
  });

  it('should accept valid currency', () => {
    const result = deckValueQuerySchema.safeParse({ currency: 'GBP' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid currency', () => {
    const result = deckValueQuerySchema.safeParse({ currency: 'AUD' });
    expect(result.success).toBe(false);
  });
});
