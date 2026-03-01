import { prisma } from '@/lib/prisma';
import type { CardPrice, Currency, PriceSource } from '@prisma/client';
import {
  calculateMarketPrice,
  calculateTrend,
  isStale,
  type MarketPriceResult,
  type PricePoint,
} from './price-utils';

export interface CardMarketPrice {
  cardId: string;
  nameEn: string;
  nameFr: string;
  rarity: string;
  marketPrice: MarketPriceResult;
  recentPrices: CardPrice[];
}

export interface CollectionValue {
  totalValue: number;
  currency: Currency;
  cardCount: number;
  cardValues: Array<{
    cardId: string;
    nameEn: string;
    nameFr: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface DeckValue {
  totalValue: number;
  currency: Currency;
  cardCount: number;
  cardValues: Array<{
    cardId: string;
    nameEn: string;
    nameFr: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export async function getCardPrices(
  cardId: string,
  source?: PriceSource,
  limit: number = 10
): Promise<CardPrice[]> {
  return prisma.cardPrice.findMany({
    where: {
      cardId,
      ...(source && { source }),
      confidence: { gte: 0.7 },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getCardMarketPrice(
  cardId: string,
  currency: Currency = 'EUR'
): Promise<CardMarketPrice> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { nameEn: true, nameFr: true, rarity: true },
  });
  if (!card) throw new Error('Card not found');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [recentPrices, olderPrices] = await Promise.all([
    prisma.cardPrice.findMany({
      where: { cardId, confidence: { gte: 0.7 } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.cardPrice.findMany({
      where: {
        cardId,
        confidence: { gte: 0.7 },
        createdAt: { lt: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const toPricePoints = (prices: CardPrice[]): PricePoint[] =>
    prices.map((p) => ({
      price: p.price,
      currency: p.currency as PricePoint['currency'],
      confidence: p.confidence,
      createdAt: p.createdAt,
      soldAt: p.soldAt,
    }));

  const currentMedian = calculateMarketPrice(toPricePoints(recentPrices), currency);
  const previousMedian = calculateMarketPrice(toPricePoints(olderPrices), currency);
  const trend = calculateTrend(currentMedian, previousMedian);

  const latestDate = recentPrices[0]?.createdAt ?? null;
  const stale = latestDate ? isStale(latestDate) : true;

  const confidences = recentPrices
    .map((p) => p.confidence)
    .filter((c): c is number => c !== null);
  const avgConfidence = confidences.length > 0
    ? Math.round((confidences.reduce((s, c) => s + c, 0) / confidences.length) * 100) / 100
    : 0;

  return {
    cardId,
    nameEn: card.nameEn,
    nameFr: card.nameFr,
    rarity: card.rarity,
    marketPrice: {
      marketPrice: currentMedian,
      currency,
      trend,
      sampleSize: recentPrices.length,
      isStale: stale,
      confidence: avgConfidence,
      lastUpdated: latestDate,
    },
    recentPrices,
  };
}

export async function getAllMarketPrices(
  cardIds: string[],
  currency: Currency = 'EUR'
): Promise<Map<string, MarketPriceResult>> {
  if (cardIds.length === 0) return new Map();

  // Batch fetch all prices in one query
  const allPrices = await prisma.cardPrice.findMany({
    where: {
      cardId: { in: cardIds },
      confidence: { gte: 0.7 },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by cardId
  const pricesByCard = new Map<string, CardPrice[]>();
  for (const price of allPrices) {
    const list = pricesByCard.get(price.cardId) || [];
    list.push(price);
    pricesByCard.set(price.cardId, list);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = new Map<string, MarketPriceResult>();

  for (const cardId of cardIds) {
    const prices = pricesByCard.get(cardId) || [];
    const recent = prices.slice(0, 10);
    const older = prices.filter((p) => p.createdAt < sevenDaysAgo).slice(0, 10);

    const toPricePoints = (ps: CardPrice[]): PricePoint[] =>
      ps.map((p) => ({
        price: p.price,
        currency: p.currency as PricePoint['currency'],
        confidence: p.confidence,
        createdAt: p.createdAt,
        soldAt: p.soldAt,
      }));

    const currentMedian = calculateMarketPrice(toPricePoints(recent), currency);
    const previousMedian = calculateMarketPrice(toPricePoints(older), currency);
    const trend = calculateTrend(currentMedian, previousMedian);

    const latestDate = recent[0]?.createdAt ?? null;
    const stale = latestDate ? isStale(latestDate) : true;

    const confidences = recent
      .map((p) => p.confidence)
      .filter((c): c is number => c !== null);
    const avgConfidence = confidences.length > 0
      ? Math.round((confidences.reduce((s, c) => s + c, 0) / confidences.length) * 100) / 100
      : 0;

    results.set(cardId, {
      marketPrice: currentMedian,
      currency,
      trend,
      sampleSize: recent.length,
      isStale: stale,
      confidence: avgConfidence,
      lastUpdated: latestDate,
    });
  }

  return results;
}

export async function getCollectionValue(
  userId: string,
  currency: Currency = 'EUR'
): Promise<CollectionValue> {
  const entries = await prisma.collectionCard.findMany({
    where: { userId, status: 'OWNED' },
    include: { card: { select: { nameEn: true, nameFr: true } } },
  });

  if (entries.length === 0) {
    return { totalValue: 0, currency, cardCount: 0, cardValues: [] };
  }

  const uniqueCardIds = [...new Set(entries.map((e) => e.cardId))];
  const priceMap = await getAllMarketPrices(uniqueCardIds, currency);

  let totalValue = 0;
  const cardValues = entries.map((entry) => {
    const unitPrice = priceMap.get(entry.cardId)?.marketPrice ?? 0;
    const totalPrice = Math.round(unitPrice * entry.quantity * 100) / 100;
    totalValue += totalPrice;
    return {
      cardId: entry.cardId,
      nameEn: entry.card.nameEn,
      nameFr: entry.card.nameFr,
      quantity: entry.quantity,
      unitPrice,
      totalPrice,
    };
  });

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    currency,
    cardCount: entries.reduce((sum, e) => sum + e.quantity, 0),
    cardValues,
  };
}

export async function getSetMarketPrices(
  setCode: string,
  currency: Currency = 'EUR'
): Promise<Record<string, number>> {
  const cards = await prisma.card.findMany({
    where: { set: setCode },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);
  const priceMap = await getAllMarketPrices(cardIds, currency);

  const result: Record<string, number> = {};
  for (const [cardId, mp] of priceMap) {
    if (mp.marketPrice > 0) {
      result[cardId] = mp.marketPrice;
    }
  }
  return result;
}

export async function getDeckValue(
  deckId: string,
  currency: Currency = 'EUR'
): Promise<DeckValue> {
  const deckCards = await prisma.deckCard.findMany({
    where: { deckId },
    include: { card: { select: { nameEn: true, nameFr: true } } },
  });

  if (deckCards.length === 0) {
    return { totalValue: 0, currency, cardCount: 0, cardValues: [] };
  }

  const uniqueCardIds = [...new Set(deckCards.map((dc) => dc.cardId))];
  const priceMap = await getAllMarketPrices(uniqueCardIds, currency);

  let totalValue = 0;
  const cardValues = deckCards.map((dc) => {
    const unitPrice = priceMap.get(dc.cardId)?.marketPrice ?? 0;
    const totalPrice = Math.round(unitPrice * dc.quantity * 100) / 100;
    totalValue += totalPrice;
    return {
      cardId: dc.cardId,
      nameEn: dc.card.nameEn,
      nameFr: dc.card.nameFr,
      quantity: dc.quantity,
      unitPrice,
      totalPrice,
    };
  });

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    currency,
    cardCount: deckCards.reduce((sum, dc) => sum + dc.quantity, 0),
    cardValues,
  };
}
