import { describe, it, expect } from 'vitest';
import { cardFiltersSchema } from '@/lib/validators/card';

describe('cardFiltersSchema', () => {
  it('should accept empty object', () => {
    const result = cardFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid type filter', () => {
    const result = cardFiltersSchema.safeParse({ type: 'CHARACTER' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('CHARACTER');
    }
  });

  it('should accept all valid card types', () => {
    for (const type of ['CHARACTER', 'MISSION', 'JUTSU']) {
      const result = cardFiltersSchema.safeParse({ type });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid type', () => {
    const result = cardFiltersSchema.safeParse({ type: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid rarity values', () => {
    for (const rarity of ['C', 'UC', 'R', 'AR', 'S', 'L']) {
      const result = cardFiltersSchema.safeParse({ rarity });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid rarity', () => {
    const result = cardFiltersSchema.safeParse({ rarity: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should accept search string', () => {
    const result = cardFiltersSchema.safeParse({ search: 'Naruto' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('Naruto');
    }
  });

  it('should accept group filter', () => {
    const result = cardFiltersSchema.safeParse({ group: 'Leaf Village' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.group).toBe('Leaf Village');
    }
  });

  it('should accept combined filters', () => {
    const result = cardFiltersSchema.safeParse({
      type: 'CHARACTER',
      rarity: 'R',
      search: 'Naruto',
      group: 'Leaf Village',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('CHARACTER');
      expect(result.data.rarity).toBe('R');
      expect(result.data.search).toBe('Naruto');
      expect(result.data.group).toBe('Leaf Village');
    }
  });

  it('should strip unknown keys', () => {
    const result = cardFiltersSchema.safeParse({
      type: 'CHARACTER',
      unknown: 'value',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('unknown');
    }
  });
});
