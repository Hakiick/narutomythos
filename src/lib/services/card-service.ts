import { prisma } from '@/lib/prisma';
import type { Card, CardType, Rarity } from '@prisma/client';

export interface CardFilters {
  type?: CardType;
  rarity?: Rarity;
  search?: string;
  group?: string;
}

export async function getCards(filters: CardFilters = {}): Promise<Card[]> {
  return prisma.card.findMany({
    where: {
      ...(filters.type && { type: filters.type }),
      ...(filters.rarity && { rarity: filters.rarity }),
      ...(filters.group && { group: filters.group }),
      ...(filters.search && {
        OR: [
          { nameEn: { contains: filters.search, mode: 'insensitive' as const } },
          { nameFr: { contains: filters.search, mode: 'insensitive' as const } },
          { id: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    },
    orderBy: { cardNumber: 'asc' },
  });
}

export async function getCardById(id: string): Promise<Card | null> {
  return prisma.card.findUnique({
    where: { id },
  });
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
