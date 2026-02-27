import { prisma } from '@/lib/prisma';
import type { Deck, DeckCard, Card } from '@prisma/client';
import type { CreateDeckInput, UpdateDeckInput } from '@/lib/validators/deck';

// Types for expanded deck data
export type DeckWithCardCount = Deck & { _count: { cards: number } };
export type DeckCardWithCard = DeckCard & { card: Card };
export type DeckWithCards = Deck & { cards: DeckCardWithCard[] };

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

export async function getUserDecks(userId: string): Promise<DeckWithCardCount[]> {
  return prisma.deck.findMany({
    where: { userId },
    include: { _count: { select: { cards: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getDeckBySlug(slug: string): Promise<DeckWithCards | null> {
  return prisma.deck.findUnique({
    where: { slug },
    include: {
      cards: {
        include: { card: true },
        orderBy: { card: { cardNumber: 'asc' } },
      },
    },
  });
}

export async function getDeckById(id: string): Promise<DeckWithCards | null> {
  return prisma.deck.findUnique({
    where: { id },
    include: {
      cards: {
        include: { card: true },
        orderBy: { card: { cardNumber: 'asc' } },
      },
    },
  });
}

export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug(input.name);
    try {
      return await prisma.deck.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic ?? false,
          slug,
          userId,
        },
      });
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002' && attempt < 2) {
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to generate unique slug');
}

export async function updateDeck(
  deckId: string,
  userId: string,
  input: UpdateDeckInput
): Promise<Deck> {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) throw new Error('Deck not found');
  if (deck.userId !== userId) throw new Error('Not authorized');

  return prisma.deck.update({
    where: { id: deckId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
    },
  });
}

export async function deleteDeck(deckId: string, userId: string): Promise<void> {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) throw new Error('Deck not found');
  if (deck.userId !== userId) throw new Error('Not authorized');

  await prisma.deck.delete({ where: { id: deckId } });
}

export async function addCardToDeck(
  deckId: string,
  userId: string,
  cardId: string,
  quantity: number
): Promise<DeckCard> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: { cards: true },
  });
  if (!deck) throw new Error('Deck not found');
  if (deck.userId !== userId) throw new Error('Not authorized');

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error('Card not found');

  // Check total card count
  const existingEntry = deck.cards.find((dc) => dc.cardId === cardId);
  const currentTotal = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0);
  const addedQuantity = existingEntry ? quantity - existingEntry.quantity : quantity;

  if (currentTotal + addedQuantity > 30) {
    throw new Error('Deck is full (30 cards maximum)');
  }

  return prisma.deckCard.upsert({
    where: { deckId_cardId: { deckId, cardId } },
    create: { deckId, cardId, quantity },
    update: { quantity },
  });
}

export async function removeCardFromDeck(
  deckId: string,
  userId: string,
  cardId: string
): Promise<void> {
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck) throw new Error('Deck not found');
  if (deck.userId !== userId) throw new Error('Not authorized');

  await prisma.deckCard.delete({
    where: { deckId_cardId: { deckId, cardId } },
  });
}
