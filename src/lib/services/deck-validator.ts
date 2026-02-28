import type { Card } from '@prisma/client';

export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: DeckStats;
}

export interface DeckStats {
  totalCards: number;
  chakraCurve: Record<number, number>;
  typeDistribution: Record<string, number>;
  rarityDistribution: Record<string, number>;
  groupDistribution: Record<string, number>;
  averagePower: number;
  averageChakra: number;
}

export function calculateStats(cards: Card[]): DeckStats {
  const chakraCurve: Record<number, number> = {};
  const typeDistribution: Record<string, number> = {};
  const rarityDistribution: Record<string, number> = {};
  const groupDistribution: Record<string, number> = {};

  let totalPower = 0;
  let totalChakra = 0;
  let characterCount = 0;

  for (const card of cards) {
    // Type distribution
    typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1;

    // Rarity distribution
    rarityDistribution[card.rarity] = (rarityDistribution[card.rarity] || 0) + 1;

    // Group distribution
    if (card.group) {
      groupDistribution[card.group] = (groupDistribution[card.group] || 0) + 1;
    }

    // Chakra curve (for cards with chakra cost)
    if (card.chakra !== null) {
      const cost = Math.min(card.chakra, 5); // 5+ bucket
      chakraCurve[cost] = (chakraCurve[cost] || 0) + 1;
      totalChakra += card.chakra;
    }

    // Power stats (CHARACTER only)
    if (card.type === 'CHARACTER' && card.power !== null) {
      totalPower += card.power;
      characterCount++;
    }
  }

  return {
    totalCards: cards.length,
    chakraCurve,
    typeDistribution,
    rarityDistribution,
    groupDistribution,
    averagePower: characterCount > 0 ? Math.round(totalPower / characterCount) : 0,
    averageChakra: cards.length > 0
      ? Math.round((totalChakra / cards.filter(c => c.chakra !== null).length) * 10) / 10
      : 0,
  };
}

export function validateDeck(allCards: Card[], missions?: Card[]): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Separate main deck cards from mission cards
  let mainDeckCards: Card[];
  let missionCards: Card[];

  if (missions) {
    // Explicit split provided (from tests)
    mainDeckCards = allCards;
    missionCards = missions;
  } else {
    // Auto-split: MISSION type cards go to missions, rest to main deck
    mainDeckCards = allCards.filter((c) => c.type !== 'MISSION');
    missionCards = allCards.filter((c) => c.type === 'MISSION');
  }

  // Check main deck size (30 cards, excluding missions)
  if (mainDeckCards.length !== 30) {
    errors.push(`Deck must contain exactly 30 cards (has ${mainDeckCards.length})`);
  }

  // Check copy limits on all cards
  const cardCounts = new Map<string, number>();
  for (const card of [...mainDeckCards, ...missionCards]) {
    const count = (cardCounts.get(card.id) || 0) + 1;
    cardCounts.set(card.id, count);
    if (count > 2) {
      errors.push(`Card ${card.id} (${card.nameEn}) exceeds max 2 copies`);
    }
  }

  // Check missions (3 mission cards required, outside the 30-card deck)
  if (missionCards.length !== 3) {
    errors.push(`Must have exactly 3 mission cards (has ${missionCards.length})`);
  }

  // Validate missions are actually MISSION type
  for (const mission of missionCards) {
    if (mission.type !== 'MISSION') {
      errors.push(`Mission card ${mission.id} (${mission.nameEn}) is not a MISSION type`);
    }
  }

  // Stats are computed on main deck only
  const stats = calculateStats(mainDeckCards);

  // Warnings for deck quality
  if (!stats.typeDistribution['CHARACTER'] || stats.typeDistribution['CHARACTER'] < 15) {
    warnings.push('Deck has fewer than 15 CHARACTER cards — consider adding more');
  }

  if (stats.averageChakra > 3) {
    warnings.push('Average chakra cost is high — consider adding lower-cost cards');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}
