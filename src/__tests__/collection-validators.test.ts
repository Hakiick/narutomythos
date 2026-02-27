import { describe, it, expect } from 'vitest';
import {
  addToCollectionSchema,
  updateCollectionCardSchema,
  collectionFiltersSchema,
} from '@/lib/validators/collection';

describe('addToCollectionSchema', () => {
  it('should accept cardId with all defaults', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cardId).toBe('KS-001');
      expect(result.data.status).toBe('OWNED');
      expect(result.data.condition).toBe('NEAR_MINT');
      expect(result.data.quantity).toBe(1);
      expect(result.data.language).toBe('en');
    }
  });

  it('should accept all fields explicitly', () => {
    const result = addToCollectionSchema.safeParse({
      cardId: 'KS-042',
      status: 'TRADE',
      condition: 'MINT',
      quantity: 5,
      language: 'fr',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('TRADE');
      expect(result.data.condition).toBe('MINT');
      expect(result.data.quantity).toBe(5);
      expect(result.data.language).toBe('fr');
    }
  });

  it('should reject empty cardId', () => {
    const result = addToCollectionSchema.safeParse({ cardId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing cardId', () => {
    const result = addToCollectionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid status', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid condition', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', condition: 'DESTROYED' });
    expect(result.success).toBe(false);
  });

  it('should reject quantity of 0', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject quantity over 99', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', quantity: 100 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer quantity', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', quantity: 2.5 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid language', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', language: 'de' });
    expect(result.success).toBe(false);
  });

  it('should accept WISHLIST status', () => {
    const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', status: 'WISHLIST' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('WISHLIST');
    }
  });

  it('should accept all valid conditions', () => {
    const conditions = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED', 'POOR'];
    for (const condition of conditions) {
      const result = addToCollectionSchema.safeParse({ cardId: 'KS-001', condition });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateCollectionCardSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = updateCollectionCardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept status change', () => {
    const result = updateCollectionCardSchema.safeParse({ status: 'TRADE' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('TRADE');
    }
  });

  it('should accept condition change', () => {
    const result = updateCollectionCardSchema.safeParse({ condition: 'PLAYED' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition).toBe('PLAYED');
    }
  });

  it('should accept quantity change', () => {
    const result = updateCollectionCardSchema.safeParse({ quantity: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(10);
    }
  });

  it('should accept language change', () => {
    const result = updateCollectionCardSchema.safeParse({ language: 'fr' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('fr');
    }
  });

  it('should reject invalid status', () => {
    const result = updateCollectionCardSchema.safeParse({ status: 'SOLD' });
    expect(result.success).toBe(false);
  });

  it('should reject quantity of 0', () => {
    const result = updateCollectionCardSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject quantity over 99', () => {
    const result = updateCollectionCardSchema.safeParse({ quantity: 100 });
    expect(result.success).toBe(false);
  });
});

describe('collectionFiltersSchema', () => {
  it('should accept empty object (no filters)', () => {
    const result = collectionFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept status filter', () => {
    const result = collectionFiltersSchema.safeParse({ status: 'OWNED' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('OWNED');
    }
  });

  it('should accept search filter', () => {
    const result = collectionFiltersSchema.safeParse({ search: 'Naruto' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('Naruto');
    }
  });

  it('should accept both filters', () => {
    const result = collectionFiltersSchema.safeParse({ status: 'WISHLIST', search: 'Sasuke' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = collectionFiltersSchema.safeParse({ status: 'MISSING' });
    expect(result.success).toBe(false);
  });
});
