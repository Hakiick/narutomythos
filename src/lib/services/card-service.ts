import { prisma } from '@/lib/prisma';
import type { Card, CardType, Rarity } from '@prisma/client';

export interface CardFilters {
  type?: CardType;
  rarity?: Rarity;
  search?: string;
  group?: string;
  set?: string;
  chakraMin?: number;
  chakraMax?: number;
  powerMin?: number;
  powerMax?: number;
  keywords?: string[];
  effectTypes?: string[];
}

export async function getCards(filters: CardFilters = {}): Promise<Card[]> {
  const chakraFilter =
    filters.chakraMin !== undefined || filters.chakraMax !== undefined
      ? {
          chakra: {
            ...(filters.chakraMin !== undefined && { gte: filters.chakraMin }),
            ...(filters.chakraMax !== undefined && { lte: filters.chakraMax }),
          },
        }
      : {};

  const powerFilter =
    filters.powerMin !== undefined || filters.powerMax !== undefined
      ? {
          power: {
            ...(filters.powerMin !== undefined && { gte: filters.powerMin }),
            ...(filters.powerMax !== undefined && { lte: filters.powerMax }),
          },
        }
      : {};

  const effectFilter =
    filters.effectTypes?.length
      ? {
          OR: filters.effectTypes.map((et) => ({
            OR: [
              { effectEn: { contains: et, mode: 'insensitive' as const } },
              { effectFr: { contains: et, mode: 'insensitive' as const } },
            ],
          })),
        }
      : {};

  return prisma.card.findMany({
    where: {
      ...(filters.type && { type: filters.type }),
      ...(filters.rarity && { rarity: filters.rarity }),
      ...(filters.group && { group: filters.group }),
      ...(filters.set && { set: filters.set }),
      ...(filters.search && {
        OR: [
          { nameEn: { contains: filters.search, mode: 'insensitive' as const } },
          { nameFr: { contains: filters.search, mode: 'insensitive' as const } },
          { id: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
      ...chakraFilter,
      ...powerFilter,
      ...(filters.keywords?.length && {
        keywords: { hasSome: filters.keywords },
      }),
      ...effectFilter,
    },
    orderBy: { cardNumber: 'asc' },
  });
}

export async function getCardById(id: string): Promise<Card | null> {
  return prisma.card.findUnique({
    where: { id },
  });
}

export async function getCardKeywords(): Promise<string[]> {
  const cards = await prisma.card.findMany({
    where: { keywords: { isEmpty: false } },
    select: { keywords: true },
  });
  const allKeywords = new Set<string>();
  for (const card of cards) {
    for (const kw of card.keywords) {
      allKeywords.add(kw);
    }
  }
  return Array.from(allKeywords).sort();
}

export async function getCardGroups(): Promise<string[]> {
  const cards = await prisma.card.findMany({
    where: { group: { not: null } },
    select: { group: true },
    distinct: ['group'],
    orderBy: { group: 'asc' },
  });
  return cards.map((c) => c.group).filter((g): g is string => g !== null);
}

export interface CardSet {
  code: string;
  cardCount: number;
}

export async function getCardSets(): Promise<CardSet[]> {
  const groups = await prisma.card.groupBy({
    by: ['set'],
    _count: { id: true },
    orderBy: { set: 'asc' },
  });
  return groups.map((g) => ({ code: g.set, cardCount: g._count.id }));
}

export async function getCardsBySet(setCode: string): Promise<Card[]> {
  return prisma.card.findMany({
    where: { set: setCode },
    orderBy: { cardNumber: 'asc' },
  });
}
