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
    for (const rarity of ['C', 'UC', 'R', 'AR', 'S', 'L', 'MYTHOS']) {
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

  it('should accept chakra range filters', () => {
    const result = cardFiltersSchema.safeParse({ chakraMin: 2, chakraMax: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chakraMin).toBe(2);
      expect(result.data.chakraMax).toBe(5);
    }
  });

  it('should coerce string numbers for chakra/power', () => {
    const result = cardFiltersSchema.safeParse({ chakraMin: '3', powerMax: '7' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chakraMin).toBe(3);
      expect(result.data.powerMax).toBe(7);
    }
  });

  it('should reject chakra values out of range', () => {
    expect(cardFiltersSchema.safeParse({ chakraMin: -1 }).success).toBe(false);
    expect(cardFiltersSchema.safeParse({ chakraMax: 10 }).success).toBe(false);
  });

  it('should reject power values out of range', () => {
    expect(cardFiltersSchema.safeParse({ powerMin: -1 }).success).toBe(false);
    expect(cardFiltersSchema.safeParse({ powerMax: 15 }).success).toBe(false);
  });

  it('should accept keywords array', () => {
    const result = cardFiltersSchema.safeParse({ keywords: ['Hokage', 'Team 7'] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keywords).toEqual(['Hokage', 'Team 7']);
    }
  });

  it('should accept effectTypes array', () => {
    const result = cardFiltersSchema.safeParse({ effectTypes: ['MAIN', 'AMBUSH'] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.effectTypes).toEqual(['MAIN', 'AMBUSH']);
    }
  });

  it('should reject invalid effectTypes', () => {
    const result = cardFiltersSchema.safeParse({ effectTypes: ['INVALID'] });
    expect(result.success).toBe(false);
  });

  it('should accept combined old and new filters', () => {
    const result = cardFiltersSchema.safeParse({
      type: 'CHARACTER',
      rarity: 'R',
      search: 'Naruto',
      group: 'Leaf Village',
      chakraMin: 2,
      chakraMax: 5,
      powerMin: 3,
      keywords: ['Hokage'],
      effectTypes: ['MAIN', 'UPGRADE'],
    });
    expect(result.success).toBe(true);
  });
});
