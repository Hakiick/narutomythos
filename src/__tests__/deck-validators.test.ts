import { describe, it, expect } from 'vitest';
import { createDeckSchema, updateDeckSchema, addCardSchema } from '@/lib/validators/deck';

describe('createDeckSchema', () => {
  it('should accept valid input', () => {
    const result = createDeckSchema.safeParse({ name: 'My Deck' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Deck');
      expect(result.data.isPublic).toBe(false);
    }
  });

  it('should accept name with description and isPublic', () => {
    const result = createDeckSchema.safeParse({
      name: 'Naruto Rush',
      description: 'Aggressive Leaf Village deck',
      isPublic: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Aggressive Leaf Village deck');
      expect(result.data.isPublic).toBe(true);
    }
  });

  it('should reject empty name', () => {
    const result = createDeckSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing name', () => {
    const result = createDeckSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 chars', () => {
    const result = createDeckSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject description longer than 500 chars', () => {
    const result = createDeckSchema.safeParse({
      name: 'Test',
      description: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('should default isPublic to false', () => {
    const result = createDeckSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });
});

describe('updateDeckSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = updateDeckSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial update with name only', () => {
    const result = updateDeckSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('New Name');
    }
  });

  it('should accept nullable description', () => {
    const result = updateDeckSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it('should accept isPublic toggle', () => {
    const result = updateDeckSchema.safeParse({ isPublic: true });
    expect(result.success).toBe(true);
  });

  it('should reject name longer than 100 chars', () => {
    const result = updateDeckSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('addCardSchema', () => {
  it('should accept cardId with default quantity', () => {
    const result = addCardSchema.safeParse({ cardId: 'KS-001' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cardId).toBe('KS-001');
      expect(result.data.quantity).toBe(1);
    }
  });

  it('should accept quantity of 2', () => {
    const result = addCardSchema.safeParse({ cardId: 'KS-001', quantity: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(2);
    }
  });

  it('should reject quantity of 0', () => {
    const result = addCardSchema.safeParse({ cardId: 'KS-001', quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject quantity of 3', () => {
    const result = addCardSchema.safeParse({ cardId: 'KS-001', quantity: 3 });
    expect(result.success).toBe(false);
  });

  it('should reject missing cardId', () => {
    const result = addCardSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject empty cardId', () => {
    const result = addCardSchema.safeParse({ cardId: '' });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer quantity', () => {
    const result = addCardSchema.safeParse({ cardId: 'KS-001', quantity: 1.5 });
    expect(result.success).toBe(false);
  });
});
