import { prisma } from '@/lib/prisma';
import type { CollectionCard, Card, CollectionStatus } from '@prisma/client';
import type { AddToCollectionInput, UpdateCollectionCardInput } from '@/lib/validators/collection';

export type CollectionCardWithCard = CollectionCard & { card: Card };

export interface CollectionStats {
  totalOwned: number;
  totalWishlist: number;
  totalTrade: number;
  uniqueOwned: number;
  totalCards: number;
  completionPercent: number;
}

export async function getUserCollection(
  userId: string,
  status?: CollectionStatus,
  search?: string
): Promise<CollectionCardWithCard[]> {
  return prisma.collectionCard.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(search && {
        card: {
          OR: [
            { nameEn: { contains: search, mode: 'insensitive' as const } },
            { nameFr: { contains: search, mode: 'insensitive' as const } },
            { id: { contains: search, mode: 'insensitive' as const } },
          ],
        },
      }),
    },
    include: { card: true },
    orderBy: { card: { cardNumber: 'asc' } },
  });
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [owned, wishlist, trade, totalCardsResult] = await Promise.all([
    prisma.collectionCard.findMany({
      where: { userId, status: 'OWNED' },
      select: { cardId: true, quantity: true },
    }),
    prisma.collectionCard.aggregate({
      where: { userId, status: 'WISHLIST' },
      _sum: { quantity: true },
    }),
    prisma.collectionCard.aggregate({
      where: { userId, status: 'TRADE' },
      _sum: { quantity: true },
    }),
    prisma.card.count(),
  ]);

  const totalOwned = owned.reduce((sum, c) => sum + c.quantity, 0);
  const uniqueOwned = new Set(owned.map((c) => c.cardId)).size;

  return {
    totalOwned,
    totalWishlist: wishlist._sum.quantity || 0,
    totalTrade: trade._sum.quantity || 0,
    uniqueOwned,
    totalCards: totalCardsResult,
    completionPercent: totalCardsResult > 0
      ? Math.round((uniqueOwned / totalCardsResult) * 100)
      : 0,
  };
}

export async function addToCollection(
  userId: string,
  input: AddToCollectionInput
): Promise<CollectionCard> {
  const card = await prisma.card.findUnique({ where: { id: input.cardId } });
  if (!card) throw new Error('Card not found');

  return prisma.collectionCard.upsert({
    where: {
      userId_cardId_status_condition_language: {
        userId,
        cardId: input.cardId,
        status: input.status,
        condition: input.condition,
        language: input.language,
      },
    },
    create: {
      userId,
      cardId: input.cardId,
      status: input.status,
      condition: input.condition,
      quantity: input.quantity,
      language: input.language,
    },
    update: {
      quantity: { increment: input.quantity },
    },
  });
}

export async function updateCollectionCard(
  id: string,
  userId: string,
  input: UpdateCollectionCardInput
): Promise<CollectionCard> {
  const entry = await prisma.collectionCard.findUnique({ where: { id } });
  if (!entry) throw new Error('Collection entry not found');
  if (entry.userId !== userId) throw new Error('Not authorized');

  return prisma.collectionCard.update({
    where: { id },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.condition !== undefined && { condition: input.condition }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.language !== undefined && { language: input.language }),
    },
  });
}

export async function removeFromCollection(
  id: string,
  userId: string
): Promise<void> {
  const entry = await prisma.collectionCard.findUnique({ where: { id } });
  if (!entry) throw new Error('Collection entry not found');
  if (entry.userId !== userId) throw new Error('Not authorized');

  await prisma.collectionCard.delete({ where: { id } });
}
