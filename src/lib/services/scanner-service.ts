import { prisma } from '@/lib/prisma';
import type { Card } from '@prisma/client';

export async function getCardByCode(code: string): Promise<Card | null> {
  return prisma.card.findUnique({
    where: { id: code },
  });
}

export async function getCardsByCodeBatch(codes: string[]): Promise<Card[]> {
  return prisma.card.findMany({
    where: { id: { in: codes } },
    orderBy: { cardNumber: 'asc' },
  });
}
