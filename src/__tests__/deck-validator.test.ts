import { describe, it, expect } from 'vitest';
import { validateDeck, calculateStats } from '@/lib/services/deck-validator';
import type { Card } from '@prisma/client';

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'KS-001',
    nameEn: 'Test Card',
    nameFr: 'Carte Test',
    type: 'CHARACTER',
    rarity: 'C',
    chakra: 2,
    power: 2000,
    keywords: [],
    group: 'Leaf Village',
    effectEn: null,
    effectFr: null,
    imageUrl: null,
    set: 'KS',
    cardNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeck(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({
      id: `KS-${String(i + 1).padStart(3, '0')}`,
      cardNumber: i + 1,
    })
  );
}

function makeMissions(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({
      id: `KS-M${i + 1}`,
      type: 'MISSION',
      chakra: null,
      power: null,
      nameEn: `Mission ${i + 1}`,
      nameFr: `Mission ${i + 1}`,
    })
  );
}

describe('validateDeck', () => {
  it('should validate a correct 30-card deck with 3 missions', () => {
    const cards = makeDeck(30);
    const missions = makeMissions(3);
    const result = validateDeck(cards, missions);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject a deck with too few cards', () => {
    const cards = makeDeck(20);
    const missions = makeMissions(3);
    const result = validateDeck(cards, missions);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deck must contain exactly 30 cards (has 20)');
  });

  it('should reject a deck with too many cards', () => {
    const cards = makeDeck(35);
    const missions = makeMissions(3);
    const result = validateDeck(cards, missions);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deck must contain exactly 30 cards (has 35)');
  });

  it('should reject more than 2 copies of the same card', () => {
    const deck = makeDeck(27);
    // Add 3 copies of the same card
    const duplicate = makeCard({ id: 'KS-DUP', nameEn: 'Duplicate Card' });
    deck.push(duplicate, duplicate, duplicate);

    const missions = makeMissions(3);
    const result = validateDeck(deck, missions);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('KS-DUP') && e.includes('max 2 copies'))).toBe(true);
  });

  it('should allow exactly 2 copies of the same card', () => {
    const deck = makeDeck(28);
    const duplicate = makeCard({ id: 'KS-DUP', nameEn: 'Duplicate Card' });
    deck.push(duplicate, duplicate);

    const missions = makeMissions(3);
    const result = validateDeck(deck, missions);

    expect(result.isValid).toBe(true);
  });

  it('should reject wrong number of missions', () => {
    const cards = makeDeck(30);

    const result2 = validateDeck(cards, makeMissions(2));
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Must have exactly 3 mission cards (has 2)');

    const result4 = validateDeck(cards, makeMissions(4));
    expect(result4.isValid).toBe(false);
    expect(result4.errors).toContain('Must have exactly 3 mission cards (has 4)');
  });

  it('should reject non-MISSION type cards as missions', () => {
    const cards = makeDeck(30);
    const badMissions = [
      makeCard({ id: 'KS-M1', type: 'CHARACTER' }),
      ...makeMissions(2),
    ];

    const result = validateDeck(cards, badMissions);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('not a MISSION type'))).toBe(true);
  });

  it('should return warnings for low CHARACTER count', () => {
    const jutsus = Array.from({ length: 20 }, (_, i) =>
      makeCard({
        id: `KS-J${i}`,
        type: 'JUTSU',
        power: null,
        cardNumber: i + 100,
      })
    );
    const chars = makeDeck(10);
    const cards = [...chars, ...jutsus];
    const missions = makeMissions(3);
    const result = validateDeck(cards, missions);

    expect(result.warnings.some(w => w.includes('fewer than 15 CHARACTER'))).toBe(true);
  });
});

describe('calculateStats', () => {
  it('should calculate correct type distribution', () => {
    const cards = [
      makeCard({ id: 'KS-001', type: 'CHARACTER' }),
      makeCard({ id: 'KS-002', type: 'CHARACTER' }),
      makeCard({ id: 'KS-003', type: 'JUTSU', power: null }),
      makeCard({ id: 'KS-004', type: 'MISSION', chakra: null, power: null }),
    ];

    const stats = calculateStats(cards);
    expect(stats.typeDistribution).toEqual({
      CHARACTER: 2,
      JUTSU: 1,
      MISSION: 1,
    });
  });

  it('should calculate average power for CHARACTER cards only', () => {
    const cards = [
      makeCard({ id: 'KS-001', type: 'CHARACTER', power: 2000 }),
      makeCard({ id: 'KS-002', type: 'CHARACTER', power: 4000 }),
      makeCard({ id: 'KS-003', type: 'JUTSU', power: null }),
    ];

    const stats = calculateStats(cards);
    expect(stats.averagePower).toBe(3000);
  });

  it('should calculate chakra curve', () => {
    const cards = [
      makeCard({ id: 'KS-001', chakra: 0 }),
      makeCard({ id: 'KS-002', chakra: 1 }),
      makeCard({ id: 'KS-003', chakra: 1 }),
      makeCard({ id: 'KS-004', chakra: 3 }),
      makeCard({ id: 'KS-005', chakra: 7 }), // goes in 5+ bucket
    ];

    const stats = calculateStats(cards);
    expect(stats.chakraCurve[0]).toBe(1);
    expect(stats.chakraCurve[1]).toBe(2);
    expect(stats.chakraCurve[3]).toBe(1);
    expect(stats.chakraCurve[5]).toBe(1); // 7 → 5+ bucket
  });

  it('should calculate rarity distribution', () => {
    const cards = [
      makeCard({ id: 'KS-001', rarity: 'C' }),
      makeCard({ id: 'KS-002', rarity: 'C' }),
      makeCard({ id: 'KS-003', rarity: 'R' }),
      makeCard({ id: 'KS-004', rarity: 'L' }),
    ];

    const stats = calculateStats(cards);
    expect(stats.rarityDistribution).toEqual({ C: 2, R: 1, L: 1 });
  });

  it('should handle empty deck', () => {
    const stats = calculateStats([]);
    expect(stats.totalCards).toBe(0);
    expect(stats.averagePower).toBe(0);
    expect(stats.averageChakra).toBe(0);
  });
});
